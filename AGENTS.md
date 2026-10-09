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
- Keep the marketplace at `/` and signed-in workflows under the managed `_authenticated` layout; guests can browse safe previews without accessing full briefs.
- Split public job summaries from authenticated job details and sealed bids; database policies enforce visibility instead of relying on UI hiding.
- Use row-locked bid triggers and a narrowly authorized hire RPC for transactional bid limits and awards; regular edits cannot modify counts or awards.
- Keep AI requests in authenticated server functions and files in private Cloud Storage; signed URLs are issued only under participant-scoped policies.
- Keep user roles separate from editable profiles and verification approval restricted to database-validated admins.
