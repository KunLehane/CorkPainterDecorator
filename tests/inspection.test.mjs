import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs/promises';
const script=await fs.readFile(new URL('../public/inspection.js',import.meta.url),'utf8');
function setup(result){
 let submit,reset=false,sent,leads=0,redirected=null;const flags={};const classes=new Set();
 const status={textContent:'',classList:{add:v=>classes.add(v),remove:v=>classes.delete(v)}};
 const button={disabled:false};
 const form={reportValidity:()=>true,addEventListener:(_,fn)=>submit=fn,querySelector:s=>s==='.form-status'?status:button,reset:()=>reset=true};
 const context={corkTrackLead:()=>leads++,sessionStorage:{setItem:(k,v)=>flags[k]=v},document:{querySelectorAll:s=>s==='[data-inspection-form]'?[form]:[{addEventListener(){}}]},FormData:class{*[Symbol.iterator](){yield ['name','Test'];yield ['phone','0830000000'];yield ['service','Interior Painting'];yield ['eircode','Douglas'];yield ['message','Two bedrooms'];}},location:{pathname:'/quote/',assign:url=>redirected=url},AbortSignal,fetch:async(url,options)=>{sent={url,payload:JSON.parse(options.body)};if(result instanceof Error)throw result;return {ok:result.ok,json:async()=>result};}};
 vm.runInNewContext(script,context);
 return {run:()=>submit({preventDefault(){}}),status,button,classes,flags,get leads(){return leads},get reset(){return reset},get sent(){return sent},get redirected(){return redirected}};
}
test('quote form sends the details, then redirects to the thank-you page only after confirmed success',async()=>{const s=setup({ok:true});await s.run();assert.equal(s.sent.url,'/api/enquiry');assert.equal(s.sent.payload.service,'Interior Painting');assert.equal(s.sent.payload.page,'/quote/');assert.equal(s.sent.payload.eircode,'Douglas');assert.equal(s.reset,true);assert.equal(s.redirected,'/thank-you/');assert.equal(s.flags.corkLead,'1');assert.equal(s.leads,0,'Lead is fired by the thank-you page, not the form page');assert.match(s.status.textContent,/request has been sent/);assert.equal(s.button.disabled,true,'button stays disabled while redirecting so a second tap cannot resubmit');});
test('failed delivery preserves details, does not redirect and displays the server error',async()=>{const s=setup({ok:false,message:'Please call 089 206 4575.'});await s.run();assert.equal(s.reset,false);assert.equal(s.redirected,null);assert.equal(s.flags.corkLead,undefined);assert.equal(s.leads,0);assert.equal(s.status.textContent,'Please call 089 206 4575.');assert.equal(s.classes.has('error'),true);assert.equal(s.button.disabled,false);});
test('timeout does not claim success, redirect or automatically retry',async()=>{const error=new Error('timeout');error.name='TimeoutError';const s=setup(error);await s.run();assert.equal(s.reset,false);assert.equal(s.redirected,null);assert.equal(s.flags.corkLead,undefined);assert.equal(s.leads,0);assert.match(s.status.textContent,/could not confirm/);assert.equal(s.button.disabled,false);});
