import type { Database } from '@/integrations/supabase/types';
export type Job = Database['public']['Tables']['jobs']['Row'];
export const printMaterials = ['PLA','PETG','ABS/ASA','TPU (Flexible)','Resin','Nylon'];
export const materialChoices = [...printMaterials,'Not sure — maker recommends'];
/** @deprecated kept for older imports; use printMaterials */
export const materials = ['Any',...printMaterials];
export const technologies = ['Any','FDM','SLA/Resin','SLS','Metal'];
export const bidTechnologies = ['FDM','Resin','SLS','Other'];
export const categories = ['Prototypes','Replacement & functional parts','Miniatures & tabletop','Cosplay & props','Home & decor','Other / Not sure'];
/** Includes retired categories so older listings stay filterable. */
export const allCategories = [...categories,'3D design/modeling help'];
export const services = ['3D Printing','3D Design','Design + Printing'] as const;
export const serviceHints: Record<string,[string,string]> = {'3D Printing':['I need something 3D printed.','I already have a design or file and need someone to make the physical item.'],'3D Design':['I need help creating a 3D design.','I have an idea, sketch, or reference images and need someone to create a 3D model.'],'Design + Printing':['I need both design and printing.','I need someone to help design my idea and then make the finished item.']};
export const LEGACY_SERVICE = 'Service not specified';
export const serviceLabel = (s?: string | null) => s || LEGACY_SERVICE;
export const isDesignOnly = (j: { service?: string | null }) => j.service === '3D Design';
export const fileChoices = [{value:'Yes',label:'Yes, I have a 3D model.',hint:'I have a file ready to share with a maker.'},{value:'No, I have photos or a sketch',label:'I have an idea, sketch, or reference images.',hint:'I need help turning my idea into a printable design.'},{value:'Not sure',label:"I'm not sure what I need.",hint:"I'd like a maker to help me figure it out."}];
export const categoryHints: Record<string,string> = {'Prototypes':'Test a product idea or create an early version of a design.','Replacement & functional parts':'Broken clips, knobs, brackets, handles, or custom components.','Miniatures & tabletop':'Figurines, gaming miniatures, terrain, or display models.','Cosplay & props':'Costume pieces, accessories, replicas, or theatrical props.','Home & decor':'Organizers, decorations, household accessories, or personalized items.','Other / Not sure':"Something different, or you're unsure which category fits."};
export const fileStatuses = ['Yes','No, I have photos or a sketch','No, I need it designed'];
export const purposes = ['Display/decorative','Functional part','Prototype','Wearable or cosplay'];
export const finishes = ['As printed','Supports removed and cleaned','Sanded','Primed','Painted','Not sure — maker recommends'];
export const finishHints: Record<string,string> = {'As printed':'Straight from the printer, may show fine lines','Supports removed and cleaned':'Tidied up, small marks may remain','Sanded':'Smoother surface','Primed':'Smooth and ready for you to paint','Painted':'Fully finished in color','Not sure — maker recommends':'Let the maker suggest the best option'};
export const deliveries = ['Local pickup','Maker delivers or ships','Either'];
export const neededBy = ['Within a week','Within a month','Flexible'];
export const SITE_URL = 'https://printbids.lovable.app';
export const meta = (title: string, description: string, path?: string) => ({links: path ? [{rel:'canonical',href:`${SITE_URL}${path}`}] : [], meta:[...(path ? [{property:'og:url',content:`${SITE_URL}${path}`}] : []),{title:`${title} — PrintBids`},{name:'description',content:description},{property:'og:title',content:`${title} — PrintBids`},{property:'og:description',content:description},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'},{property:'og:image',content:`${SITE_URL}/og-image.jpg`},{name:'twitter:image',content:`${SITE_URL}/og-image.jpg`}]});
export const money = (amount: number) => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2}).format(amount);
export function timeline(job: Pick<Job,'deadline'>) { const days = Math.ceil((Date.parse(job.deadline)-Date.now())/86400000); return days <= 7 ? 'Within a week' : days <= 30 ? 'Within a month' : 'Flexible'; }
export const firstName = (name?: string | null) => (name ?? '').trim().split(/\s+/)[0] || 'Customer';
/** 5% fee with a $1 minimum, in cents. Used for both the customer service fee and the maker fee. */
export const feeCents = (total: number) => Math.max(100, Math.round(total * 5));
export const FOUNDING_SPOTS = 50;
export const FEE_FREE_HIRES = 5;
export const safeRedirect = (value: unknown) => typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : '/';

export const launchAreas = ['Atlanta, GA','Decatur, GA','Marietta, GA','Smyrna, GA','Sandy Springs, GA','Roswell, GA','Alpharetta, GA','Johns Creek, GA','Dunwoody, GA','Brookhaven, GA','Chamblee, GA','Tucker, GA','Norcross, GA','Duluth, GA','Lawrenceville, GA','Kennesaw, GA','Woodstock, GA','Douglasville, GA','East Point, GA','College Park, GA','Peachtree City, GA','Fayetteville, GA','Stockbridge, GA','McDonough, GA','Stone Mountain, GA','Lilburn, GA','Suwanee, GA'];
