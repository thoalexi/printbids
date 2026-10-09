# Bring PrintBids in line with the project Knowledge

This touches payments, the database, verification and file handling, so it is planned before building. Work is done in 4 phases. Each phase is checked on desktop and mobile widths.

## Phase 1: Site shell, sign-in and admin
- Footer "Feedback" button opens a dialog. It has a message field (max 2,000 characters), an optional email (filled in when signed in), and it records the current page. Anyone can send feedback. Only admins can read it.
- Remove the Toaster and every `window.confirm` / toast call. Messages appear inline instead.
- Use `?redirect=` everywhere instead of `?next=`. It must start with "/" and must not start with "//". This covers the sign-in page, the sign-in gate, Google sign-in, signup confirmation and every link.
- Add `sitemap.xml` covering the public pages (/, /verify, /auth, and public job previews). Update robots.txt to point to it.
- Admin area gets three queues: Verifications, Feedback and Reported jobs. Admins can reach them at every screen width.

## Phase 2: Posting and browsing
- New posting fields: category (6 Knowledge categories), approximate dimensions, and these multiple-choice questions: 3D file status, purpose, material (adds "Not sure — maker recommends"), finish, color (pick or maker's choice), and delivery (pickup / delivery / either). No required budget.
- Custom questions: up to 5, each 200 characters max. The database enforces this too.
- "Verified makers only" toggle.
- Required checkbox: "I own or have the rights to these files."
- Browse filters are saved in the URL. They cover: category, location (multi-select, values separated by "|"), material, has-file vs needs-design, delivery, quick "needed by" choices, Posted by Verified Customers, and Verified Makers only.
- Browse hides your own posts and hired jobs. Cards show the customer's first name only.
- Job page preview for guests: guests see the thumbnail and basic details. Files and the full brief need sign-in, and verified-makers-only files are visible only to verified makers. These rules are enforced in the database and in file access, not just the screen.
- "Report job" button for prohibited or infringing listings. Reports go to the admin queue, and admins can remove the job.

## Phase 3: Bidding, hiring and contact card
- Bid form: material, print/machine time, post-processing, design/modeling and delivery costs, each optional and added up automatically. A maker can enter only a total instead, and the breakdown then shows "–".
- The bid form also asks for turnaround, technology, material, pickup/delivery offered, website and shop links, and up to 6 past-print photos. Each answer to a poster question is limited to 500 characters.
- Verified makers get their approved details filled into empty fields only.
- Verified-makers-only jobs reject unverified bidders in the database.
- Also fixes the known bug where makers saw the poster's edit form instead of the bid form.
- Contact card: the customer adds pickup or delivery notes, and an address only when the maker delivers. The maker adds phone, email, pickup location and hours, and tracking. It has Call / Text / Email / Open in Maps buttons, plus Track package when tracking exists.
- Verified Customer badge appears automatically after 2+ hires.

## Phase 4: Payments (built-in Stripe)
- Turn on Lovable's built-in Stripe payments. You will fill in a short account form.
- Placing a bid saves the maker's card with no charge. The typed bid survives the card step.
- Clicking "Hire" charges the hired maker 10% of the winning total, with no minimum or cap. The hire completes only after that charge succeeds. On failure the customer sees "We couldn't complete the hire. Please try again." The customer never sees a payment message.
- Saved cards of makers who weren't hired are released when someone is hired or when the "needed by" date passes. A daily job releases cards after the date.
- Verified Maker application: optional shop name, 3–10 required print photos, and a $5 fee. It enters the admin queue only after payment.

## Technical details
- New tables: `feedback` (insert-only, admin read), `job_reports` (insert by signed-in users, admin read and resolve), `bid_payment_methods` / `hire_charges` (server-only).
- New job columns: category, dimensions, file_status, purpose, finish, color, delivery, verified_only, rights_confirmed, and an owner first-name snapshot. Bids get breakdown columns, a total, technology, material, offerings, links and photos. All columns are additive.
- Triggers enforce: question length, answer length, verified-only bidding, a 6-photo maximum on bids, and 3–10 photos on verifications.
- A `public_job_previews` view exposes safe fields to guests.
- Signed file URLs come from a server function that checks participant and verification rules.
- Hire moves to a server function: charge the fee off-session, then award using the service role after the charge is confirmed. The `hire_bid` RPC is no longer used by the app.
- Stripe webhooks go under `/api/public/` and verify signatures.

## Open item
- The Knowledge leaves "watermark or download-limit files" undecided. The plan does neither until you choose.
