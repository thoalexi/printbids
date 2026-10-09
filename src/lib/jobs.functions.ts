import { createServerFn } from '@tanstack/react-start';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import type { Database } from '@/integrations/supabase/types';
import { launchAreas } from '@/lib/printbids';
export const browseJobs = createServerFn({method:'GET'}).handler(async()=>{
 const key=process.env['SUPABASE_PUBLISHABLE_KEY']; const url=process.env['SUPABASE_URL'];
 if(!key||!url) throw new Error('Job listing is unavailable');
 const db=createClient<Database>(url,key,{auth:{persistSession:false},global:{fetch:(input,init)=>{const h=new Headers(init?.headers); if(key.startsWith('sb_')&&h.get('Authorization')===`Bearer ${key}`)h.delete('Authorization');h.set('apikey',key);return fetch(input,{...init,headers:h});}}});
 const {data,error}=await db.from('jobs').select('*').eq('status','open').in('region',launchAreas).order('created_at',{ascending:false}); if(error)throw error; return data;
});
export const jobsQuery = { queryKey: ['public-jobs'], queryFn: () => browseJobs() };
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
