import { createFileRoute } from '@tanstack/react-router';
import { browseJobs } from '@/lib/jobs.functions';

export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = 'https://printbids.lovable.app'; void request;
        let jobs: { id: string }[] = [];
        try { jobs = await browseJobs(); } catch { jobs = []; }
        const paths = ['/', '/browse', '/verify', '/auth', ...jobs.map(j => `/jobs/${j.id}`)];
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map(p => `  <url><loc>${origin}${p}</loc></url>`).join('\n')}\n</urlset>\n`;
        return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
      },
    },
  },
});
