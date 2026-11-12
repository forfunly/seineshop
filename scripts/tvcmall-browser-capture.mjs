import fs from 'node:fs/promises';
import path from 'node:path';

// Read only rendered product information through the browser tool's DOM API.
export function extractProduct() {
  return {
    url: location.href,
    title: document.querySelector('h1')?.textContent,
    basePrice: document.querySelector('h1')?.parentElement.parentElement.querySelector('[class*="text-24px"]')?.textContent,
    descriptionHtml: document.querySelector('.product-descriptions')?.innerHTML,
    specifications: [...document.querySelectorAll('.specifications table tr')].map(row => [...row.querySelectorAll('td')].map(cell => cell.innerText)),
    prices: [...document.querySelectorAll('.prices .item')].map(item => ({minimumQuantity: item.querySelector('.units')?.textContent, price: item.querySelector('.price')?.textContent})),
    images: [...document.querySelectorAll('img')].filter(img => img.src.includes('/800x800_')).map(img => img.src),
    variants: [...document.querySelectorAll('li[title]')].map(item => ({label: item.getAttribute('title'), title: item.querySelector('img')?.alt, image: item.querySelector('img')?.src, selected: item.className.includes('active')})),
    moreImages: [...document.querySelectorAll('.tabContent img')].map(img => ({src: img.src, alt: img.alt})),
    pageText: document.body.innerText.split('Related Products')[0],
  };
}

export async function readReady(tab, requireTiers) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (requireTiers) await tab.playwright.locator('.prices').waitFor({state: 'attached', timeoutMs: 3000});
      await tab.playwright.getByRole('cell', {name: 'Gross Weight', exact: true}).waitFor({state: 'attached', timeoutMs: 3000});
      if (await tab.playwright.locator('li[title]').count()) await tab.playwright.locator('li[title] img[alt]').first().waitFor({state: 'attached', timeoutMs: 3000});
      break;
    } catch (error) {
      if (attempt === 2) throw error;
      await tab.playwright.domSnapshot();
    }
  }
  const data = await tab.playwright.evaluate(extractProduct);
  if (!data.prices.length && data.basePrice) data.prices = [{minimumQuantity: '1 + pieces', price: data.basePrice}];
  return data;
}

export async function saveProduct(root, data, index, groupUrl) {
  const sku = data.url.match(/-sku([^/.]+)\.html/i)?.[1].toUpperCase();
  if (!sku || !data.title || !data.prices.length || !data.images.length) throw new Error('Missing SKU, title, prices or product images');
  if (!data.pageText.includes(sku)) throw new Error('Page content does not match URL SKU');
  await fs.writeFile(path.join(root, 'products', `${sku}.json`), JSON.stringify({...data, sku, listingIndex: index, groupUrl, capturedAt: new Date().toISOString()}, null, 2));
  return sku;
}

export async function captureGroup(tab, root, item, index) {
  const requireTiers = item.listingText.includes('Wholesale');
  if (await tab.url() !== item.url) await tab.goto(item.url);
  let data = await readReady(tab, requireTiers);
  const options = data.variants;
  const saved = [await saveProduct(root, data, index, item.url)];
  for (const option of options.filter(value => !value.selected)) {
    if (!option.title) throw new Error('Missing loaded variant title');
    const previousUrl = await tab.url();
    await tab.playwright.getByRole('listitem', {name: option.label, exact: true}).click();
    await tab.playwright.domSnapshot();
    if (await tab.url() === previousUrl) {
      const targetSku = option.image?.match(/100x100_([^/.]+)\./)?.[1];
      if (targetSku) await tab.playwright.waitForURL(new RegExp('-sku' + targetSku + '\\.html', 'i'), {timeoutMs: 10000});
      if (await tab.url() === previousUrl) throw new Error('Variant navigation did not change URL');
    }
    await tab.reload();
    data = await readReady(tab, requireTiers);
    saved.push(await saveProduct(root, data, index, item.url));
  }
  const skus = [...new Set(saved)];
  if (skus.length !== Math.max(1, options.length)) throw new Error('Variant count mismatch');
  return {index, url: item.url, skus, expected: Math.max(1, options.length), capturedAt: new Date().toISOString()};
}

// Image src is populated after hydration; currentSrc can still be the placeholder.
export async function captureDetailImages(tab, item) {
  if (await tab.url() !== item.url) await tab.goto(item.url);
  await tab.playwright.getByRole('cell', {name: 'Gross Weight', exact: true}).waitFor({state: 'attached', timeoutMs: 5000});
  await tab.playwright.locator('.tabContent img[src$="/pl.svg"]').first().waitFor({state: 'detached', timeoutMs: 7000});
  const result = await tab.playwright.evaluate(() => ({
    url: location.href,
    title: document.querySelector('h1')?.textContent,
    images: [...document.querySelectorAll('.tabContent img')].map((image) => ({src: image.src, alt: image.alt})),
  }));
  if (result.images.some((image) => image.src.endsWith('/pl.svg'))) throw new Error('Unloaded detail images');
  return {...result, groupIndex: item.index, capturedAt: new Date().toISOString()};
}
