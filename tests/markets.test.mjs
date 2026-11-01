import test from 'node:test';
import assert from 'node:assert/strict';
import {marketReturnTo, marketCountry} from '../app/lib/markets.js';
import {applyMarket} from '../app/lib/markets.server.js';
const form = (currency='EUR') => new Map(Object.entries({country:'DE',language:'ja',currency,returnTo:'/products/charger?Color=White#details'}));
function setup(result={cart:{id:'cart'}}) {
 const events=[];
 return {events,context:{storefront:{query:async()=>({localization:{availableCountries:[{isoCode:'DE',currency:{isoCode:'EUR'}}]}})},cart:{getCartId:()=> 'cart',updateBuyerIdentity:async(value)=>{events.push(value);return result;}},session:{set:(key,value)=>events.push({key,value})}}};
}
test('country and redirect validation blocks unsupported regions and external destinations',()=>{
 assert.equal(marketCountry('invalid'),'US');
 assert.equal(marketReturnTo('//evil.example','ja'),'/jp/');
 assert.equal(marketReturnTo('/\\evil.example','de'),'/de/');
 assert.equal(marketReturnTo('/products/charger?Color=White#details','ja'),'/jp/products/charger?Color=White#details');
 assert.equal(marketReturnTo('/','invalid'),null);
});
test('country change updates existing cart before saving preference and preserves variant URL',async()=>{
 const {context,events}=setup();const result=await applyMarket(form(),context);
 assert.equal(result.destination,'/jp/products/charger?Color=White#details');
 assert.deepEqual(events,[{countryCode:'DE'},{key:'marketCountry',value:'DE'}]);
});
test('tampered currency and failed cart repricing do not save a country',async()=>{
 const a=setup();assert.ok((await applyMarket(form('USD'),a.context)).error);assert.deepEqual(a.events,[]);
 const b=setup({errors:[{message:'unavailable'}]});assert.ok((await applyMarket(form(),b.context)).error);assert.equal(b.events.length,1);
});
test('new visitor does not get an empty cart created when saving preferences',async()=>{
 const {context,events}=setup();context.cart.getCartId=()=>undefined;
 assert.ok((await applyMarket(form(),context)).destination);
 assert.deepEqual(events,[{key:'marketCountry',value:'DE'}]);
});
