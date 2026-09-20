// Tests for passwords, signed cookies, the lockout and the booth account. Run:  npm run test:auth
//
// Uses a scratch database file that is deleted before and after.
import fs from 'node:fs';

const FILE = 'data/test-auth.db';
process.env.DATABASE_URL = `file:./${FILE}`;
const wipe = () => {
  for (const suffix of ['', '-journal', '-wal', '-shm']) {
    try {
      fs.rmSync(FILE + suffix, { force: true });
    } catch {
      /* best effort: Windows may hold the file a moment longer */
    }
  }
};
wipe();

const auth = await import('../lib/auth.ts');
const { closeDb } = await import('../lib/db.ts');
const {
  LOCK_MS, MAX_FAILURES, SESSION_MS, attemptLogin, generateBoothPassword, getBoothAccount, hashPassword, lockRemainingMs,
  newSecret, passwordVersion, regenerateBoothPassword, setBoothUsername, signToken, validBoothUsername, verifyPassword, verifyToken,
} = auth;

let fail = 0;
const check = (label, ok, detail = '') => {
  if (!ok) fail += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${!ok && detail ? `\n        ${detail}` : ''}`);
};
const eq = (label, got, want) => check(label, JSON.stringify(got) === JSON.stringify(want), `got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);

// ---- 1. passwords ----
{
  const hash = await hashPassword('correct horse battery');
  check('a hash carries no "$" (a "$" in .env.local is read as a variable and corrupts it)', !hash.includes('$'), hash);
  check('a hash never contains the password', !hash.includes('correct'));
  check('the right password verifies', await verifyPassword('correct horse battery', hash));
  check('a wrong password does not', !(await verifyPassword('correct horse batterx', hash)));
  check('a different case does not', !(await verifyPassword('Correct horse battery', hash)));
  const again = await hashPassword('correct horse battery');
  check('the same password hashes differently each time (salted)', again !== hash && (await verifyPassword('correct horse battery', again)));
  const thai = await hashPassword('รหัสลับของสภานักเรียน 2569');
  check('a Thai password works', await verifyPassword('รหัสลับของสภานักเรียน 2569', thai));
  check('an empty password does not verify', !(await verifyPassword('', hash)));
  for (const bad of ['', 'x', 'scrypt', 'scrypt.1.2.3', 'md5.16384.8.1.aaaa.bbbb', 'scrypt.16384.8.1..', 'scrypt.abc.8.1.aaaa.bbbb', 'scrypt.99999999999.8.1.aaaa.bbbb']) {
    check(`a malformed stored hash is "no", not a crash (${JSON.stringify(bad).slice(0, 34)})`, (await verifyPassword('x', bad)) === false);
  }
}

// ---- 2. signed cookies ----
{
  const secret = newSecret();
  check('a secret is long and has no "$"', secret.length >= 48 && !secret.includes('$'));
  const now = 1_800_000_000_000;
  const token = signToken({ role: 'admin', exp: now + SESSION_MS.admin, v: 'abc' }, secret);
  eq('a good token gives back its payload', verifyToken(token, secret, now), { role: 'admin', exp: now + SESSION_MS.admin, v: 'abc' });
  check('a token signed with another secret is refused', verifyToken(token, newSecret(), now) === null);
  check('an expired token is refused', verifyToken(token, secret, now + SESSION_MS.admin + 1) === null);
  check('and one exactly at its expiry is refused', verifyToken(token, secret, now + SESSION_MS.admin) === null);
  const [body, sig] = token.split('.');
  const forged = Buffer.from(JSON.stringify({ role: 'admin', exp: now + 1e12, v: 'abc' })).toString('base64url');
  check('a payload swapped for a longer expiry is refused (signature no longer matches)', verifyToken(`${forged}.${sig}`, secret, now) === null);
  check('a flipped bit in the signature is refused', verifyToken(`${body}.${sig.slice(0, -2)}AA`, secret, now) === null);
  for (const bad of [undefined, '', 'nodot', '.', 'a.b', `${body}.`, `.${sig}`, 'x'.repeat(5000)]) {
    check(`a junk token is refused, not a crash (${JSON.stringify(bad)?.slice(0, 20)})`, verifyToken(bad, secret, now) === null);
  }
  const wrongRole = signToken({ role: 'root', exp: now + 1000, v: 'x' }, secret);
  check('a token with an unknown role is refused even if correctly signed', verifyToken(wrongRole, secret, now) === null);
  check('with no secret at all nothing verifies', verifyToken(token, '', now) === null);
  eq('the admin is signed in for 8 hours, the booth for 12', [SESSION_MS.admin / 3_600_000, SESSION_MS.booth / 3_600_000], [8, 12]);
  check('the version fingerprint changes with the password hash', passwordVersion('hash-one') !== passwordVersion('hash-two') && passwordVersion('hash-one') === passwordVersion('hash-one'));
}

// ---- 3. the easy-to-type booth password ----
{
  const seen = new Set();
  let bad = '';
  for (let i = 0; i < 3000; i += 1) {
    const p = generateBoothPassword();
    seen.add(p);
    if (!/^[abcdefghjkmnpqrstuvwxyz23456789]{4}-[abcdefghjkmnpqrstuvwxyz23456789]{4}$/.test(p)) bad = p;
  }
  check('always "xxxx-xxxx" from an alphabet with no look-alikes (no 0 o 1 l i)', bad === '', bad);
  check('and they are not repeating', seen.size > 2990, `${seen.size} distinct of 3000`);
  check('usernames: plain lower case, 3 to 24 characters', validBoothUsername('booth') && validBoothUsername('canteen.tv') && !validBoothUsername('ab') && !validBoothUsername('Booth') && !validBoothUsername('a b c') && !validBoothUsername("a'; DROP"));
}

// ---- 4. the lockout ----
{
  const account = { username: 'council', hash: await hashPassword('the-right-one') };
  const good = { username: 'council', password: 'the-right-one' };
  const bad = { username: 'council', password: 'nope' };
  let t = 1_800_000_000_000;

  eq('a right login works', await attemptLogin('admin', good, account, t), 'ok');
  for (let i = 1; i < MAX_FAILURES; i += 1) eq(`wrong password #${i} is just "wrong"`, await attemptLogin('admin', bad, account, t), 'wrong');
  eq(`wrong password #${MAX_FAILURES} locks the account`, await attemptLogin('admin', bad, account, t), 'locked');
  check('the lock lasts about ten minutes', Math.abs((await lockRemainingMs('admin', t)) - LOCK_MS) < 5000, String(await lockRemainingMs('admin', t)));
  eq('while locked even the RIGHT password is refused', await attemptLogin('admin', good, account, t + 1000), 'locked');
  eq('still locked a minute before it ends', await attemptLogin('admin', good, account, t + LOCK_MS - 60_000), 'locked');
  eq('once it has run out the right password works again', await attemptLogin('admin', good, account, t + LOCK_MS + 1000), 'ok');
  check('and the lock is gone', (await lockRemainingMs('admin', t + LOCK_MS + 2000)) === 0);

  t += LOCK_MS * 3;
  for (let i = 0; i < MAX_FAILURES - 1; i += 1) await attemptLogin('admin', bad, account, t);
  eq('a right login after four misses works…', await attemptLogin('admin', good, account, t), 'ok');
  for (let i = 0; i < MAX_FAILURES - 1; i += 1) eq(`…and clears the count (wrong #${i + 1} again is not yet a lock)`, await attemptLogin('admin', bad, account, t), 'wrong');

  await attemptLogin('admin', good, account, t);
  eq('a wrong USERNAME counts as a failure too', await attemptLogin('admin', { username: 'someone', password: 'the-right-one' }, account, t), 'wrong');
  eq('and a right username with the wrong password', await attemptLogin('admin', bad, account, t), 'wrong');

  // the two accounts are locked separately
  const booth = { username: 'booth', hash: await hashPassword('kmnp-7xqz') };
  for (let i = 0; i < MAX_FAILURES; i += 1) await attemptLogin('booth', { username: 'booth', password: 'x' }, booth, t);
  eq('locking the booth account', await attemptLogin('booth', { username: 'booth', password: 'kmnp-7xqz' }, booth, t), 'locked');
  eq('does not lock the admin', await attemptLogin('admin', good, account, t), 'ok');

  // the lock is in the database, so it survives a restart
  await attemptLogin('booth', bad, booth, t);
  closeDb();
  eq('and it survives the app restarting (it is stored, not in memory)', await attemptLogin('booth', { username: 'booth', password: 'kmnp-7xqz' }, booth, t + 1000), 'locked');
}

// ---- 5. the booth account ----
{
  const start = await getBoothAccount();
  eq('before anything is set: the default username, and no password', [start.username, start.hash], ['booth', null]);
  const first = await regenerateBoothPassword();
  const a = await getBoothAccount();
  check('a generated password is stored only as a hash', a.hash !== null && !a.hash.includes(first) && a.hash.startsWith('scrypt.'));
  check('and the hash checks out against it', await verifyPassword(first, a.hash));
  const second = await regenerateBoothPassword();
  const b = await getBoothAccount();
  check('a new password replaces the old one', second !== first && (await verifyPassword(second, b.hash)) && !(await verifyPassword(first, b.hash)));
  check('and changes the version, so every old booth cookie stops working', passwordVersion(a.hash) !== passwordVersion(b.hash));
  await setBoothUsername('canteen.tv');
  eq('the username can be changed', (await getBoothAccount()).username, 'canteen.tv');
  check('renaming does not touch the password', (await getBoothAccount()).hash === b.hash);
  let refused = false;
  try {
    await setBoothUsername('No Good!');
  } catch {
    refused = true;
  }
  check('a bad username is refused', refused);
}

// ---- 6. the admin account, kept in the database (no terminal command needed) ----
{
  const {
    changeAdminPassword, clearSetupCode, createAdminAccount, forgetSessionSecret, getSessionSecret, getSetupCode, getStoredAdmin,
    passwordProblem, resetAdminAccount, validAdminUsername,
  } = auth;
  const codeFile = 'data/admin-setup-code-test-auth.txt';

  eq('before setup there is no stored admin', await getStoredAdmin(), null);
  check('usernames are 3 to 32 plain characters', validAdminUsername('council') && validAdminUsername('Student.Council_2569') && !validAdminUsername('ab') && !validAdminUsername('a b') && !validAdminUsername("x'; drop") && !validAdminUsername('a'.repeat(33)));
  eq('a short password is refused', passwordProblem('short', 'council'), 'too_short');
  eq('ten characters is enough', passwordProblem('0123456789', 'council'), null);
  eq('a Thai passphrase is counted in characters, not bytes (10 is enough)', passwordProblem('รหัสลับสภา', 'x'), null);
  eq('and 9 is not', passwordProblem('รหัสลับสภ', 'x'), 'too_short');
  eq('a password that contains the username is refused', passwordProblem('the council pass', 'council'), 'has_username');

  const first = await createAdminAccount('council', 'a long enough phrase');
  const second = await createAdminAccount('intruder', 'another long phrase');
  eq('the first setup makes the account and a second is refused', [first, second], [true, false]);
  const stored = await getStoredAdmin();
  check('the account is kept under the first username, as a hash', stored.username === 'council' && stored.hash.startsWith('scrypt.') && !stored.hash.includes('enough'));
  check('and the hash checks out', (await verifyPassword('a long enough phrase', stored.hash)) && !(await verifyPassword('another long phrase', stored.hash)));

  await resetAdminAccount();
  eq('a reset removes the account (so setup can be done again)', await getStoredAdmin(), null);
  const race = await Promise.all(Array.from({ length: 6 }, (_, i) => createAdminAccount(`user${i}xx`, 'a long enough phrase')));
  eq('six people submitting setup at the same moment: exactly one wins', race.filter(Boolean).length, 1);

  const before = await getStoredAdmin();
  const changedHash = await changeAdminPassword('a brand new passphrase');
  const after = await getStoredAdmin();
  check('changing the password keeps the username and stores a new hash', after.username === before.username && after.hash === changedHash && changedHash !== before.hash);
  check('the new password works and the old one does not', (await verifyPassword('a brand new passphrase', after.hash)) && !(await verifyPassword('a long enough phrase', after.hash)));
  check('and every cookie issued under the old password stops working', passwordVersion(before.hash) !== passwordVersion(after.hash));

  // the signing secret needs no configuration
  const secret = await getSessionSecret({});
  check('a fresh install makes its own long signing secret', secret.length >= 32 && !secret.includes('$'));
  eq('and it is the same next time', await getSessionSecret({}), secret);
  forgetSessionSecret();
  closeDb();
  eq('and after a restart (it is stored, not made up again)', await getSessionSecret({}), secret);
  eq('a good SESSION_SECRET in the environment wins', await getSessionSecret({ SESSION_SECRET: 'e'.repeat(40) }), 'e'.repeat(40));
  eq('a short one is ignored, not used', await getSessionSecret({ SESSION_SECRET: 'short' }), secret);

  // the setup code, for a live server
  fs.rmSync(codeFile, { force: true });
  const code = await getSetupCode();
  check('the setup code is easy to read out: xxxx-xxxx', /^[a-z2-9]{4}-[a-z2-9]{4}$/.test(code), code);
  eq('it stays the same until setup is done', await getSetupCode(), code);
  check('and is written to a file next to the database, for whoever has the machine', fs.existsSync(codeFile) && fs.readFileSync(codeFile, 'utf8').trim() === code);
  await clearSetupCode();
  check('setup done: the code and the file are gone', !fs.existsSync(codeFile) && (await getSetupCode()) !== code);
  await resetAdminAccount();
  check('a reset clears the code too', !fs.existsSync(codeFile));
}

closeDb();
wipe();
console.log(fail ? `\n${fail} FAILED` : '\nall passed');
process.exit(fail ? 1 : 0);
