// Tests for lib/qr.ts, the booth's own QR encoder. Run:  npm run test:qr
//
// The fixtures below are SHA-256 hashes of codes made by an independent library
// (segno 1.6.6, level M, byte mode; with one quirk patched: segno adds a whole zero
// byte of padding when the data already ends on a byte boundary, which the
// standard does not, and which changes nothing a scanner reads), one per mask, for
// six addresses that between
// them use every version this encoder supports (1–6, so one, two and four
// error-correction blocks). Matching all of them module for module means the data,
// the error correction, the interleaving, the placement, the masks and the format
// bits are all right. A phone scan of the real TV (see docs/booth-day.md) is the
// last check.

import { createHash } from 'node:crypto';

const { encodeQr } = await import('../lib/qr.ts');

let fail = 0;
const check = (label, ok, detail = '') => {
  if (!ok) fail += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${!ok && detail ? `\n        ${detail}` : ''}`);
};
const hash = (m) => createHash('sha256').update(m.map((row) => row.map((v) => (v ? '1' : '0')).join('')).join('')).digest('hex');

const FIXTURES = [
  { text: "HELLO", version: 1, size: 21, sha256: [
    '26af6f00ea417ee57ac6e345307b4deb10c0e71916f1749ce8eab417e7b70d7f',
    '33bf17da25aa02942e8b324e2678b983c33047b05b3823d41c2942e58753f1bb',
    '28bc72b3a74e226d925fc60e14807402ac1b5ae878e55637a20347d5a77284d4',
    '3e46edc4531321e7fd0376f170a34f7401b798e06a75c1eef7fcc77744552966',
    '32fbc389880456d584e32bdf2c31372391c92f9f853e119a75bec5e14c380a23',
    '718e684a14aed8305976f2c1c033c22c08d33fb15bd97ba07eeb8b32f07a5744',
    'e8d4faf82e26c86e2e560ff4684a03d9f418120e126bb90d450adb3d54acff3a',
    '83074c1d6602c80967ac6afbafcb610622863b69f144ca53da8ffdd1d3a31fa8',
  ] },
  { text: "https://mentalhealth.satitm.chula.ac.th/", version: 3, size: 29, sha256: [
    '2b0d6ee6a641799e72a61068ba51e6d0654d8f6639cb3d49f6d25ace80f5ec01',
    'a11d525bdce5fd53d7af185cb6d12aa6ad626ba88f13d3b33a539b761307ff97',
    '18fe47e09f6bfa2b4e8de28e52b91c9dce653e3bb134ee7c64214e580e778d72',
    '86aa141e45f1697ecd9fdbf1758224ab89d23e65b4918c1776a2b14220add823',
    '668d93b4dedd24d06cd4e0127847d30d09a82ce8d2d05cf152c1963322615e92',
    '4b5a840742aa9173e2627bf01024a311fb0af41ca9882e76dcd752e722192996',
    '91a387f2607c8b4e060adfd19637331facf82e250921b8ac0f3c8c6152a08bd3',
    'ac1f4101e9765c7f2093d99047799e8b5de2610d26d77b822eb5190a91365acb',
  ] },
  { text: "http://localhost:3000/", version: 2, size: 25, sha256: [
    '258cc736f4060254fcfdf3aa3487a047406f20fbd9649d38a3bfe4ac0ae146cf',
    '3f8881c919e3f5aa915f0de77d36aed324b308353015bab8fe5ddbf0c7e1dc1e',
    '95b4ee433f122813ff74f14bf52d732778507c47e19a76e4828c872b5c223a31',
    '5990c1bc2addac9d6c36bfcfd81e2819a58989b360c4d4c8c1ae905c5c2deb80',
    '4e80aa19e307914abc10001306049bdfd764e3b1c0d665aa1a2d6fe3fff18b3e',
    'a32f295287f5b432ea501e192385f7f49c2239a2cc5e252fd5e10290e42058c0',
    'dddcc3b64dbcc07174aaebc4d89a979ad18e3ae0e7553cbe5bca55d6480a60fa',
    '0708112dc56aef8dec2744fae572f98ca95aed68a389c9035b39f6adc9b10cbd',
  ] },
  { text: "https://mentalhealth.satitm.chula.ac.th/booth/display", version: 4, size: 33, sha256: [
    'ee4456c464c24d0353bb4a7906f9e2bee4ea49118088e8964665214e4bb400e8',
    '3691ca2d353fa88ab551894d0103c841e442f718de132a6f3cf1e16156b2ef34',
    '01506e0701c5e8a8bfbf4049330009eb02ace21614b9f395c4ae52c26d12d95e',
    'da515593f58ff08042516f7a8d15cd894bf727d75949b641b9218f137212b6f2',
    'bc97d606986f52d0afbdb52d6d2eabaca4c3228465548695925323f8a99e4833',
    '28496d112b4850254a67a60a765d5c05cfc7eaf5da63e9104f81b822a80faea6',
    '3935e5d4c0a66c554b6c313c8c0e0d97eaa8b5aa487d78761bef3c0976f66f9e',
    'a83ef76ddb4a4d55b828837ef97778f80126acb16240d2661022a0d894aa1863',
  ] },
  { text: "https://mentalhealth.satitm.chula.ac.th/bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", version: 5, size: 37, sha256: [
    '7c5f1321c3d69f323c0c49b5084052a9dc229edcc6bc5cd2cda1a89087d478b9',
    '939da6f1d55dd32fee1155088330e97d4d0a53f755faabea2fefac9fb722e345',
    'e38ff077dd5ad9ff5736d6aaeb6b3d5753d3449b41e503ecc62902d597e17cbd',
    'e6707f466e168e14c71ed373483778229b87dd161508bc1801ff818aa6fb4e99',
    'ff8467b6cfe8d112215baaa5e37113dae64ade88a25bb98a815abfc95039772b',
    'e05dd5d6bf653b3f89055ad5c73acf8f593473a0b6f5ab40e3dbd263944ed20b',
    'c1f54b7332398451cc6dbbef0e51e55806cc4a2bdd6c14f9b3fd090fdaae202b',
    'e5c32214b11e292a99c75dd6ce7a94e0a177752191e7c325b586625e411be8a8',
  ] },
  { text: "https://mentalhealth.satitm.chula.ac.th/cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc", version: 6, size: 41, sha256: [
    '55dced7cc5941870505d8dab23773fe4980344af21783c1323b21482dfbfda96',
    'cc174fb78de8989384c0375011873599127d92279faf7b869bb1799aeac8f8e9',
    '8b555abfc1dc35854aadd402f1a4142d7cc1ec1cb46962f2c7a1558432dce53a',
    '7ab6801ab87159149a844ab7504df291860eed0f3ea22f6fa594a45454fa73b9',
    'a82129aeabea59908dae4ae9d92ad539c66472d874926cc55a4261ba1e363fa8',
    'acbf4108916b27d6cbbd9aa92579c15f45587fc1b41d08acfcc72ec345cffbc6',
    '220e4e52bb423ac54cdb803e20a3f1c968e61664a187bd6e2dc1b487e783d953',
    '406c27538548f09770de62862a955ef3def10c219eac2aa40e181368cfd35b2b',
  ] },
];

for (const f of FIXTURES) {
  let matches = 0;
  for (let mask = 0; mask < 8; mask += 1) {
    const m = encodeQr(f.text, { mask });
    if (m.length === f.size && hash(m) === f.sha256[mask]) matches += 1;
    else if (matches === mask) check(`${f.text} (v${f.version}) mask ${mask}`, false, `size ${m.length}, want ${f.size}`);
  }
  check(`"${f.text.length > 44 ? `${f.text.slice(0, 41)}…` : f.text}" matches the reference for all 8 masks (version ${f.version})`, matches === 8, `${matches} of 8`);

  // With no mask given it picks one by penalty; whichever it picks must be one of
  // the eight valid codes above.
  const auto = hash(encodeQr(f.text));
  check(`  and its own mask choice is one of those valid codes`, f.sha256.includes(auto));
}

{
  const m = encodeQr('https://mentalhealth.satitm.chula.ac.th/');
  const finder = (x0, y0) => {
    for (let y = 0; y < 7; y += 1) {
      for (let x = 0; x < 7; x += 1) {
        const d = Math.max(Math.abs(x - 3), Math.abs(y - 3));
        if (m[y0 + y][x0 + x] !== (d !== 2)) return false;
      }
    }
    return true;
  };
  const n = m.length;
  check('the three finder patterns are in their corners', finder(0, 0) && finder(n - 7, 0) && finder(0, n - 7));
}

{
  let threw = false;
  try {
    encodeQr('x'.repeat(200));
  } catch {
    threw = true;
  }
  check('an address too long for version 6 is refused, not drawn wrong', threw);
}

console.log(fail ? `\n${fail} FAILED` : '\nall passed');
process.exit(fail ? 1 : 0);
