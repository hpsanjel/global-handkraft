-- Realtime Authorization for the live custom-request chat (Broadcast +
-- Presence over private channels).
--
-- Context: `20260813020000_enable_rls_all_tables.sql` locked the PostgREST
-- Data API down to deny-all, since the app only ever reads/writes tables
-- through Prisma (which uses a BYPASSRLS role). The live chat feature is
-- the first thing that needs the *browser* Supabase client to talk to
-- Postgres directly -- not to read table rows, but to open private Realtime
-- channels (topic-scoped Broadcast/Presence), which Supabase authorizes by
-- checking RLS policies against the `realtime.messages` table using the
-- requesting client's JWT. Prisma is completely unaffected by this.
--
-- Two topic shapes are used by the app:
--   * `inquiry:<MandapInquiry.id>`   -- one per custom request; carries
--     instant messages, typing events, and online presence. Only the
--     customer who owns that request (matched by email, since
--     MandapInquiry has no userId column) or an admin may join.
--   * `admin:custom-requests`       -- carries live new/total count updates
--     for the admin sidebar badge. Only admins may join. The server always
--     publishes to it via the service-role client, which bypasses RLS, so
--     no insert policy is needed here.
--
-- Admin identification mirrors `hasAdminRole` (lib/admin-auth.ts): every
-- sign-in through app/auth/callback/route.ts stamps user_metadata.role to
-- "admin" for emails in ADMIN_EMAILS, so the JWT's user_metadata.role claim
-- is a reliable, always-in-sync way to check admin status from SQL without
-- duplicating the email list here.

create policy "inquiry participants can read realtime messages"
on "realtime"."messages"
for select
to authenticated
using (
	exists (
		select 1
		from "MandapInquiry" mi
		where 'inquiry:' || mi.id = realtime.topic()
		and (
			lower(mi.email) = lower(auth.jwt() ->> 'email')
			or (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
		)
	)
);

create policy "inquiry participants can publish realtime messages"
on "realtime"."messages"
for insert
to authenticated
with check (
	exists (
		select 1
		from "MandapInquiry" mi
		where 'inquiry:' || mi.id = realtime.topic()
		and (
			lower(mi.email) = lower(auth.jwt() ->> 'email')
			or (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
		)
	)
);

create policy "admins can read admin custom-request realtime messages"
on "realtime"."messages"
for select
to authenticated
using (
	realtime.topic() = 'admin:custom-requests'
	and (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- ============================================
-- NOTES
-- ============================================
-- These policies only take effect for channels opened with
-- `config: { private: true }` on the client -- see
-- components/mandap-inquiry-thread.tsx and components/admin/admin-shell.tsx.
--
-- To verify after applying: sign in as a customer in one browser and an
-- unrelated signed-in account in another, and confirm the second account
-- cannot subscribe to (or receive anything from) the first customer's
-- `inquiry:<id>` channel.
