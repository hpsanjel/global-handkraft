# Global Handcrafts AS: Project Scope and Product Vision

## 1. Brand and Business Context

Global Handcrafts AS is a Norway-based brand importing and selling authentic handcrafted products from Nepal and South Asia for customers across Norway and Europe.

Primary brand values:

- Authentic craftsmanship
- Cultural continuity
- Fair trade and ethical sourcing
- Premium quality and trust
- Global delivery reliability

Primary visual direction:

- Premium Scandinavian minimalism blended with South Asian craftsmanship
- Elegant, trustworthy, culturally rich presentation
- Logo-inspired gradients and motifs without clutter

## 2. Brand Identity Guidelines

Use these as design tokens across UI components.

- Primary Green: `#4CAF50`
- Primary Orange: `#F7931E`
- Dark Navy: `#1B365D`
- Light Background: `#FAFAF7`
- Accent Gold: `#D4AF37`
- White: `#FFFFFF`

Design and motion language:

- Rounded cards, soft shadows, clean white space
- Premium typography hierarchy
- Fade-in on scroll, hover lift, smooth transitions
- Glassmorphism only in selective highlight surfaces
- Mobile-first responsive design with high readability

Typography targets:

- Headings: Playfair Display
- Body: Inter
- Buttons: Semibold weight

## 3. Target Markets and Customer Segments

Geographic focus:

- Norway
- Sweden
- Denmark
- Finland
- Germany

Primary audience segments:

- Hindu families
- Nepali and Indian communities
- Temple organizations and religious institutions
- Interior decorators
- Gift buyers
- Spiritual lifestyle customers

## 4. Product Universe

### 4.1 Handcrafted Wooden Temples

Core offering groups:

- Small Temple
- Medium Temple
- Premium Temple
- Wall Mounted Temple
- Teak Wood Temple
- Rosewood Temple
- Custom Temple

Per-product content requirements:

- Multiple images
- Description and handcrafted process story
- Material details
- Dimensions and weight
- Shipping information
- Reviews and rating
- Price and stock by variant

### 4.2 Traditional Clothes

Men:

- Daura Suruwal
- Kurta
- Dhaka Topi
- Sherwani

Women:

- Saree
- Lehenga
- Kurti
- Salwar Suit

Accessories:

- Shawls
- Handmade bags
- Jewelry

### 4.3 Pooja Items

Brass:

- Diya
- Bell
- Kalash
- Aarti lamp

Copper:

- Lota
- Plate
- Spoon

Wood/Stone/Decor:

- Incense holder
- Pooja chowki
- Shivling
- Decorative lamps

Accessories:

- Incense
- Camphor
- Kumkum
- Sindoor
- Rudraksha
- Mala

### 4.4 Pooja Mandap

- Indoor mandap
- Outdoor mandap
- Wedding mandap
- Festival mandap
- Temple decoration solutions
- Custom designs

## 5. Website Information Architecture

Primary pages:

- Home
- About Us
- Shop
- Product Details
- Categories
- Cart
- Checkout
- Account
- Contact
- Blog
- FAQ

Support pages:

- Privacy Policy
- Terms
- Shipping Policy
- Returns Policy
- Cookie/GDPR

## 6. Homepage Composition

Hero section:

- Headline: "Authentic Handcrafted Treasures Delivered Across Europe"
- Subheadline: Premium handcrafted temples, pooja items, traditional clothing, and cultural products sourced directly from skilled artisans.
- CTA: Shop Now
- Secondary CTA: Explore Temples

Planned sections:

- Featured Categories
- Best Sellers
- New Arrivals
- Featured Collections
- Why Choose Us
- Artisan Story and Craftsmanship
- Testimonials
- Statistics
- Instagram Gallery/Feed
- Newsletter

Suggested KPI counters:

- 1000+ Happy Customers
- 500+ Handmade Products
- 20+ Skilled Artisans
- 10+ Countries Served

## 7. Shop and Discovery Experience

Filtering requirements:

- Category
- Price range
- Material
- Wood type
- Size
- Color
- Availability

Sorting requirements:

- Newest
- Popularity
- Highest price
- Lowest price
- Best rated

Discovery enhancements:

- Live search
- Advanced search
- Voice search
- Infinite scroll
- Grid/List toggle
- Quick view
- Product comparison
- Recently viewed

## 8. Product Detail Experience

Required sections:

- Large image gallery
- Zoom and optional 360 view
- Description and specifications
- Materials, dimensions, and weight
- Handcrafted story
- Care instructions
- Shipping and delivery details
- Reviews
- Related products
- Recently viewed
- Wishlist and share actions

## 9. Commerce and Checkout

Cart capabilities:

- Slide-in cart drawer
- Quantity updates
- Coupon application
- Gift message
- Shipping estimate

Checkout capabilities:

- Guest and account checkout
- Address and delivery method
- Payment methods
- Order summary
- Confirmation and tracking details

Payment methods roadmap:

- Stripe
- Visa
- Mastercard
- Apple Pay
- Google Pay
- PayPal
- Vipps
- Klarna

## 10. Shipping and Operations

Primary service countries:

- Norway
- Sweden
- Denmark
- Finland
- Germany

Customer logistics requirements:

- Estimated delivery: 3-10 days
- Real-time shipping calculator
- Tracking number generation
- Order tracking UI

## 11. Customer Account and Support

Account modules:

- Orders
- Wishlist
- Addresses
- Profile
- Returns
- Password management

Contact and support:

- Contact form
- Map/location
- Phone and email
- WhatsApp
- Business hours
- FAQ knowledge base

## 12. Content and SEO Strategy

Blog categories:

- Culture
- Temple decoration
- Pooja guides
- Festival guides
- Home decor
- Traditional clothing

SEO requirements:

- Structured data (Schema.org)
- Dynamic titles and descriptions
- Open Graph metadata
- Canonical URLs
- XML sitemap
- robots.txt
- Semantic HTML
- Optimized image alt text
- Core Web Vitals focus

## 13. Admin Dashboard Scope

Admin modules:

- Dashboard overview
- Orders
- Customers
- Products
- Inventory
- Coupons and discounts
- Analytics and sales graph
- Product reviews moderation
- Shipping settings
- Global settings
- Content management
- Blog manager
- Media library
- Role management

## 14. Technical Architecture Plan

Current stack in repository:

- Next.js 15 + TypeScript
- Tailwind CSS
- Prisma + PostgreSQL

Target architecture additions:

- shadcn/ui for composable UI primitives
- Framer Motion for interactions and transitions
- Zustand for local state (cart, UI state)
- TanStack Query for async caching
- React Hook Form + Zod for robust form validation
- Supabase Authentication for account flows
- Cloudinary for image delivery and optimization
- Stripe for checkout and webhook lifecycle
- Resend for transactional email (order updates)
- Vercel deployment pipeline

Data and extensibility principles:

- Product schema supports variants, add-ons, and rich metadata
- CMS-friendly content blocks for homepage and blog
- API contracts for future multi-vendor and personalization support
- Modular service layer for payment/shipping providers

## 15. Accessibility, Privacy, and Compliance

Accessibility:

- Keyboard navigation compatibility
- Sufficient contrast and readable typography scales
- ARIA semantics for interactive controls
- Focus state visibility

Compliance and trust:

- Cookie consent
- GDPR data handling
- Transparent returns and shipping policies
- Secure payment and privacy pages

## 16. Future Enhancements (Architecture-Ready)

Planned expansion capabilities:

- Multi-vendor marketplace support
- Custom temple builder with 3D preview
- AI-powered recommendations
- Product personalization (engraving/custom sizing)
- Loyalty and rewards
- Referral system
- Gift cards
- Subscription pooja kits
- Multilingual support (EN/NO/NE/HI)
- Multi-currency support (NOK/EUR/USD)
- ERP and shipping integrations
- iOS and Android mobile apps

## 17. Delivery Roadmap (Recommended)

Phase 1: Brand and storefront foundation

- Finalize design system and brand tokens
- Complete homepage, shop, product detail, and cart UX
- Seed complete product categories and variants

Phase 2: Commerce and trust systems

- Checkout hardening and payment integrations
- Shipping calculator and tracking workflow
- SEO, content, and policy pages

Phase 3: Admin and operational maturity

- Dashboard modules and content management
- Review moderation and analytics
- Campaign tools (coupons, featured collections)

Phase 4: Growth and advanced capabilities

- Localization and currencies
- Recommendation engine and personalization
- Multi-vendor and 3D custom builder readiness

## 18. Immediate Implementation Priorities

1. Align global brand naming to "Global Handcrafts AS" across metadata and UI.
2. Introduce full category taxonomy and filtering schema in shop UI.
3. Expand product model for richer specifications and review content.
4. Implement homepage section framework matching this scope.
5. Prepare integrations for authentication, Cloudinary, and multi-payment roadmap.
