import { useRef, useState } from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
import { useServerFn } from '@tanstack/react-start';
import { Plus, X, Upload, ArrowRight, Sparkles, Check, FileBox } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { generateQuestions } from '@/lib/jobs.functions';
import { materials, technologies, launchAreas } from '@/lib/printbids';
import { toast } from 'sonner';

const ACCEPTED = '.stl,.step,.stp,.3mf,.obj,.zip,.jpg,.jpeg,.png,.webp,.pdf,.svg,.dxf,image/*';
const OK_NAME = /\.(stl|step|stp|3mf|obj|zip|jpg|jpeg|png|webp|pdf|svg|dxf)$/i;
const MAX_BYTES = 50 * 1024 * 1024;

export function PostJob({ userId }: { userId: string }) {
  const navigate = useNavigate();
  const generate = useServerFn(generateQuestions);
  const [step, setStep] = useState(1);
  const [id, setId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [custom, setCustom] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [needsDesign, setNeedsDesign] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const chooseFiles = (chosen: File[]) => {
    if (!chosen.length) return;
    if (chosen.some(f => f.size > MAX_BYTES || !OK_NAME.test(f.name))) {
      setError('Use a supported model, drawing or photo file, up to 50 MB each.');
      if (fileInput.current) fileInput.current.value = '';
      return;
    }
    setError('');
    setFiles(chosen);
  };

  const removeFile = (name: string) => {
    setFiles(list => list.filter(f => f.name !== name));
    if (fileInput.current) fileInput.current.value = '';
  };

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <div className="flex gap-3 text-xs text-muted-foreground mb-9">
        {['Print details', 'Technical follow-up', 'Publish'].map((s, i) => (
          <span key={s} className={`flex items-center gap-2 ${step >= i + 1 ? 'text-primary' : ''}`}>
            <span className="rounded-full size-6 border border-current grid place-items-center">
              {step > i + 1 ? <Check className="size-3" /> : i + 1}
            </span>
            {s}
            {i < 2 && <span className="ml-3 text-muted-foreground">—</span>}
          </span>
        ))}
      </div>
      <h1 className="text-3xl font-semibold">
        {step === 1 ? 'What would you like to print?' : 'A few finishing details.'}
      </h1>
      <p className="text-muted-foreground text-sm mt-3 mb-8">
        {step === 1
          ? 'For Atlanta and surrounding communities. Shipping and local pickup stay within the launch area.'
          : 'Technical details help makers give you an accurate bid.'}
      </p>
      {error && (
        <div role="alert" className="border border-destructive rounded-md p-4 text-destructive mb-5 text-sm">
          {error}
        </div>
      )}
      {step === 1 ? (
        <form
          className="space-y-6"
          onSubmit={async e => {
            e.preventDefault();
            setError('');
            if (!needsDesign && !files.length) {
              setError('Upload a 3D model or select design help.');
              return;
            }
            setBusy(true);
            const f = new FormData(e.currentTarget);
            try {
              let jobId = id;
              if (!jobId) {
                const r = await supabase
                  .from('jobs')
                  .insert({
                    owner_id: userId,
                    title: String(f.get('title')),
                    summary: String(f.get('description')).slice(0, 160),
                    quantity: Number(f.get('quantity')),
                    deadline: String(f.get('deadline')),
                    budget: f.get('budget') ? Number(f.get('budget')) : null,
                    technology: String(f.get('technology')),
                    material: String(f.get('material')),
                    fulfillment: String(f.get('fulfillment')),
                    region: String(f.get('region')),
                  })
                  .select('id')
                  .single();
                if (r.error) throw r.error;
                jobId = r.data.id;
                setId(jobId);
                const paths: string[] = [];
                for (const file of files) {
                  const path = `${userId}/${jobId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
                  const upload = await supabase.storage.from('print-files').upload(path, file);
                  if (upload.error) throw upload.error;
                  paths.push(path);
                }
                const d = await supabase
                  .from('job_details')
                  .insert({
                    job_id: jobId,
                    description: String(f.get('description')),
                    files: paths,
                    needs_design: needsDesign,
                    questions: custom.filter(q => q.trim()),
                  });
                if (d.error) throw d.error;
              }
              const q = await generate({ data: { jobId } });
              setQuestions(q);
              setStep(2);
              toast.success('Draft saved');
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Unable to save draft');
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Job title
            <input
              className="field"
              name="title"
              placeholder="e.g. 20 custom electronics enclosures"
              required
              minLength={3}
              maxLength={160}
            />
          </label>
          <label>
            Description
            <textarea
              className="field min-h-32"
              name="description"
              placeholder="Dimensions, intended use, and anything your maker should know…"
              required
              maxLength={10000}
            />
          </label>
          <div className="grid sm:grid-cols-3 gap-5">
            <label>
              Quantity
              <input className="field" type="number" name="quantity" required min={1} defaultValue={1} />
            </label>
            <label>
              Needed by
              <input
                className="field"
                type="date"
                name="deadline"
                required
                min={new Date().toISOString().slice(0, 10)}
              />
            </label>
            <label>
              Budget · optional (USD)
              <input className="field" type="number" name="budget" min={0} placeholder="No fixed budget" />
            </label>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <label>
              Print technology
              <select name="technology" className="field">
                {technologies.map(t => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label>
              Material preference
              <select name="material" className="field">
                {materials.map(t => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
          </div>
          <div
            onDragOver={e => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => {
              e.preventDefault();
              setDragging(false);
              chooseFiles(Array.from(e.dataTransfer.files));
            }}
            className={`rounded-md border border-dashed p-7 text-center transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary ${
              dragging ? 'border-primary bg-primary/10' : 'border-border bg-muted/40'
            }`}
          >
            <Upload className="size-6 text-primary mx-auto mb-3" />
            <p className="text-sm font-medium">Add your 3D model, sketch or photo</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Drag files here, or pick them from your computer
            </p>
            <input
              ref={fileInput}
              id="job-files"
              type="file"
              className="sr-only"
              multiple
              accept={ACCEPTED}
              aria-label="Add 3D model, drawing or photo files"
              onChange={e => chooseFiles(Array.from(e.target.files ?? []))}
            />
            <label htmlFor="job-files" className={`${buttonVariants({ variant: 'default', size: 'sm' })} cursor-pointer`}>
              <Upload />
              Choose files
            </label>
            <p className="text-xs text-muted-foreground mt-4">
              3D models (STL, STEP, 3MF, OBJ, ZIP), design drawings (PDF, SVG, DXF) or photos (JPG, PNG, WEBP) · up to
              50 MB each
            </p>
            {files.length > 0 && (
              <ul className="mt-5 space-y-2 text-left">
                {files.map(f => (
                  <li
                    key={f.name}
                    className="flex items-center gap-2 text-xs rounded-md border border-border bg-background px-3 py-2"
                  >
                    <FileBox className="size-4 text-primary shrink-0" />
                    <span className="truncate grow">{f.name}</span>
                    <span className="text-muted-foreground shrink-0">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="size-6"
                      title={`Remove ${f.name}`}
                      onClick={() => removeFile(f.name)}
                    >
                      <X />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={needsDesign} onChange={e => setNeedsDesign(e.target.checked)} />
            Need design help / no 3D file yet
          </label>
          <div className="grid sm:grid-cols-2 gap-5">
            <label>
              Fulfillment
              <select className="field" name="fulfillment">
                <option>Shipping</option>
                <option>Local pickup</option>
              </select>
            </label>
            <label>
              Atlanta-area location
              <select className="field" name="region" required>
                {launchAreas.map(area => (
                  <option key={area}>{area}</option>
                ))}
              </select>
            </label>
          </div>
          <div>
            <div className="flex justify-between items-center mb-3">
              <label>Questions for your makers · optional</label>
              <span className="text-xs text-muted-foreground">{custom.length} / 5</span>
            </div>
            {custom.map((q, i) => (
              <div key={i} className="flex gap-2 mt-3">
                <input
                  className="field"
                  value={q}
                  required
                  maxLength={500}
                  placeholder="What should every maker answer?"
                  onChange={e => setCustom(a => a.map((v, n) => (n === i ? e.target.value : v)))}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  title="Remove question"
                  onClick={() => setCustom(a => a.filter((_, n) => n !== i))}
                >
                  <X />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="mt-3"
              disabled={custom.length >= 5}
              onClick={() => setCustom(a => [...a, ''])}
            >
              <Plus />
              Add a question
            </Button>
          </div>
          <div className="border-t border-border pt-6 flex justify-end">
            <Button disabled={busy} className="h-11">
              {busy ? 'Saving & preparing questions…' : 'Save draft & continue'}
              <ArrowRight />
            </Button>
          </div>
        </form>
      ) : (
        <form
          className="space-y-6"
          onSubmit={async e => {
            e.preventDefault();
            if (!id) return;
            setBusy(true);
            setError('');
            try {
              const f = new FormData(e.currentTarget);
              const answers = questions.map((_, i) => String(f.get(`answer-${i}`)));
              const d = await supabase.from('job_details').update({ technical_answers: answers }).eq('job_id', id);
              if (d.error) throw d.error;
              const j = await supabase.from('jobs').update({ status: 'open' }).eq('id', id);
              if (j.error) throw j.error;
              toast.success('Your print job is open for bids');
              await navigate({ to: '/jobs/$id', params: { id } });
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Unable to publish');
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="flex gap-2 items-center text-xs text-primary">
            <Sparkles className="size-4" />
            AI technical follow-up
          </div>
          {questions.map((q, i) => (
            <label key={q}>
              {q}
              <textarea className="field min-h-20" name={`answer-${i}`} required maxLength={2000} />
            </label>
          ))}
          <div className="flex justify-between border-t border-border pt-6">
            <Button variant="outline" type="button" asChild>
              <Link to="/my-posts">Keep as draft</Link>
            </Button>
            <Button disabled={busy}>
              {busy ? 'Publishing…' : 'Publish print job'}
              <ArrowRight />
            </Button>
          </div>
        </form>
      )}
    </main>
  );
}
