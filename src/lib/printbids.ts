import type { Database } from '@/integrations/supabase/types';
export type Job = Database['public']['Tables']['jobs']['Row'];
export const printMaterials = ['PLA','PETG','ABS/ASA','TPU (Flexible)','Resin','Nylon'];
export const materialChoices = [...printMaterials,'Not sure — maker recommends'];
/** @deprecated kept for older imports; use printMaterials */
export const materials = ['Any',...printMaterials];
export const technologies = ['Any','FDM','SLA/Resin','SLS','Metal'];
export const bidTechnologies = ['FDM','Resin','SLS','Other'];
export const categories = ['Prototypes','Replacement & functional parts','Miniatures & tabletop','Cosplay & props','Home & decor','3D design/modeling help'];
export const fileStatuses = ['Yes','No, I have photos or a sketch','No, I need it designed'];
export const purposes = ['Display/decorative','Functional part','Prototype','Wearable or cosplay'];
export const finishes = ['As printed','Supports removed and cleaned','Sanded','Primed','Painted'];
export const deliveries = ['Local pickup','Maker delivers or ships','Either'];
export const neededBy = ['Within a week','Within a month','Flexible'];
export const SITE_URL = 'https://printbids.lovable.app';
export const meta = (title: string, description: string, path?: string) => ({links: path ? [{rel:'canonical',href:`${SITE_URL}${path}`}] : [], meta:[...(path ? [{property:'og:url',content:`${SITE_URL}${path}`}] : []),{title:`${title} — PrintBids`},{name:'description',content:description},{property:'og:title',content:`${title} — PrintBids`},{property:'og:description',content:description},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'},{property:'og:image',content:`${SITE_URL}/og-image.jpg`},{name:'twitter:image',content:`${SITE_URL}/og-image.jpg`}]});
export const money = (amount: number) => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(amount);
export function timeline(job: Pick<Job,'deadline'>) { const days = Math.ceil((Date.parse(job.deadline)-Date.now())/86400000); return days <= 7 ? 'Within a week' : days <= 30 ? 'Within a month' : 'Flexible'; }
export const firstName = (name?: string | null) => (name ?? '').trim().split(/\s+/)[0] || 'Customer';
export const safeRedirect = (value: unknown) => typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : '/';

export const launchAreas = ['Atlanta, GA','Decatur, GA','Marietta, GA','Smyrna, GA','Sandy Springs, GA','Roswell, GA','Alpharetta, GA','Johns Creek, GA','Dunwoody, GA','Brookhaven, GA','Chamblee, GA','Tucker, GA','Norcross, GA','Duluth, GA','Lawrenceville, GA','Kennesaw, GA','Woodstock, GA','Douglasville, GA','East Point, GA','College Park, GA','Peachtree City, GA','Fayetteville, GA','Stockbridge, GA','McDonough, GA','Stone Mountain, GA','Lilburn, GA','Suwanee, GA'];
