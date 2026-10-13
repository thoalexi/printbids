# Separate "what's being made" from "what help is needed"

## Current state
- "3D design/modeling help" is one of the categories in the posting form and Browse filter.
- A separate "Do you have a 3D file?" question exists (Yes / photos or sketch / need it designed); "need it designed" already lets a job publish without a file.
- Browse has a "Has a 3D file / Needs design" filter built from that answer.
- Makers have no way to say whether they offer design, printing or both.

## 1. Posting form (UI)
- Categories for new jobs: Prototypes, Replacement & functional parts, Miniatures & tabletop, Cosplay & props, Home & decor, Other / Not sure — each with the short example you gave. "3D design/modeling help" is removed from new posts only.
- New required question at the top, "What kind of help do you need?", as three clickable cards (nothing preselected, keyboard-friendly, stacked on phones):
  - 3D Printing — "I already have a design or file and need someone to make the physical item."
  - 3D Design — "I have an idea, sketch, or reference images and need someone to create a 3D model."
  - Design + Printing — "I need someone to help design my idea and then make the finished item."
- Then "Do you already have a 3D model or design file?" with the three choices from your brief.

## 2. Form adapts to the choice
- 3D Printing: file upload required; quantity, material, color, finish, delivery shown. If they answer "idea/sketch" or "not sure", a gentle note offers a "Switch to Design + Printing" button (never changes it silently).
- 3D Design: sketches/photos optional; quantity, material, color, finish, technology and delivery hidden; note "You'll receive a digital 3D design file, not a printed item." Location stays (Atlanta-only rule).
- Design + Printing: all fields; uploads optional; note "One maker handles both the design and the print."
- Budget helper text changes per choice (e.g. "Total budget for design and printing").

## 3. AI follow-up questions
- The AI is told which service was chosen. Printing/combined: everyday questions about strength, flexibility, heat/outdoor use, fit with another part, looks vs function. Design only: what's being designed, intended use, size, and what file they expect — no filament, quantity or finish questions.
- Still 2–3 questions; customers may answer "I'm not sure".

## 4. Listings, job page, bidding
- Small service label (3D Printing / 3D Design / Design + Printing) on job cards and the job page, next to the category.
- Bid form shows one line at the top, e.g. "Your bid should cover both the design and the print." Fees and bid math unchanged.
- Browse: new "Service needed" filter (multi-select, saved in the address); existing filters kept.

## 5. Maker capabilities
- Add "Services I offer: 3D Printing / 3D Design" checkboxes to the Verified Maker application, shown as a small line on that maker's bids. Existing makers start with nothing selected (not assumed to design). No one is blocked from bidding based on it.

## Compatibility
- Old jobs keep their category; "3D design/modeling help" still displays and stays filterable on Browse for those listings.
- Existing jobs get a service value set once, based on what they already said: "need it designed" → Design + Printing, everything else → 3D Printing. No other field changes. The old file question value is kept so the existing "Has a 3D file" filter still works.

## Technical details
- Migration: `jobs.service text not null default '3D Printing'` with a check on the three values, backfilled from `file_status`; `verifications.services text[] default '{}'` limited to the two values. No new tables, policies unchanged (new columns follow existing row rules). `guard_job` publish rule unchanged: design-only and combined jobs set `needs_design = true` when no file is uploaded.
- Design-only jobs store quantity 1 and existing defaults for hidden print fields so nothing breaks.
- Files: `printbids.ts` (services, new categories + legacy list for filters), `post-job.tsx`, `jobs.functions.ts` prompt, `browse-jobs.tsx` (label + filter), `job-detail.tsx` (label, bid note, maker services line), `verification.tsx`.
- Check all three posting paths at desktop and 375px.
