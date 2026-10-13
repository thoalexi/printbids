# Move "Job at a glance" to the left and keep it in view

## Problem
On the job page, the "Job at a glance" summary sits above the bid form in the right-hand column, so it scrolls away as the maker scrolls down to fill in their bid.

## Fix
In `src/components/job-detail.tsx`, rearrange the desktop layout:

- **Left column (narrow, ~340px):** the "Job at a glance" card, pinned with `sticky top-6 self-start` so it stays in view while the rest of the page scrolls.
- **Right column (main):** the job title, brief, files, technical details, and below them the bid form — so the maker reads the brief and scrolls straight into bidding, with the summary always visible on the left.
- On mobile (single column), "Job at a glance" appears once at the top, followed by the brief and the bid form — no sticking, nothing overlapping.

The bids section, hire flow, and everything else on the page stay unchanged.

## Verification
- Desktop: open a job as a maker, scroll through the bid form — the summary stays pinned on the left.
- Phone width (~375px): summary appears once at top, form below, no overlap or horizontal scroll.
