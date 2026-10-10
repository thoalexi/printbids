# Printbids

Build a custom 3D printing bidding platform called "PrintBids" (or similar brand name) copying the architecture, styling tokens, sealed bidding rules, and user flows from ProjectBids, adapted specifically for 3D printing requests.

Core Features & Flow:
1. Posting a Print Job:
   - Replicate the job posting flow from ProjectBids (draft -> AI follow-up -> open listing).
   - Job fields: Title, description, quantity needed, deadline/timeline, optional budget (never required).
   - 3D Printing Specs:
     * File upload for 3D models (.stl, .step, .3mf, .obj, .zip) or an option: "Need design help / no 3D file yet".
     * Print technology preference: Any, FDM (Filament), SLA/Resin, SLS, Metal, etc.
     * Material preference: Any, PLA, PETG, ABS/ASA, TPU (Flexible), Nylon, Resin, Carbon Fiber.
     * Fulfillment: Shipping (country/region) or local pickup.
   - Custom poster questions: Posters can add up to 5 custom questions that every bidder must answer (adapted from ProjectBids owner questions).
   - AI follow-up step: Prompt 2–3 technical questions before publishing (e.g., infill, surface finish/tolerance needs, color preferences).

2. Sealed Bidding & 5-Bid Limit:
   - Match the sealed-bid model from ProjectBids: job poster sees all bids and itemized breakdowns; makers only see their own bid and spots filled (e.g. "3 of 5 bids placed").
   - Max 5 bids per job enforced at the database level.
   - Bidders answer all required poster questions before submitting.

3. Browse Jobs & Filters:
   - Browse page matching ProjectBids layout and styling: responsive cards, preview for guests, sign-in prompt when clicking to view full job details.
   - Multi-select filters: Material, Print Tech, Timeline, and Shipping/Local.

4. Hired Flow & Mutual Contact Card:
   - When the poster clicks "Hire", the job is awarded.
   - Once awarded, show the mutual Contact Card component from ProjectBids: client enters exact shipping address and delivery notes; maker enters contact phone, email, and tracking/shipping details. No messy in-app chat needed.

5. Maker Verification:
   - "Verified Maker" application flow based on ProjectBids verification: makers submit their printer farm specs, materials supported, portfolio photos of past prints, and links (Etsy, Printables, MakerWorld, website).
   - Verified Maker badge on profiles and bids.
   - Admin review dashboard (/admin/verifications) matching ProjectBids.

6. Design & Architecture:
   - Match the dark frosted-glass visual design, typography, header, mobile navigation, and footer from ProjectBids.
   - Database: Use Lovable Cloud with RLS on every table (sealed bids protected, owner-only project editing locked once first bid arrives).

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a078a856-ed44-4437-9d06-0ccba018d6eb).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
