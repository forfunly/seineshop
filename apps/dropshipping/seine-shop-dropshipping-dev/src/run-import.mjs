import {createDevelopmentClients} from './shopify-client.mjs';
import {importDraftProduct} from './catalog-import.mjs';
import {ImportError} from './catalog-plan.mjs';
import {verifyDraftImport} from './catalog-verify.mjs';

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const verify = args.includes('--verify');
const handles = args.filter((arg) => !['--apply', '--verify'].includes(arg));
if (handles.length !== 1 || handles[0].startsWith('-') || (apply && verify)) {
  process.stderr.write('Usage: node --env-file=.env apps/dropshipping/seine-shop-dropshipping-dev/src/run-import.mjs <product-handle> [--apply | --verify]\n');
  process.exitCode = 1;
} else {
  try {
    const clients = createDevelopmentClients(process.env);
    const result = verify ? await verifyDraftImport(clients, handles[0]) : await importDraftProduct(clients, handles[0], {apply});
    process.stdout.write(`${JSON.stringify(result)}\n`);
    if (verify && !result.verified) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${JSON.stringify({success: false, code: error instanceof ImportError ? error.code : 'unavailable'})}\n`);
    process.exitCode = 1;
  }
}
