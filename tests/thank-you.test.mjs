import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs/promises';
const siteScript=await fs.readFile(new URL('../public/site.js',import.meta.url),'utf8');
const thankScript=await fs.readFile(new URL('../public/thank-you.js',import.meta.url),'utf8');

function siteSetup(result){
 let submit,reset=false,redirected=null,leads=0;const flags={};const classes=new Set();
 const status={textContent:'',classList:{add:v=>classes.add(v),remove:v=>classes.delete(v)}};
 const button={disabled:false};
 const form={reportValidity:()=>true,addEventListener:(_,fn)=>submit=fn,querySelector:s=>s==='.form-status'?status:button,reset:()=>reset=true};
 const context={corkTrackLead:()=>leads++,sessionStorage:{setItem:(k,v)=>flags[k]=v},document:{querySelectorAll:s=>s==='[data-enquiry-form]'?[form]:[]},FormData:class{*[Symbol.iterator](){yield ['name','Test'];yield ['phone','0830000000'];}},location:{pathname:'/contact/',assign:url=>redirected=url},fetch:async()=>{if(result instanceof Error)throw result;return {ok:result.ok,json:async()=>result};}};
 vm.runInNewContext(siteScript,context);
 return {run:()=>submit({preventDefault(){}}),status,button,classes,flags,get leads(){return leads},get reset(){return reset},get redirected(){return redirected}};
}

test('site enquiry forms redirect to /thank-you/ only after a confirmed send',async()=>{
 const s=siteSetup({ok:true});await s.run();
 assert.equal(s.redirected,'/thank-you/');assert.equal(s.flags.corkLead,'1');assert.equal(s.reset,true);
 assert.equal(s.leads,0,'Lead is fired by the thank-you page, not the form page');
 assert.equal(s.button.disabled,true,'button stays disabled while redirecting');
});
test('site enquiry forms stay on the page and show the error when sending fails',async()=>{
 const s=siteSetup({ok:false,message:'Please call 089 206 4575.'});await s.run();
 assert.equal(s.redirected,null);assert.equal(s.flags.corkLead,undefined);assert.equal(s.reset,false);
 assert.equal(s.status.textContent,'Please call 089 206 4575.');assert.equal(s.classes.has('error'),true);assert.equal(s.button.disabled,false);
});
test('site enquiry forms treat a network error as a failure, not a success',async()=>{
 const s=siteSetup(new Error('offline'));await s.run();
 assert.equal(s.redirected,null);assert.equal(s.flags.corkLead,undefined);assert.equal(s.classes.has('error'),true);assert.equal(s.button.disabled,false);
});

function thankSetup(storage,cookie=''){
 const handlers={};let leads=0,dialogClosed=false;const dialog={close:()=>dialogClosed=true};
 vm.runInNewContext(thankScript,{corkTrackLead:()=>leads++,sessionStorage:storage,document:{cookie,querySelector:s=>s==='dialog.cork-cookie-dialog'?dialog:null},addEventListener:(name,fn)=>handlers[name]=fn});
 return {handlers,get leads(){return leads},get dialogClosed(){return dialogClosed}};
}
const storageWith=initial=>{const store={...initial};return {store,getItem:k=>store[k]??null,removeItem:k=>{delete store[k]}};};

test('thank-you page fires Lead once, after load, when arriving from a form',()=>{
 const storage=storageWith({corkLead:'1'});
 const first=thankSetup(storage);
 assert.equal(first.leads,0,'waits for load so meta-tracking.js is ready');
 first.handlers.load();assert.equal(first.leads,1);assert.equal(storage.store.corkLead,undefined,'flag is cleared');
 const refresh=thankSetup(storage);
 assert.equal(refresh.handlers.load,undefined);assert.equal(refresh.leads,0,'a refresh does not count a second lead');
});
test('thank-you page does not fire Lead on a direct visit',()=>{
 const direct=thankSetup(storageWith({}));
 assert.equal(direct.handlers.load,undefined);assert.equal(direct.leads,0);
});
test('thank-you page does not break when sessionStorage is unavailable',()=>{
 const blocked={getItem(){throw new Error('blocked')},removeItem(){throw new Error('blocked')}};
 const page=thankSetup(blocked);
 assert.equal(page.handlers.load,undefined);assert.equal(page.leads,0);
});
test('thank-you page closes the cookie dialog when a choice is already saved',()=>{
 const page=thankSetup(storageWith({}),'theme=light; wpconsent_preferences={"marketing":false}');
 page.handlers.DOMContentLoaded();assert.equal(page.dialogClosed,true);
});
test('thank-you page leaves the cookie dialog open when no choice has been made',()=>{
 for(const cookie of ['','theme=light','not_wpconsent_preferences=1']){
  const page=thankSetup(storageWith({}),cookie);
  page.handlers.DOMContentLoaded();assert.equal(page.dialogClosed,false,'cookie: '+cookie);
 }
});
