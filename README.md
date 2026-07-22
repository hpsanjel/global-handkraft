# Global Handcrafts AS

Global Handcrafts AS is a premium e-commerce platform for authentic handcrafted products sourced from Nepal and South Asia and delivered across Europe.

The product focus includes handcrafted wooden temples, pooja items, traditional clothing, festival collections, and custom mandap solutions.

## Project Scope

The complete project scope, information architecture, feature matrix, content strategy, roadmap phases, and technical implementation plan are documented in [docs/project-scope.md](docs/project-scope.md).

## Current Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Prisma ORM + PostgreSQL
- Stripe Checkout
- Resend (transactional emails)

## Planned/Target Stack Additions

- shadcn/ui
- Framer Motion
- Zustand
- React Hook Form + Zod
- TanStack Query
- Supabase Authentication
- Cloudinary image management
- Vipps, Klarna, PayPal, Apple Pay, Google Pay

## Getting Started

1. Install dependencies
   ```bash
   npm install
   ```
2. Copy environment values
   ```bash
   cp .env.example .env.local
   ```
3. Configure PostgreSQL and service credentials.
4. Run database migrations
   ```bash
   npx prisma migrate dev --name init
   ```
5. Start development server
   ```bash
   npm run dev
   ```

## Product Seed Data

The seed catalog in [lib/data/products.ts](lib/data/products.ts) now includes broad sample products across:

- Handcrafted Wooden Temples
- Traditional Clothes
- Pooja Items
- Pooja Mandap
- Gift Collection
- New Arrivals
- Festival Specials

This sample data is intended for UI development and can be migrated to managed CMS or admin-driven catalog updates.
