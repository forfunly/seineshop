import {escapeXml, indexLoader, resourceLoader, sitemapPath} from '~/lib/sitemaps.server';

const names = {
  products: '商品',
  collections: '商品分类',
  articles: '博客文章',
  'blog-collections': '博客集合',
  'blog-tags': '博客标签',
  pages: '自定义页面',
  policies: '政策',
};
export async function loader(args) {
  const query = new URL(args.request.url).searchParams;
  const resource = query.get('resource');
  const language = ['en', 'ja', 'de'].includes(query.get('language'))
    ? query.get('language')
    : 'en';
  const response = resource
    ? await resourceLoader({...args, params: {language, resource}})
    : await indexLoader(args);
  const xml = await response.text();
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  const label = resource
    ? names[resource.replace(/-\d+$/, '')]
    : '站点地图索引';
  const rows = urls
    .map((url) => {
      if (resource) return `<tr><td><a href="${url}">${url}</a></td></tr>`;
      const [, lang, file] = new URL(url).pathname.match(/^\/sitemap\.([a-z]+)\.(.+)\.xml$/);
      const type = file.replace(/-\d+$/, '');
      return `<tr><td>${names[type] || escapeXml(type)}</td><td>${lang}</td><td><a href="/sitemap-view?language=${lang}&amp;resource=${escapeXml(file)}">${escapeXml(file)}</a></td><td><a href="${url}">XML</a></td></tr>`;
    })
    .join('');
  const source = resource
    ? sitemapPath(resource.replace(/-\d+$/, ''), Number(resource.match(/\d+$/)[0]), language)
    : '/sitemap.xml';
  const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>${label} | SeineShop Sitemap</title><style>body{margin:0;padding:32px;font:16px/1.7 system-ui,sans-serif;background:#f7f9f5;color:#183b2f}main{max-width:1100px;margin:auto}a{color:#205c43;overflow-wrap:anywhere}table{width:100%;border-collapse:collapse;background:white}td,th{text-align:left;padding:12px 18px;border-bottom:1px solid #dce4da}th{background:#e8eee2}h1{font-size:30px}nav{display:flex;gap:24px;flex-wrap:wrap}p{color:#53665b}@media(max-width:600px){body{padding:16px}td,th{padding:10px;font-size:13px}}</style></head><body><main><nav><a href="/sitemap-view">全部分类</a><a href="${source}">查看原始 XML</a><a href="/">返回商店</a></nav><h1>SeineShop · ${label}</h1><p>语言：${resource ? language : 'English / 日本語 / Deutsch'} · ${urls.length} ${resource ? '个页面网址' : '个子 sitemap 文件'}。${resource ? '点击下方网址可访问对应页面。' : '按页面类型分组，点击文件名查看这一类页面；商品自动分页。'}</p><table><thead><tr>${resource ? '<th>页面网址</th>' : '<th>页面类型</th><th>语言</th><th>查看页面列表</th><th>源文件</th>'}</tr></thead><tbody>${rows}</tbody></table><p>此页面仅供查看管理，不参与搜索收录。提交搜索引擎请使用 <a href="/sitemap.xml">sitemap.xml</a>。</p></main></body></html>`;
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'X-Robots-Tag': 'noindex, follow',
    },
  });
}
