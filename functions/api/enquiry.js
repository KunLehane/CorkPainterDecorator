const RECIPIENT='aidanlehane@gmail.com';
const LABELS={name:'Name',phone:'Phone',email:'Email',eircode:'Eircode',service:'Service',message:'Message',page:'Page'};
const response=(status,message,ok=false)=>new Response(JSON.stringify({ok,message}),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export async function onRequestPost({request,env,waitUntil}){
 const origin=new URL(request.url).origin;
 if(request.headers.get('Origin')!==origin)return response(403,'Please submit from the website.');
 if(!request.headers.get('Content-Type')?.includes('application/json'))return response(415,'Unsupported request.');
 if(Number(request.headers.get('Content-Length')||0)>8000)return response(413,'Your enquiry is too long.');
 let data;try{const body=await request.text();if(body.length>8000)return response(413,'Your enquiry is too long.');data=JSON.parse(body);}catch{return response(400,'Please check your enquiry details.');}
 if(!data||typeof data!=='object'||Array.isArray(data))return response(400,'Please check your enquiry details.');
 if(data['company-website'])return response(400,'Unable to submit this enquiry.');
 const value=(key,max=200)=>typeof data[key]==='string'?data[key].trim().slice(0,max):'';
 const name=value('name'),phone=value('phone'),email=value('email'),eircode=value('eircode'),service=value('service'),message=value('message',2000),page=value('page');
 if(!name||phone.replace(/\D/g,'').length<7)return response(400,'Please enter your name and a valid phone number.');
 const record={name,phone,email,eircode,service,message,page,receivedAt:new Date().toISOString(),source:'corkpainterdecorator.ie website'};
 // Older lead route kept as a backup: save to the LEADS store and post to the n8n webhook when they are set up.
 let backupSaved=false;
 if(env.LEADS){try{await env.LEADS.put(`lead:${record.receivedAt}:${crypto.randomUUID()}`,JSON.stringify(record),{expirationTtl:7776000});backupSaved=true;}catch(err){console.error('LEADS store failed',err);}}
 if(env.LEAD_WEBHOOK){const hook=fetch(env.LEAD_WEBHOOK,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(record),signal:AbortSignal.timeout(8000)}).then(r=>{if(r.ok)backupSaved=true;}).catch(err=>console.error('Lead webhook failed',err));if(!env.RESEND_API_KEY)await hook;else waitUntil?.(hook);}
 if(!env.RESEND_API_KEY||!env.LEAD_FROM)return backupSaved?response(200,'Your enquiry has been sent.',true):response(503,'The enquiry form is being connected. Please call 089 470 4697.');
 const recipients=[...new Set([env.LEAD_TO??RECIPIENT,'aidanlehane@gmail.com'])];
 const text=[['Name',name],['Phone',phone],['Email',email],['Eircode',eircode],['Service',service],['Message',message],['Page',page]].map(([k,v])=>`${k}: ${v||'Not supplied'}`).join('\n');
 // GHL sync is best-effort: it never blocks or fails the customer's submission.
 // If the webhook is unset, slow or erroring, the enquiry still gets emailed.
 if(env.GHL_WEBHOOK_URL){
  const ghlSync=fetch(env.GHL_WEBHOOK_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,phone,email,eircode,service,message,page,source:'corkpainterdecorator.ie website'}),signal:AbortSignal.timeout(8000)}).catch(err=>console.error('GHL webhook failed',err));
  waitUntil?.(ghlSync);
 }
 try{
  const sent=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({from:env.LEAD_FROM,to:recipients,subject:`New Cork Painter Decorator enquiry: ${service||'General'}`,text,...(email?{reply_to:email}:{})}),signal:AbortSignal.timeout(12000)});
  if(!sent.ok)return response(502,'Your enquiry could not be sent. Please call 089 470 4697.');
  const receipt=await sent.json();if(!receipt.id)return response(502,'Unable to confirm sending. Please contact us directly.');
  return response(200,'Your enquiry has been sent.',true);
 }catch{return response(502,'Your enquiry could not be sent. Please call 089 470 4697.');}
}
export const onRequestGet=()=>new Response(null,{status:303,headers:{Location:'/contact/'}});
