import test from 'node:test';
import assert from 'node:assert/strict';
import {LOCALES, localeFromPath, stripLocale, localizePath} from '../app/lib/locale.js';
import messages from '../app/locales/messages.json' with {type:'json'};
import {categories, primaryLinks} from '../app/data/navigation.js';
test('English default, Japanese jp path with standard ja language, German de',()=>{
 assert.equal(localeFromPath('/products/a').code,'en');
 assert.equal(localeFromPath('/jp/products/a').language,'JA');
 assert.equal(localeFromPath('/de/cart').language,'DE');
 assert.equal(localeFromPath('/jpx').code,'en');
});
test('Language switch replaces prefix and preserves hashes and query strings',()=>{
 assert.equal(localizePath('/jp/products/a?Color=Black#specs',LOCALES[2]),'/de/products/a?Color=Black#specs');
 assert.equal(localizePath('/de/',LOCALES[0]),'/');
 assert.equal(stripLocale('/jp/collections'),'/collections');
 for(const path of ['https://checkout.shopify.com/path','//example.com','mailto:hello@seineshop.com','#main','/images/a.webp','/sitemap.xml']) assert.equal(localizePath(path,LOCALES[1]),path);
});
test('Every menu label has both translations',()=>{
 const labels=[...primaryLinks.map(([title])=>title),...categories.flatMap(c=>[c.title,...c.links.map(([title])=>title)])];
 for(const label of labels){if(label==='iPhone 18 Pro Max')continue;assert.ok(messages[label]?.ja,label);assert.ok(messages[label]?.de,label);}
});
