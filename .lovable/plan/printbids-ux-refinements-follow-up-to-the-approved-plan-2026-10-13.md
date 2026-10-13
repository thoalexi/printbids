# PrintBids UX refinements (follow-up to the approved plan)

Most of the three priorities are already built. This pass applies your refinements only.

## Priority 1 — Posting
- Finish: keep the empty starting choice "Select your preferred finish" and "Not sure — maker recommends", but make it optional. If left blank, the job saves as "No preference" and shows that to makers.

## Priority 2 — Bidding
- Draft safety: keep the typed bid in the browser's longer-lasting storage (not just the current tab), so it survives refreshes, closed tabs and failed card redirects. Cleared only after the server confirms the bid.
- Submission: the bid is sent automatically only after Stripe confirms the card is saved; "Your bid is in!" shows only when the server confirms it was saved.
- Recovery: if automatic placing fails, show the reason plus a clear "Place my bid" button (saved card is reused, no re-entry), and a "Use a different card" link that restarts card saving. Duplicate bids remain blocked on the server.
- Contact details: email (required) and phone (optional) with the note "Visible to the customer only after they hire you and the hire is confirmed." Older bids without these still hire normally; the maker fills in their contact card afterward as before.

## Priority 3 — Hiring
- Hire panel shows three clearly separated lines:
  - Due today to PrintBids: service fee (5%, min $1)
  - Paid directly to your maker at pickup or delivery: bid amount
  - Total project cost: bid + fee
- Plain note: "PrintBids only charges the service fee. You pay your maker for the print directly when you pick it up or it's delivered."

## Unchanged
Security rules, verification, Stripe charging logic, fee amounts and database permissions.

## Technical details
- `post-job.tsx`: drop `required` on finish; insert `finish || 'No preference'`.
- `job-detail.tsx` BidForm: switch draft/photo keys from sessionStorage to localStorage; on auto-submit failure keep `cardSession` and show error + retry; add "Use a different card" resetting checkout; update contact note copy. HireSteps: three-line breakdown.
- No database or payment function changes.
