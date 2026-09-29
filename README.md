# BMS Treats — website

React (Vite) + Supabase: browse desserts as a guest, create an account to
order, pick a residence/building/room, pay cash on delivery, and track the
order live once the seller marks it "on the way."

## Getting started

```bash
npm install
cp .env.example .env   # fill in your Supabase project URL + anon key
npm run dev
```

Then, in the Supabase SQL editor, run `supabase/schema.sql` top to bottom —
it creates every table, RLS policy, the `product-images` storage bucket, and
the profile-creation trigger.

To make an account admin:

```sql
update profiles set role = 'admin' where id = '<your-user-id>';
```

Or create a pre-verified admin test account without touching the UI:

```bash
npm run seed:admin
```

This uses `SUPABASE_SERVICE_ROLE_KEY` from `.env` — see `.env.example`.

## What's here

- **White theme with a caramel/cocoa accent**, header laid out as: logo →
  search (filters the menu by flavour) → track-order / account icons →
  a category row (All / Trays / Cups) below, mirroring the reference layout.
- **Guest browsing, account-gated checkout** — `/` and `/product/:id` work
  without login.
- **Address step** — residence search/dropdown → building → room number.
- **Payment step** — Cash on Delivery only; "Pay by card" intentionally
  shows a maintenance alert.
- **Track order** — `/track-order/:orderId` live-updates via Supabase
  Realtime; `/track-order-lookup` lists all of a buyer's own orders.
- **Login / Signup** — split two-panel layout (form on one side, a link to
  the other flow on the other), matching the reference design.
- **Product photos are real uploads only** — no AI generation. Admin uploads
  a photo per product (`src/pages/admin/AdminProducts.jsx`), stored in the
  `product-images` Supabase Storage bucket.
- **Hero section** — plays a real video if the admin sets one under
  `/admin/settings` (any hosted mp4/webm URL); otherwise falls back to a
  built-in animated dessert-cup scene so the hero is never static.
- **Admin**
  - `Orders` — grouped by Res name; one-click "Notify all" (bulk-flips those
    orders to Out for Delivery) and per-order "Notify this order."
  - `Products & Stock` — price/stock/active toggle inline, photo upload per
    product, add new flavours with a required photo.
  - `Residences` — add residences with comma-separated buildings, toggle
    deliverable areas.
  - `Site Settings` — set the hero video/poster image URL.

## Still to connect

1. **Order confirmation email** — `supabase/email-templates/order-slip.html`
   is the branded template. Wire it to a Supabase Edge Function (or Resend)
   triggered on `orders` insert. WhatsApp can follow the same trigger later.
2. **Real residences** — replace with the ones BMS Treats actually delivers
   to, via the admin Residences page.
3. **A real hero video** — film a short clip of the trays/cups being made or
   plated, host it anywhere, and paste the URL into Admin > Site Settings.
4. **Card payments** — schema has a `card` enum value reserved for later;
   the UI blocks it on purpose until a real gateway is wired up.
