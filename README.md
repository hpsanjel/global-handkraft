# Global Handcraft

A premium e-commerce experience for handcrafted wooden Hindu temples and sacred home pieces for Europe.

## Tech stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- Prisma + PostgreSQL
- Stripe Checkout
- Resend emails

## Getting started

1. Install dependencies
   ```bash
   npm install
   ```
2. Copy the environment template
   ```bash
   cp .env.example .env.local
   ```
3. Configure your PostgreSQL connection string and service keys.
4. Run Prisma migrations
   ```bash
   npx prisma migrate dev --name init
   ```
5. Start the app
   ```bash
   npm run dev
   ```

## Notes

- The storefront includes product browsing, a shop page, product detail view, and an admin dashboard shell.
- The Prisma schema includes core models for products, variants, shipping, VAT, orders, reviews, and contact submissions.
