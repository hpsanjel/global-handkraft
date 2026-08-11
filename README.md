# Global Handcrafts AS

Global Handcrafts AS is a premium e-commerce platform for authentic handcrafted products sourced from Nepal and South Asia and delivered across Europe. Live at [handcraftsglobal.com](https://www.handcraftsglobal.com).

The product focus includes handcrafted wooden temples, pooja items, traditional clothing, festival collections, and custom mandap solutions.

## Project Scope

The complete project scope, brand guidelines, product universe, and implementation status (what's live vs. planned) are documented in [docs/project-scope.md](docs/project-scope.md).

## Implemented Features

**Storefront**
- Home, Shop (category + filter browsing), product detail pages, cart, checkout, account, contact, FAQ, About, privacy/terms/returns/shipping info pages
- Products with variants (price/size/stock per color and size combination) and paid add-ons
- Slide-in cart drawer, coupon code entry, site-wide active-coupon promo popup
- Currency switcher with live exchange rates (NOK/EUR/USD)
- Zone-based international pricing: admin-configurable markup applied automatically by shipping country
- Dynamic Open Graph image generation, `sitemap.xml`/`robots.txt`, newsletter signup, cookie/GDPR notice, WhatsApp contact button

**Checkout & Payments**
- Stripe Checkout with webhook-driven order creation
- Live shipping rate quotes via Bring (Posten Norge) and PostNord integrations, with admin-configurable shipping zones and free-shipping thresholds
- Per-country VAT rates
- Coupon engine: percentage discounts, free shipping, expiry, minimum cart-value requirement, and per-customer/global usage caps

**Orders & Documents**
- Full order status lifecycle (Pending → Paid → Processing → Shipped → Delivered, plus Cancelled/Refunded) with a status history timeline and customer email at each transition
- PDF document generation (via `@react-pdf/renderer`) for invoices, receipts, packing lists, customs invoices, gift receipts, return cards, shipping summaries, and order summaries — with barcodes, QR codes, and sequential document numbering
- Customer order history with document downloads

**Custom Orders (Mandap/Temple builds)**
- Customer-submitted custom order inquiries with dimensions, material, budget range, and reference images
- Dedicated admin Custom Orders dashboard, segregated from the regular Orders view
- Threaded messaging between customer and admin with unread indicators, rich-text notes
- Admin quoting workflow: request status (Pending/Accepted/Declined/Paid), quoted price, and a manually-entered Stripe payment link

**Accounts**
- Supabase email/password authentication, with admin role granted via an email allow-list or user metadata
- Customer account area: order history, addresses, custom-request threads, profile
- GDPR self-service data export and account-deletion request (with admin notification)

**Admin Dashboard**
- Live overview stats
- Sales reporting dashboard: date-range trend chart, revenue/refunds summary, country breakdown, CSV export
- Products CRUD with variant/add-on management, automatic slug generation, and image uploads (Supabase Storage)
- Categories CRUD
- Orders management, status control, and document generation
- Coupons CRUD
- Dedicated Custom Orders section: mandap/temple inquiry management with threaded messaging and payment status control
- Shipping zone and rate configuration
- Pricing zone configuration for international markup

**Transactional Email (Resend)**
- Order confirmation (with optional PDF receipt attached), order status updates, custom-inquiry notifications and replies, payment-status updates, and account-deletion admin alerts

**Reviews & Ratings**
- Customers submit star ratings and written reviews per product; reviews are held for admin approval before they appear publicly
- Admin moderation queue to approve, unapprove, or delete reviews
- Product page displays the approved review list plus an aggregate rating that recomputes automatically from approved reviews

**Testimonials**
- Admin CRUD for homepage testimonials (name, quote, star rating, photo, drag-to-reorder, show/hide) backed by the database and Supabase Storage, replacing the previous hardcoded array

## Current Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Prisma ORM + PostgreSQL (Supabase-hosted)
- Supabase Authentication + Supabase Storage
- Stripe Checkout
- Resend (transactional email)
- Bring and PostNord shipping APIs
- `@react-pdf/renderer`, `bwip-js` (barcodes), `qrcode` (QR codes) for document generation

## Planned Additions

- shadcn/ui, Framer Motion, Zustand, TanStack Query, React Hook Form + Zod are installed but not yet integrated across the UI
- Additional payment methods: Vipps, Klarna, PayPal, Apple Pay, Google Pay
- Wishlist and multilingual support

## Getting Started

1. Install dependencies
   ```bash
   npm install
   ```
2. Copy environment values
   ```bash
   cp .env.example .env.local
   ```
3. Configure PostgreSQL (Supabase) and service credentials (Stripe, Resend, Supabase, Bring/PostNord).
4. Configure admin email allow-list for dashboard access.
   ```bash
   ADMIN_EMAILS=admin@globalhandcrafts.no,owner@globalhandcrafts.no
   ```
5. Run database migrations
   ```bash
   npx prisma migrate dev
   ```
6. Start development server
   ```bash
   npm run dev
   ```

## Product Seed Data

The seed catalog in [lib/data/products.ts](lib/data/products.ts) includes broad sample products across:

- Handcrafted Wooden Temples
- Traditional Clothes
- Pooja Items
- Pooja Mandap
- Gift Collection
- New Arrivals
- Festival Specials

This sample data is intended for UI development and can be migrated to admin-driven catalog updates.
