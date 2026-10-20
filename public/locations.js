const toggles=[...document.querySelectorAll('.crr-location-toggle')];
function closeMenus(except){for(const button of toggles){if(button===except)continue;button.setAttribute('aria-expanded','false');document.getElementById(button.getAttribute('aria-controls')).hidden=true;}}
for(const button of toggles){button.addEventListener('click',()=>{const open=button.getAttribute('aria-expanded')!=='true';closeMenus(button);button.setAttribute('aria-expanded',String(open));document.getElementById(button.getAttribute('aria-controls')).hidden=!open;});}
document.addEventListener('click',event=>{if(!event.target.closest('.crr-location-menu'))closeMenus();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){const active=toggles.find(b=>b.getAttribute('aria-expanded')==='true');closeMenus();active?.focus();}});
