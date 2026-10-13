# Separate "what's being made" from "what help is needed"

## Current state
- "3D design/modeling help" is one of the categories in the posting form and Browse filter.
- A separate "Do you have a 3D file?" question exists (Yes / photos or sketch / need it designed).
- Publishing currently requires either an uploaded file or "need it designed".
- Browse has a "Has a 3D file / Needs design" filter built from that answer.
- Makers have no way to say whether they offer design, printing or both.

## 1. Posting form
- Categories for new jobs: Prototypes, Replacement & functional parts, Miniatures & tabletop, Cosplay & props, Home & decor, Other / Not sure, each with your short example. "3D design/modeling help" is removed from new posts only.
- New required question at the top, "What kind of help do you need?", as three clickable cards (nothing preselected, keyboard-friendly, stacked on phones): 3D Printing, 3D Design, Design + Printing, with your descriptions.
- Then "Do you already have a 3D model or design file?" with your three choices.

## 2. Form adapts to the choice
- 3D Printing: uploads optional — a 3D file, reference photos, links in the description, or just a description all work. If they answer "idea/sketch" or "not sure", a gentle note suggests "Switch to Design + Printing" (never changed automatically).
- 3D Design: quantity, material, color, finish, technology and delivery are not shown. Note: "You'll receive a digital 3D design file, not a printed item." Location stays (Atlanta-only rule).
- Design + Printing: all fields; uploads optional; note "One maker handles both the design and the print."
- Budget helper text changes per choice (e.g. "Total budget for design and printing").

## 3. AI follow-up questions
- The AI is told the chosen service. Printing/combined: everyday questions on strength, flexibility, heat/outdoor use, fit with another part, looks vs function. Design only: what's being designed, intended use, size, expected file — no filament, quantity or finish questions. 2–3 questions; "I'm not sure" is fine.

## 4. Listings, job page, bidding
- Small service label on job cards and the job page next to the category.
- Design-only jobs hide quantity, material, finish, color, technology and delivery everywhere (cards, job page, AI input, filters).
- Bid form shows one line at the top, e.g. "Your bid should cover both the design and the print." Fees and bid math unchanged.
- Browse: new "Service needed" filter (saved in the address); design-only jobs are left out of material and delivery filter matches. Existing filters kept.

## 5. Maker capabilities
- "Services I offer: 3D Printing / 3D Design" checkboxes on the Verified Maker application, shown as a small line on that maker's bids. Existing makers start with nothing selected. Nobody is blocked from bidding by it.

## Historical listings
- Existing jobs keep every original value, including the old "3D design/modeling help" category, which still displays and stays filterable.
- A service is set only where the record clearly supports it: jobs that said "Yes, I have a 3D file" become 3D Printing. All others are left blank and show a neutral "Service not specified" label. No other field is changed.

## Technical details
- Migration (one): `jobs.service text` nullable with a check on the three values, backfilled only where `file_status = 'Yes'`; `verifications.services text[] default '{}'` limited to the two values. Relax the `guard_job` publish rule so a file is no longer required (technical follow-up still required). No new tables; policies unchanged.
- Design-only jobs store internal defaults for hidden print columns (quantity 1, existing column defaults); the UI and filters ignore them when `service = '3D Design'`.
- `needs_design` set true for 3D Design and Design + Printing.
- Files: `printbids.ts`, `post-job.tsx`, `jobs.functions.ts` prompt, `browse-jobs.tsx`, `job-detail.tsx`, `verification.tsx`.
- Check all three posting paths at desktop and 375px.
