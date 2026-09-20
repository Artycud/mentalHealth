// Creates the admin login. Run:  npm run admin:setup   (or add --write to save it)
//
// Asks for a username and a password, and prints the three lines the server needs in
// .env.local: ADMIN_USERNAME, ADMIN_PASSWORD_HASH and SESSION_SECRET. The password
// itself is never written anywhere; only its hash is (BRIEF §11, §12).
//
//   npm run admin:setup                  prints the three lines
//   npm run admin:setup -- --write       also saves them into .env.local
//   npm run admin:setup -- --write path  ...or into another file
//
// For scripts, ADMIN_SETUP_USERNAME and ADMIN_SETUP_PASSWORD skip the questions.
// Changing the password or the secret signs everyone out of the panel.
import fs from 'node:fs';
import path from 'node:path';

import { hashPassword, newSecret } from '../lib/auth.ts';

const MIN_LENGTH = 10;

/** Reads a line without echoing it (in a terminal), or plainly from a pipe. */
function ask(prompt, { hidden = false } = {}) {
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    const stdin = process.stdin;
    if (!hidden || !stdin.isTTY) {
      stdin.setEncoding('utf8');
      let buf = '';
      const onData = (chunk) => {
        buf += chunk;
        const nl = buf.indexOf('\n');
        if (nl >= 0) {
          stdin.off('data', onData);
          stdin.pause();
          resolve(buf.slice(0, nl).replace(/\r$/, ''));
        }
      };
      stdin.on('data', onData);
      stdin.resume();
      return;
    }
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    let value = '';
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === '\r' || ch === '\n') {
          stdin.setRawMode(false);
          stdin.off('data', onData);
          stdin.pause();
          process.stdout.write('\n');
          resolve(value);
          return;
        }
        if (ch === '\u0003') process.exit(130); // Ctrl-C
        if (ch === '\u007f' || ch === '\b') value = [...value].slice(0, -1).join('');
        else value += ch;
      }
    };
    stdin.on('data', onData);
  });
}

const args = process.argv.slice(2);
const writeIndex = args.indexOf('--write');
const target = writeIndex >= 0 ? path.resolve(args[writeIndex + 1] && !args[writeIndex + 1].startsWith('--') ? args[writeIndex + 1] : '.env.local') : null;

let username = process.env.ADMIN_SETUP_USERNAME;
let password = process.env.ADMIN_SETUP_PASSWORD;

if (username === undefined) username = (await ask('Username for the admin [admin]: ')).trim() || 'admin';
if (password === undefined) {
  password = await ask(`Password (at least ${MIN_LENGTH} characters, typing is hidden): `, { hidden: true });
  const again = await ask('Type it again: ', { hidden: true });
  if (password !== again) {
    console.error('The two passwords are different. Nothing was saved. Run it again.');
    process.exit(1);
  }
}
if ([...password].length < MIN_LENGTH) {
  console.error(`That password is too short. Use at least ${MIN_LENGTH} characters: a few words is easy to remember and hard to guess.`);
  process.exit(1);
}
if (password.toLowerCase().includes(username.toLowerCase())) {
  console.error('The password must not contain the username.');
  process.exit(1);
}

const lines = {
  ADMIN_USERNAME: username,
  ADMIN_PASSWORD_HASH: await hashPassword(password),
  SESSION_SECRET: newSecret(),
};

if (target) {
  // Keep every other line as it is; replace these three, or add them.
  const existing = fs.existsSync(target) ? fs.readFileSync(target, 'utf8').split(/\r?\n/) : [];
  const kept = existing.filter((l) => !Object.keys(lines).some((k) => l.startsWith(`${k}=`)));
  while (kept.length && kept[kept.length - 1] === '') kept.pop();
  const out = [...kept, ...(kept.length ? [''] : []), ...Object.entries(lines).map(([k, v]) => `${k}=${v}`)].join('\n') + '\n';
  fs.writeFileSync(target, out, { mode: 0o600 });
  try {
    fs.chmodSync(target, 0o600);
  } catch {
    /* Windows has no such permission bits */
  }
  console.log(`\nSaved to ${target}. Restart the app for it to take effect.`);
} else {
  console.log('\nAdd these three lines to .env.local on the server, then restart the app:\n');
  for (const [k, v] of Object.entries(lines)) console.log(`${k}=${v}`);
  console.log('\nThe password is not stored anywhere. Keep it safe: if it is lost, run this again.');
}
