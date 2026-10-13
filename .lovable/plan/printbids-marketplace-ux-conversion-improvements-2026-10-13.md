# PrintBids — Marketplace UX & Conversion Improvements

Enhancement only: branding, dark theme, fees, Stripe flow, verification and database security stay as they are.

## Review of current state

- Categories: 6 customer-facing categories already exist (Prototypes, Replacement & functional parts, Miniatures & tabletop, Cosplay & props, Home & decor, 3D design/modeling help). Mostly plain-language already.
- Calendar: the "Needed by" field uses the browser's native date picker; its icon is dark-on-dark.
- Finish: a plain dropdown that silently starts on "As printed".
- Budget: a native number box (hover-only arrows, scroll can change the value).
- AI follow-up: the prompt explicitly asks about infill, tolerances and surface finish — too technical for beginners.
- Bidding: the bid form sits in the right-hand column under the job; on mobile the job details are above it, so makers scroll back and forth.
- Maker card step: "Save a card" opens Stripe inside the bid area; after the card is saved the maker must press Submit again — the confusing second step.
- Hiring: the fee payment opens inline in the bids list; after paying, a small line says "Add your details in the contact card above", so the next step is easy to miss.
- After hire: the maker has to fill in phone/email after being hired; the customer waits.

## Priority 1 — Quick posting fixes (UI only)

1. Categories: keep all existing names (old listings, filters and links keep working). Add a short plain example under each in the dropdown helper text (e.g. "Replacement & functional parts — broken clips, knobs, brackets"), and add one new option "Other / Not sure". No renames.
2. Calendar: make the date picker icon light/lime with clear contrast and focus ring, the whole field clickable; applies to every date field on the site.
3. Finish: start empty with "Select your preferred finish" (required), add "Not sure — maker recommends", each option with a short plain description. Existing values unchanged.
4. Budget: text-style currency box with a fixed "$" prefix, numeric keypad on mobile, no arrows, no scroll changes, whole dollars validated.
5. AI questions: rewrite the instructions to ask 2–3 everyday questions about what the item needs to do (strong, flexible, heat, outdoor, fit with another part, looks), never terms like infill/tolerance/layer height; makers still read the answers plus all technical fields.

## Priority 2 — Bidding experience

6. Project details while bidding: on desktop, the job summary (photos/files, quantity, size, material, finish, color, needed-by, budget, customer answers) stays pinned beside the bid form. On mobile, a "Project details" expandable panel at the top of the bid form.
7. Verified maker info: verified makers' shop name and approved shop/portfolio links are pre-filled and shown on the bid as a "Verified Maker" block. Only the fields already meant for bids (shop name, links, photos) — never verification notes or anything else.
8. One-step bid submit: the maker reviews the bid with a clear fee note, then presses one button "Save card & place bid". After Stripe confirms the card, the bid is placed automatically on return — no second Submit — followed by a clear "Your bid is in" success state. Server already checks the card and blocks duplicate bids; the typed bid still survives the redirect.
9. Fee transparency before card entry: "No charge now. If you're hired, we charge 5% of your bid (min $1) — $X on this bid. Founding Makers: free on your first 5 hires. If the charge fails, the hire doesn't go through and you aren't hired."

## Priority 3 — Hiring and payments

10. Hire as a guided panel (dialog on desktop, full screen on mobile), in order:
    1. Review: maker name/badges, bid total, turnaround, method.
    2. Fee: "$80 bid + $4 service fee = $84 — you pay $4 now; you pay the maker $80 directly at pickup/delivery."
    3. Card form (Stripe).
    4. Confirmation: "You've hired your maker!" with the maker, next steps and the contact card right there.
    The hire still only completes after the server confirms both charges (unchanged).
11. No more scrolling for the next step: after payment the page opens straight onto the confirmation + contact card at the top.
12. Auto-share maker contact: makers add a business email and optional phone once in their bid ("shared with the customer only if you're hired"). These are stored privately and become visible only to the hiring customer after the hire is confirmed on the server. They prefill the maker's contact card so the customer sees them immediately. The customer still adds their own pickup/delivery details.

## Technical details

- P1: `post-job.tsx`, `printbids.ts` (add "Other / Not sure" + descriptions, finish "Not sure"), `styles.css` (`::-webkit-calendar-picker-indicator` invert/lime, `color-scheme: dark`), AI system prompt in `jobs.functions.ts`. Small DB check update only if categories/finishes are validated in a trigger.
- P2: `job-detail.tsx` layout split (sticky `aside` on `lg`, `<details>` on mobile); auto-submit on `card_session` return reusing the saved draft and existing `submitBid` server function (idempotent by job+maker).
- P3: hire dialog wraps existing `startHire`/`completeHire`; maker contact stored in a new private `bid_contacts` table (RLS: maker own row; customer readable only when job awarded to that maker), copied into the maker's `contact_cards` row inside `completeHire` after both charges succeed. No change to fees, award RPC or charge timing.
- Risks: auto-submit must not double-insert (server unique check); contact only released by server-side award, never by the redirect.
- Test desktop + 375px; run a full test-card hire end to end.

## Questions this plan assumes (tell me if different)

- Keep current category names and just add examples + "Other / Not sure".
- Maker contact collected at bid time (item 12) is acceptable to you.
