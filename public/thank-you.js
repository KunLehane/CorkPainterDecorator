// Fire the Meta Lead event once per real submission. The form scripts set the flag
// just before redirecting here, so refreshing or opening /thank-you/ directly never counts a lead.
// Waits for "load" because meta-tracking.js is injected as a deferred script after this one.
(()=>{
 let submitted=false;
 try{submitted=sessionStorage.getItem('corkLead')==='1';sessionStorage.removeItem('corkLead');}catch{}
 if(submitted)addEventListener('load',()=>globalThis.corkTrackLead?.());
})();
// This page has no WPConsent banner, so meta-tracking.js opens its own cookie dialog on every load.
// If a choice is already saved, close it so it doesn't cover the confirmation. Visitors with no
// saved choice still see it.
addEventListener('DOMContentLoaded',()=>{
 if(/(?:^|; )wpconsent_preferences=/.test(document.cookie))document.querySelector('dialog.cork-cookie-dialog')?.close();
});
