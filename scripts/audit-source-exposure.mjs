// Internal release check. Never bundle this script with the storefront.
import {readdir, readFile} from 'node:fs/promises';
import path from 'node:path';
const forbidden = /tvcmall/i;
const matches = [];
async function scan(target) {
 const stat = await import('node:fs/promises').then(({stat})=>stat(target)).catch(()=>null);
 if (!stat) throw new Error(`Missing audit target: ${target}`);
 if (stat.isDirectory()) {
  for (const file of await readdir(target)) await scan(path.join(target,file));
 } else {
  const data=await readFile(target);
  if (forbidden.test(data.toString('utf8'))) matches.push(target);
 }
}
for (const target of ['app','public','server.js',...process.argv.includes('--built') ? ['dist/client','dist/server'] : []]) await scan(target);
if (matches.length) { console.error('Blocked reference found in:',matches); process.exit(1); }
console.log('PASS: no internal reference in storefront sources'+(process.argv.includes('--built')?' or build artifacts':''));
