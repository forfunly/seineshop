import http from 'node:http';
import {readFile} from 'node:fs/promises';

// Internal QA only: original pixel code, synthetic Shopify callbacks, local tag receiver.
// No credentials, orders, external requests or filesystem writes.
const port = 3010;
const origin = `http://127.0.0.1:${port}`;
const events = [];
const html = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Seine Shop 内部埋点验证</title>
<style>body{font:16px system-ui;max-width:760px;margin:40px auto;padding:16px}button{padding:12px;margin:8px}pre{white-space:pre-wrap;background:#f0f4ee;padding:16px}</style>
<h1>Seine Shop 内部埋点验证</h1><p>使用模拟 Shopify 回调和本机接收器，不创建订单、不向 Google 发送数据。</p>
<button id="run">发送完整流程两次</button><button id="deny">拒绝分析</button><button id="allow">允许分析</button><pre id="results">等待测试</pre>
<script>
window.__subscriptions = {};
window.analytics = {subscribe: (name, callback) => {window.__subscriptions[name] = callback;}};
window.init = {customerPrivacy: {analyticsProcessingAllowed: true}};
window.api = {customerPrivacy: {subscribe: (_name, callback) => {window.__consent = callback;}}};
window.browser = {localStorage: {getItem: async key => localStorage.getItem(key), setItem: async (key, value) => localStorage.setItem(key, value)}};
const append = document.head.appendChild.bind(document.head);
document.head.appendChild = node => {
  if (node.tagName === 'SCRIPT' && node.src.startsWith('https://www.googletagmanager.com/gtag/js?')) node.src = '/tag.js';
  return append(node);
};
const make = name => ({name, id:'internal-qa-'+name, timestamp:new Date().toISOString(), data:{checkout:{
  token:'internal-qa-checkout-v1', order:{id:'900000000001'}, currencyCode:'USD',
  attributes:[{key:'seine_ga_client_id',value:'123.456'},{key:'seine_ga_session_id',value:'789'},{key:'seine_ga_captured_at',value:String(Date.now())}],
  lineItems:[{quantity:2,title:'Internal QA item',variant:{id:'42',title:'Black'},finalLinePrice:{amount:36}}],
  totalTax:{amount:3},shippingLine:{price:{amount:12}}
}}});
document.querySelector('#run').onclick = async () => {
  for (let i=0;i<2;i++) for (const name of ['checkout_started','payment_info_submitted','checkout_completed']) await window.__subscriptions[name](make(name));
};
document.querySelector('#deny').onclick = () => window.__consent({customerPrivacy:{analyticsProcessingAllowed:false}});
document.querySelector('#allow').onclick = () => window.__consent({customerPrivacy:{analyticsProcessingAllowed:true}});
</script><script src="/pixel.js"></script></html>`;
const tag = `(() => {
  const record = entry => {
    if (entry[0] !== 'event') return;
    fetch('/collect', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:entry[1],payload:entry[2]})})
      .then(() => fetch('/events')).then(response => response.json())
      .then(events => {document.querySelector('#results').textContent = JSON.stringify(events,null,2);});
  };
  const queue = window.dataLayer;
  const initial = Array.from(queue);
  queue.push = function(entry) { const size = Array.prototype.push.call(this,entry); record(Array.from(entry)); return size; };
  initial.forEach(entry => record(Array.from(entry)));
})();`;

const server = http.createServer(async (request, response) => {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Robots-Tag', 'noindex, nofollow');
  if (request.headers.host !== `127.0.0.1:${port}`) {response.writeHead(403).end(); return;}
  const path = new URL(request.url, origin).pathname;
  if (request.method === 'POST' && path === '/collect' && request.headers.origin === origin) {
    let body = '';
    for await (const chunk of request) {
      body += chunk;
      if (body.length > 65536) {response.writeHead(413).end(); return;}
    }
    try { events.push(JSON.parse(body)); } catch {response.writeHead(400).end(); return;}
    response.writeHead(204).end(); return;
  }
  if (request.method !== 'GET') {response.writeHead(405).end(); return;}
  if (path === '/events') {response.setHeader('Content-Type', 'application/json; charset=utf-8'); response.end(JSON.stringify(events)); return;}
  if (path === '/pixel.js' || path === '/tag.js') {
    response.setHeader('Content-Type', 'text/javascript; charset=utf-8');
    response.end(path === '/pixel.js' ? await readFile(new URL('./ga4-checkout-pixel.js', import.meta.url), 'utf8') : tag); return;
  }
  if (path !== '/') {response.writeHead(404).end(); return;}
  response.setHeader('Content-Type', 'text/html; charset=utf-8'); response.end(html);
});
server.listen(port, '127.0.0.1', () => process.stdout.write(`Internal GA4 QA: ${origin}\n`));
