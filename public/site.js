for(const counter of document.querySelectorAll('.elementor-counter-number'))if(counter.dataset.toValue)counter.textContent=counter.dataset.toValue;
for(const form of document.querySelectorAll('[data-enquiry-form]')){
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(!form.reportValidity())return;
  const status=form.querySelector('.form-status'),button=form.querySelector('[type="submit"]');
  status.textContent='Sending your enquiry…';status.classList.remove('error');if(button)button.disabled=true;
  let redirecting=false;const fields=Object.fromEntries(new FormData(form));fields.page=location.pathname;
  try{const response=await fetch('/api/enquiry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(fields)});const result=await response.json();if(!response.ok||!result.ok)throw new Error(result.message||'Your enquiry could not be sent. Please call 089 470 4697.');form.reset();redirecting=true;try{sessionStorage.setItem('corkLead','1')}catch{}status.textContent='Thanks, your enquiry has been sent. Taking you to the next page…';location.assign('/thank-you/');}
  catch(error){status.textContent=error.message||'Unable to send. Please call 089 470 4697.';status.classList.add('error');}
  finally{if(button&&!redirecting)button.disabled=false;}
 });
}

for(const toggle of document.querySelectorAll('.elementor-menu-toggle'))toggle.addEventListener('click',()=>{const menu=toggle.closest('.elementor-widget-nav-menu').querySelector('nav.elementor-nav-menu--dropdown');const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));toggle.classList.toggle('elementor-active',open);if(menu){menu.classList.toggle('ppc-open',open);menu.setAttribute('aria-hidden',String(!open));}});
for(const a of document.querySelectorAll('.elementor-nav-menu .menu-item-has-children > a'))a.addEventListener('click',e=>{if(a.getAttribute('href')==='#'){e.preventDefault();a.parentElement.classList.toggle('ppc-submenu-open');}});
for(const t of document.querySelectorAll('.elementor-tab-title')){t.addEventListener('click',()=>{const panel=document.getElementById(t.getAttribute('aria-controls'));if(panel){const open=t.getAttribute('aria-expanded')!=='true';t.setAttribute('aria-expanded',String(open));t.classList.toggle('elementor-active',open);panel.style.display=open?'block':'none';}});}
