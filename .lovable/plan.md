# Keep "Job at a glance" visible while bidding

## Problem
On the job page, the "Job at a glance" summary sits above the bid form in the same column, so it scrolls away as the maker scrolls down to fill in their bid.

## Fix
In `src/components/job-detail.tsx`, make the "Job at a glance" card stick to the top of the screen on desktop while the rest of the column (bid form) scrolls beneath it:

- Add `sticky top-20 self-start` to the card wrapper so it stays pinned below the header while scrolling.
- On mobile (single column), leave the layout as-is — the summary already appears above the form, and sticking it would cover the form.

## Verification
- Open a job page as a maker at desktop width: scroll the bid form — the summary stays in view.
- Check at phone width: summary appears once above the form, nothing overlaps or scrolls oddly.
