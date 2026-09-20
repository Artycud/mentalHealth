// Forgot the admin password? Run:  npm run admin:reset
//
// Removes the admin account that was set up in the browser, so the one-time setup page
// comes back: open /admin, and it asks for a new username and password. On a live
// server the setup page also asks for a setup code, which this prints again in the
// server's log the next time /admin is opened. Sessions, dates and the booth account
// are not touched.
//
// It cannot remove an account set by ADMIN_USERNAME and ADMIN_PASSWORD_HASH in .env.local:
// to change that one, edit those lines (or run `npm run admin:setup -- --write`) and
// restart the app.
import readline from 'node:readline/promises';

import { getStoredAdmin, resetAdminAccount } from '../lib/auth.ts';

const stored = await getStoredAdmin();
if (!stored) {
  console.log('There is no admin account stored in the database, so there is nothing to reset.');
  if (process.env.ADMIN_USERNAME) console.log('The admin comes from ADMIN_USERNAME in the environment: change it there.');
  process.exit(0);
}

if (!process.argv.includes('--yes')) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = (await rl.question(`This removes the admin account "${stored.username}". Type RESET to continue: `)).trim();
  rl.close();
  if (answer !== 'RESET') {
    console.log('Nothing was changed.');
    process.exit(1);
  }
}

await resetAdminAccount();
console.log('\nThe admin account was removed. Open /admin to set up a new one.');
if (process.env.ADMIN_USERNAME) console.log('Note: ADMIN_USERNAME is set in the environment, and that account still works.');
process.exit(0);
