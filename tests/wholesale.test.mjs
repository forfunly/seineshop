import test from 'node:test';
import assert from 'node:assert/strict';
import {inquiryMailto, validPurchaseQuantity} from '../app/lib/wholesale.js';
import {createBuyNowCheckout} from '../app/lib/checkout.server.js';
test('bulk quantities reach Shopify without client pricing or an invented discount', async () => {
 const form=new FormData();form.set('quantity','100');form.set('merchandiseId','gid://shopify/ProductVariant/123');form.set('price','1');form.set('discount','90');
 const result=await createBuyNowCheckout(form,{create:async(input)=>{
  assert.deepEqual(input,{lines:[{merchandiseId:'gid://shopify/ProductVariant/123',quantity:100}]});
  return {cart:{checkoutUrl:'https://example.myshopify.com/checkouts/test'}};
 }});
 assert.ok(result.checkoutUrl);
 for(const q of ['0','10000','1.1','Infinity','abc'])assert.equal(validPurchaseQuantity(q),false);
});
test('inquiry drafts encode user content and include product, variant and requirements',()=>{
 const url=inquiryMailto({product:{title:'Charger & cable',handle:'charger'},variant:{title:'Black',sku:'SKU-1'},quantity:500,type:'OEM',destination:'Germany',requirements:'Logo & packaging\nPlease quote.'});
 assert.ok(url.startsWith('mailto:steven@seineshop.com?'));
 const query=new URLSearchParams(url.split('?')[1]);
 assert.equal(query.get('subject'),'OEM inquiry — Charger & cable');
 for(const text of ['SKU: SKU-1','Variant: Black','Quantity: 500','Germany','Logo & packaging\nPlease quote.','https://www.seineshop.com/products/charger'])assert.ok(query.get('body').includes(text));
 assert.equal(query.has('bcc'),false);
});
