import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import type { Database } from '@/integrations/supabase/types';
import { launchAreas } from '@/lib/printbids';
function publicDb(){
 const key=process.env['SUPABASE_PUBLISHABLE_KEY']; const url=process.env['SUPABASE_URL'];
 if(!key||!url) throw new Error('Job listing is unavailable');
 return createClient<Database>(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>{const h=new Headers(init?.headers); if(key.startsWith('sb_')&&h.get('Authorization')===`Bearer ${key}`)h.delete('Authorization');h.set('apikey',key);return fetch(input,{...init,headers:h});}}});
}
const PUBLIC_COLUMNS='id,owner_id,owner_name,title,summary,quantity,deadline,budget,technology,material,fulfillment,region,status,bid_count,image_key,created_at,category,dimensions,file_status,purpose,finish,color,delivery,verified_only';
export const browseJobs = createServerFn({method:'GET'}).handler(async()=>{
  const db=publicDb();
  const {data,error}=await db.from('jobs').select(PUBLIC_COLUMNS).eq('status','open').in('region',launchAreas).order('created_at',{ascending:false}); if(error)throw error;
  const vc=await db.rpc('verified_customers');
  const verified=new Set((vc.data??[]).map(v=>v.user_id));
  return data.map(j=>({...j,verified_customer:verified.has(j.owner_id)}));
});
export type PublicJob = Awaited<ReturnType<typeof browseJobs>>[number];
export const jobsQuery = { queryKey: ['public-jobs'], queryFn: () => browseJobs() };
export const jobPreview = createServerFn({method:'GET'}).inputValidator((v:unknown)=>z.object({id:z.string().uuid()}).parse(v)).handler(async({data})=>{
  const db=publicDb();
  const r=await db.from('jobs').select(PUBLIC_COLUMNS).eq('id',data.id).eq('status','open').in('region',launchAreas).maybeSingle(); if(r.error)throw r.error;
  return r.data;
});
export const previewQuery=(id:string)=>({queryKey:['job-preview',id],queryFn:()=>jobPreview({data:{id}})});
export const generateQuestions = createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator((v:unknown)=>z.object({jobId:z.string().uuid()}).parse(v)).handler(async({data,context})=>{
 const {data:job,error}=await context.supabase.from('jobs').select('*').eq('id',data.jobId).eq('owner_id',context.userId).single(); if(error||!job)throw new Error('Draft not found');
 const {data:detail}=await context.supabase.from('job_details').select('*').eq('job_id',job.id).single(); if(detail?.ai_blocked) throw new Error(detail.ai_blocked); if(detail?.technical_questions.length) return detail.technical_questions;
 const {createLovableAiGatewayRunIdFetch}=await import('./ai-run-id.server');
 const gateway=createLovableAiGatewayRunIdFetch(); const key=process.env['LOVABLE_API_KEY']; if(!key)throw new Error('AI follow-up is not configured');
 const response=await gateway.fetch('https://ai.gateway.lovable.dev/v1/responses',{method:'POST',headers:{'Content-Type':'application/json','Lovable-API-Key':key,'X-Lovable-AIG-SDK':'fetch'},body:JSON.stringify({model:'openai/gpt-6-astra',store:false,stream:true,reasoning:{effort:'low',summary:'auto'},include:['reasoning.encrypted_content'],input:[{role:'system',content:'Ask exactly 3 concise technical questions for a 3D printing request. Focus on missing infill/strength, tolerances/surface finish, and color details. Do not repeat information already provided.'},{role:'user',content:JSON.stringify({title:job.title,technology:job.technology,material:job.material,description:detail?.description})}],text:{format:{type:'json_schema',name:'print_questions',strict:true,schema:{type:'object',properties:{questions:{type:'array',items:{type:'string'},minItems:3,maxItems:3}},required:['questions'],additionalProperties:false}}}})});
 if(!response.ok){const message=`AI follow-up is unavailable (${response.status}). Please try again after service access is restored.`;if(response.status===402||response.status===403) await context.supabase.from('job_details').update({ai_blocked:message}).eq('job_id',job.id);throw new Error(message);}
 if(!response.body)throw new Error('AI returned no questions');
 const reader=response.body.getReader(); const decoder=new TextDecoder();let pending='',text='';
 while(true){const chunk=await reader.read();if(chunk.done)break;pending+=decoder.decode(chunk.value,{stream:true});const lines=pending.split('\n');pending=lines.pop()??'';for(const line of lines){if(!line.startsWith('data: ')||line==='data: [DONE]')continue;const event=JSON.parse(line.slice(6));if(event.type==='response.output_text.delta')text+=event.delta;if(event.type==='error'||event.type==='response.failed')throw new Error('AI follow-up could not complete');}}
 if(!text)throw new Error('AI returned no questions');const parsed=z.object({questions:z.array(z.string().min(3).max(500)).length(3)}).parse(JSON.parse(text));
 const saved=await context.supabase.from('job_details').update({technical_questions:parsed.questions}).eq('job_id',job.id);if(saved.error)throw saved.error;return parsed.questions;
});
export const foundingSpots = createServerFn({method:'GET'}).handler(async()=>{const r=await publicDb().rpc('founding_spots_left'); return r.data??0;});
export const foundingSpotsQuery = { queryKey: ['founding-spots'], queryFn: () => foundingSpots() };
