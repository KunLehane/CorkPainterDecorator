for(const form of document.querySelectorAll('[data-inspection-form]')){
form.addEventListener('submit',async event=>{
 event.preventDefault();if(!form.reportValidity())return;
 const status=form.querySelector('.form-status'),button=form.querySelector('button');
 button.disabled=true;status.classList.remove('error');status.textContent='Sending your request…';
 let redirecting=false;const fields=Object.fromEntries(new FormData(form));fields.page=location.pathname;
 try{
  const response=await fetch('/api/enquiry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(fields),signal:AbortSignal.timeout(20000)});
  const result=await response.json();if(!response.ok||!result.ok)throw new Error(result.message||'Unable to send your request. Please call 089 206 4575.');
  form.reset();redirecting=true;try{sessionStorage.setItem('corkLead','1')}catch{}status.textContent='Thank you, your request has been sent. Taking you to the next page…';location.assign('/thank-you/');
 }catch(error){status.classList.add('error');status.textContent=error.name==='TimeoutError'?'We could not confirm your request. Please call 089 206 4575 before submitting again.':error.message||'Unable to send your request. Please call 089 206 4575.';}
 finally{if(!redirecting)button.disabled=false;}
});
}
for(const link of document.querySelectorAll('a[href="#privacy"]'))link.addEventListener('click',()=>{document.querySelector('#privacy').open=true;});
