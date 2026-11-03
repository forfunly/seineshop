import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

// Explicit allowlist: never expose the checkout, .env, or the project root.
const documents = [
  'project-progress.html',
  'project-progress.md',
  'project-state.md',
  'qa/2026-11-02-remote-alignment.md',
  'qa/2026-11-02-local-check-fixes.md',
  'qa/2026-11-03-project-progress-web.md',
  'qa/2026-11-03-analytics-consent.md',
  'qa/2026-11-03-upload-review.md',
  'plans/2026-11-03-analytics-consent-fix.md',
  'plans/2026-11-03-oxygen-production-release.md',
];
const routes = new Map(
  documents.map((name) => [
    `/${name}`,
    fileURLToPath(new URL(`../docs/${name}`, import.meta.url)),
  ]),
);
routes.set('/', routes.get('/project-progress.html'));

const server = createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  response.setHeader('Content-Type', 'text/plain; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Robots-Tag', 'noindex, nofollow');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, {Allow: 'GET, HEAD'}).end('Method not allowed');
    return;
  }
  if (pathname === '/favicon.ico') {
    response.writeHead(204).end();
    return;
  }
  const file = routes.get(pathname);
  if (!file) {
    response.writeHead(404).end('Not found');
    return;
  }
  try {
    const body = await readFile(file);
    response.setHeader(
      'Content-Type',
      file.endsWith('.html')
        ? 'text/html; charset=utf-8'
        : 'text/plain; charset=utf-8',
    );
    response.writeHead(200).end(request.method === 'HEAD' ? undefined : body);
  } catch {
    response.writeHead(500).end('Unable to read the progress document');
  }
});
server.on('error', (error) => {
  process.stderr.write(`Progress server: ${error.code || 'startup failed'}\n`);
  process.exitCode = 1;
});
server.listen(4174, '127.0.0.1', () => {
  process.stdout.write(
    'Internal progress: http://127.0.0.1:4174/ (loopback only)\n',
  );
});
