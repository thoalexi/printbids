<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## PrintBids architecture
- Keep launch locations in a shared select list and matching database validation, and filter public listings by that list; geography restrictions must not rely on form controls alone.
- Keep the marketplace at `/` and signed-in workflows under the managed `_authenticated` layout; guests can browse safe previews without accessing full briefs.
- Split public job summaries from authenticated job details and sealed bids; database policies enforce visibility instead of relying on UI hiding.
- Use row-locked bid triggers and a narrowly authorized hire RPC for transactional bid limits and awards; regular edits cannot modify counts or awards.
- Keep AI requests in authenticated server functions and files in private Cloud Storage; signed URLs are issued only under participant-scoped policies.
- Keep user roles separate from editable profiles and verification approval restricted to database-validated admins.
- Keep browse filters in URL search params with "|"-separated multi-select values; public routes validate every param.
- Show customer and maker first names from snapshot columns set by database triggers, never from profile reads.
- Gate file downloads with the storage SELECT policy (participants, plus verified makers on verified-only jobs); the UI only mirrors it.
- Sign-in return paths use a validated `redirect` search param (starts with "/", not "//").
- Feedback and job reports are insert-only for users and readable only by database-validated admins.
- Hiring charges the maker's fee in a server function before calling the service-only award_job RPC; bids are inserted server-side only after a saved card is verified, so the fee can't be skipped.
- The landing page (/) is a marketing page with a recent-jobs preview; the full filter bar lives only on /browse.
