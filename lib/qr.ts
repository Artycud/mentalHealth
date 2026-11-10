/**
 * A small QR code encoder, written here so the booth needs no new dependency
 * (BRIEF §0, §2). It does only what the booth needs: a URL, in byte mode, at
 * error-correction level M (about 15% of the code can be damaged or covered and it
 * still scans), in versions 1 to 6 (up to 106 bytes). That covers any address this
 * site will print.
 *
 * It follows ISO/IEC 18004 and the structure of Project Nayuki's reference encoder.
 * scripts/test-qr.mjs checks its output, module for module, against codes made by an
 * independent library, for every mask.
 *
 * Relative-import friendly (no `@/`), so the test can load it in plain Node.
 */

/** A square of modules, `true` for dark. Row-major: `modules[y][x]`. */
export type QrMatrix = boolean[][];

/** Error-correction codewords per block, and number of blocks, at level M, by version. */
const EC_PER_BLOCK = [0, 10, 16, 26, 18, 24, 16];
const NUM_BLOCKS = [0, 1, 1, 1, 2, 2, 4];
/** Where alignment patterns sit, by version (version 1 has none). */
const ALIGN = [[], [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34]];
/** Level M's two format bits. */
const ECL_M = 0;
const MAX_VERSION = 6;

/** Modules available for data and error correction, after the function patterns. */
function rawDataModules(ver: number): number {
  let result = (16 * ver + 128) * ver + 64;
  if (ver >= 2) {
    const numAlign = Math.floor(ver / 7) + 2;
    result -= (25 * numAlign - 10) * numAlign - 55;
  }
  return result;
}

const totalCodewords = (ver: number) => Math.floor(rawDataModules(ver) / 8);
const dataCodewords = (ver: number) => totalCodewords(ver) - EC_PER_BLOCK[ver] * NUM_BLOCKS[ver];

// ---- Reed–Solomon over GF(256), polynomial 0x11D ----

function gfMultiply(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i -= 1) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}

function rsDivisor(degree: number): number[] {
  const result = new Array<number>(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i += 1) {
    for (let j = 0; j < result.length; j += 1) {
      result[j] = gfMultiply(result[j], root);
      if (j + 1 < result.length) result[j] ^= result[j + 1];
    }
    root = gfMultiply(root, 0x02);
  }
  return result;
}

function rsRemainder(data: number[], divisor: number[]): number[] {
  const result = divisor.map(() => 0);
  for (const b of data) {
    const factor = b ^ (result.shift() as number);
    result.push(0);
    divisor.forEach((coef, i) => {
      result[i] ^= gfMultiply(coef, factor);
    });
  }
  return result;
}

// ---- data ----

/** UTF-8 bytes, then mode, length, terminator and padding, as codewords. */
function encodeData(text: string, ver: number): number[] {
  const bytes = Array.from(new TextEncoder().encode(text));
  const bits: number[] = [];
  const push = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i -= 1) bits.push((value >>> i) & 1);
  };
  push(0b0100, 4); // byte mode
  push(bytes.length, 8); // character count: 8 bits in versions 1–9
  for (const b of bytes) push(b, 8);

  const capacity = dataCodewords(ver) * 8;
  push(0, Math.min(4, capacity - bits.length)); // terminator
  push(0, (8 - (bits.length % 8)) % 8); // to a whole byte
  for (let pad = 0xec; bits.length < capacity; pad ^= 0xec ^ 0x11) push(pad, 8);

  const codewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    codewords.push(bits.slice(i, i + 8).reduce((acc, bit) => (acc << 1) | bit, 0));
  }
  return codewords;
}

/** Split into blocks, add each block's error correction, and interleave. */
function withErrorCorrection(data: number[], ver: number): number[] {
  const numBlocks = NUM_BLOCKS[ver];
  const ecLen = EC_PER_BLOCK[ver];
  const raw = totalCodewords(ver);
  const numShort = numBlocks - (raw % numBlocks);
  const shortLen = Math.floor(raw / numBlocks);
  const divisor = rsDivisor(ecLen);

  const blocks: number[][] = [];
  for (let i = 0, k = 0; i < numBlocks; i += 1) {
    const dat = data.slice(k, k + shortLen - ecLen + (i < numShort ? 0 : 1));
    k += dat.length;
    const ecc = rsRemainder(dat, divisor);
    if (i < numShort) dat.push(0); // a placeholder, skipped below
    blocks.push(dat.concat(ecc));
  }

  const result: number[] = [];
  for (let i = 0; i < blocks[0].length; i += 1) {
    blocks.forEach((block, j) => {
      if (i !== shortLen - ecLen || j >= numShort) result.push(block[i]);
    });
  }
  return result;
}

// ---- the grid ----

class Grid {
  readonly ver: number;
  readonly size: number;
  readonly modules: boolean[][];
  readonly isFunction: boolean[][];

  // A plain field, not a parameter property, so Node can strip the types (the test
  // runs this file without a build step).
  constructor(ver: number) {
    this.ver = ver;
    this.size = ver * 4 + 17;
    this.modules = Array.from({ length: this.size }, () => new Array<boolean>(this.size).fill(false));
    this.isFunction = Array.from({ length: this.size }, () => new Array<boolean>(this.size).fill(false));
  }

  setFunction(x: number, y: number, dark: boolean) {
    this.modules[y][x] = dark;
    this.isFunction[y][x] = true;
  }

  drawFunctionPatterns() {
    const { size } = this;
    for (let i = 0; i < size; i += 1) {
      this.setFunction(6, i, i % 2 === 0);
      this.setFunction(i, 6, i % 2 === 0);
    }
    this.drawFinder(3, 3);
    this.drawFinder(size - 4, 3);
    this.drawFinder(3, size - 4);

    const pos = ALIGN[this.ver];
    const n = pos.length;
    for (let i = 0; i < n; i += 1) {
      for (let j = 0; j < n; j += 1) {
        // Not over the three finder corners.
        if ((i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0)) continue;
        this.drawAlignment(pos[i], pos[j]);
      }
    }
    this.drawFormatBits(0); // reserves the area; redrawn with the real mask later
  }

  drawFinder(x: number, y: number) {
    for (let dy = -4; dy <= 4; dy += 1) {
      for (let dx = -4; dx <= 4; dx += 1) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        const xx = x + dx;
        const yy = y + dy;
        if (xx >= 0 && xx < this.size && yy >= 0 && yy < this.size) {
          this.setFunction(xx, yy, dist !== 2 && dist !== 4);
        }
      }
    }
  }

  drawAlignment(x: number, y: number) {
    for (let dy = -2; dy <= 2; dy += 1) {
      for (let dx = -2; dx <= 2; dx += 1) {
        this.setFunction(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }
  }

  drawFormatBits(mask: number) {
    const data = (ECL_M << 3) | mask;
    let rem = data;
    for (let i = 0; i < 10; i += 1) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const bits = ((data << 10) | rem) ^ 0x5412;
    const bit = (i: number) => ((bits >>> i) & 1) !== 0;
    const { size } = this;

    for (let i = 0; i <= 5; i += 1) this.setFunction(8, i, bit(i));
    this.setFunction(8, 7, bit(6));
    this.setFunction(8, 8, bit(7));
    this.setFunction(7, 8, bit(8));
    for (let i = 9; i < 15; i += 1) this.setFunction(14 - i, 8, bit(i));

    for (let i = 0; i < 8; i += 1) this.setFunction(size - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i += 1) this.setFunction(8, size - 15 + i, bit(i));
    this.setFunction(8, size - 8, true); // the dark module, always dark
  }

  drawCodewords(data: number[]) {
    const { size } = this;
    let i = 0;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5; // skip the vertical timing column
      for (let vert = 0; vert < size; vert += 1) {
        for (let j = 0; j < 2; j += 1) {
          const x = right - j;
          const upward = ((right + 1) & 2) === 0;
          const y = upward ? size - 1 - vert : vert;
          if (!this.isFunction[y][x] && i < data.length * 8) {
            this.modules[y][x] = ((data[i >>> 3] >>> (7 - (i & 7))) & 1) !== 0;
            i += 1;
          }
        }
      }
    }
  }

  /** XORs a mask over the data modules. Applying it twice undoes it. */
  applyMask(mask: number) {
    for (let y = 0; y < this.size; y += 1) {
      for (let x = 0; x < this.size; x += 1) {
        if (this.isFunction[y][x]) continue;
        let invert: boolean;
        switch (mask) {
          case 0: invert = (x + y) % 2 === 0; break;
          case 1: invert = y % 2 === 0; break;
          case 2: invert = x % 3 === 0; break;
          case 3: invert = (x + y) % 3 === 0; break;
          case 4: invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
          case 5: invert = ((x * y) % 2) + ((x * y) % 3) === 0; break;
          case 6: invert = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0; break;
          default: invert = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0; break;
        }
        if (invert) this.modules[y][x] = !this.modules[y][x];
      }
    }
  }

  /** The standard's penalty score: lower scans more reliably. */
  penalty(): number {
    const { size, modules } = this;
    let score = 0;
    const line = (get: (i: number) => boolean) => {
      // N1: runs of five or more of one colour.
      let run = 1;
      for (let i = 1; i <= size; i += 1) {
        if (i < size && get(i) === get(i - 1)) {
          run += 1;
        } else {
          if (run >= 5) score += 3 + (run - 5);
          run = 1;
        }
      }
      // N3: a finder-like 1:1:3:1:1 with four light modules on either side.
      const pattern = [true, false, true, true, true, false, true];
      for (let i = 0; i + 7 <= size; i += 1) {
        if (!pattern.every((p, k) => get(i + k) === p)) continue;
        const lightBefore = [1, 2, 3, 4].every((k) => i - k < 0 || !get(i - k));
        const lightAfter = [0, 1, 2, 3].every((k) => i + 7 + k >= size || !get(i + 7 + k));
        if (lightBefore) score += 40;
        if (lightAfter) score += 40;
      }
    };
    for (let y = 0; y < size; y += 1) line((x) => modules[y][x]);
    for (let x = 0; x < size; x += 1) line((y) => modules[y][x]);

    // N2: 2×2 blocks of one colour.
    for (let y = 0; y < size - 1; y += 1) {
      for (let x = 0; x < size - 1; x += 1) {
        const c = modules[y][x];
        if (c === modules[y][x + 1] && c === modules[y + 1][x] && c === modules[y + 1][x + 1]) score += 3;
      }
    }

    // N4: how far the dark share is from half.
    const dark = modules.reduce((sum, row) => sum + row.filter(Boolean).length, 0);
    const total = size * size;
    const k = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
    score += Math.max(0, k) * 10;
    return score;
  }
}

/**
 * Encode text as a QR code. Picks the smallest version that fits and, unless one is
 * given (for tests), the mask with the lowest penalty.
 */
export function encodeQr(text: string, opts: { mask?: number; version?: number } = {}): QrMatrix {
  const length = new TextEncoder().encode(text).length;
  let ver = opts.version ?? 1;
  // Mode (4 bits) + count (8 bits) + the bytes must fit the data codewords.
  while (ver <= MAX_VERSION && 12 + length * 8 > dataCodewords(ver) * 8) ver += 1;
  if (ver > MAX_VERSION) throw new Error(`qr: "${text}" is too long for this encoder`);

  const codewords = withErrorCorrection(encodeData(text, ver), ver);
  const grid = new Grid(ver);
  grid.drawFunctionPatterns();
  grid.drawCodewords(codewords);

  let mask = opts.mask;
  if (mask === undefined) {
    let best = Infinity;
    for (let m = 0; m < 8; m += 1) {
      grid.applyMask(m);
      grid.drawFormatBits(m);
      const p = grid.penalty();
      if (p < best) {
        best = p;
        mask = m;
      }
      grid.applyMask(m); // undo
    }
  }
  grid.applyMask(mask as number);
  grid.drawFormatBits(mask as number);
  return grid.modules;
}
