import type { Database } from '@/integrations/supabase/types';
export type Job = Database['public']['Tables']['jobs']['Row'];
export const materials = ['Any','PLA','PETG','ABS/ASA','TPU (Flexible)','Nylon','Resin','Carbon Fiber'];
export const technologies = ['Any','FDM','SLA/Resin','SLS','Metal'];
export const meta = (title: string, description: string) => ({meta:[{title:`${title} — PrintBids`},{name:'description',content:description},{property:'og:title',content:`${title} — PrintBids`},{property:'og:description',content:description},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]});
export const money = (amount: number) => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(amount);
export function timeline(job: Job) { const days = Math.ceil((Date.parse(job.deadline)-Date.now())/86400000); return days <= 7 ? 'Within a week' : days <= 30 ? 'Within a month' : 'Flexible'; }

export const launchAreas = ['Atlanta, GA','Decatur, GA','Marietta, GA','Smyrna, GA','Sandy Springs, GA','Roswell, GA','Alpharetta, GA','Johns Creek, GA','Dunwoody, GA','Brookhaven, GA','Chamblee, GA','Tucker, GA','Norcross, GA','Duluth, GA','Lawrenceville, GA','Kennesaw, GA','Woodstock, GA','Douglasville, GA','East Point, GA','College Park, GA','Peachtree City, GA','Fayetteville, GA','Stockbridge, GA','McDonough, GA','Stone Mountain, GA','Lilburn, GA','Suwanee, GA'];
