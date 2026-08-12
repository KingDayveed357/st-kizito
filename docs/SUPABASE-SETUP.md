# Supabase Setup — Storage, Admin Access, Recovery

Everything the parish's Supabase project needs, in the order it needs it. Run each file in the
**SQL Editor** (Supabase dashboard → SQL Editor → New query → paste → Run).

---

## 0. If you are locked out of the admin portal right now

Read this first; the rest can wait.

The portal used to let in **any** Supabase Auth user. It now requires membership in `admin_users`,
checked by `public.is_admin()`. If that table does not exist, or exists but is empty, every correct
password is answered with *"This account is not authorized for the administrative portal."*

**Fix, in the SQL Editor:**

```sql
-- 1. Does the roster exist at all?
select to_regclass('public.admin_users') as roster_table;
```

- **Returns `null`** → the security migration has not been applied. Run
  `apps/web/db/2026_08_security_hardening.sql` in full, then continue to step 2.
- **Returns `admin_users`** → the table exists; continue to step 2.

```sql
-- 2. Who is on it? (Probably nobody — that is the lockout.)
select email, role from public.admin_users;

-- 3. Which accounts exist to promote?
select id, email from auth.users order by created_at;

-- 4. Promote yourself. Use the address exactly as it appears above.
insert into public.admin_users (user_id, email, role)
select id, email, 'owner' from auth.users where email = 'davidaniago@gmail.com'
on conflict (user_id) do update set role = 'owner';

-- 5. Confirm — this must return exactly one row.
select email, role from public.admin_users;
```

If step 4 reports `0 rows`, the address in `auth.users` differs from what you typed (a different
domain, or different capitalisation). Use the value from step 3 verbatim.

Then sign in again. If it still refuses, run `notify pgrst, 'reload schema';` — PostgREST caches the
function list and may not have noticed `is_admin()` yet.

---

## 1. Full run order for a fresh project

```
infra/supabase/schema.sql
apps/web/db/create_sacrament_requests.sql
apps/web/db/create_feedback_submissions.sql
apps/web/db/upgrade_payments_and_receipts.sql     ← creates the payment-receipts bucket
apps/web/db/2026_08_security_hardening.sql        ← creates admin_users; SEED IT (§0)
apps/web/db/2026_08_gallery.sql                   ← creates the gallery bucket
apps/web/db/add_admin_indexes.sql
```

Order matters: the last three depend on `public.is_admin()` and on the tables above them.

---

## 2. Storage — you may already have it

**The buckets are created by SQL, not by hand.** `upgrade_payments_and_receipts.sql` and
`2026_08_gallery.sql` each `insert into storage.buckets`, so if you have run those files the buckets
exist. Check:

```sql
select id, public, file_size_limit from storage.buckets;
```

Expected:

| id | public | file_size_limit | holds |
|---|---|---|---|
| `payment-receipts` | **false** | 5242880 (5 MB) | transfer screenshots for bookings and donations |
| `gallery` | **true** | 10485760 (10 MB) | parish photographs |

If a row is missing, run the corresponding file.

### Why one is private and the other is public

This is deliberate, not an oversight.

- **`payment-receipts` is private.** A receipt shows a parishioner's bank details and the amount
  they gave. Anonymous users may upload to it and overwrite their own object, but cannot read or
  list it. Administrators read through a signed URL that expires in 10 minutes.
- **`gallery` is public.** Parish photographs are published material, shown dozens at a time in a
  grid. Signing each thumbnail would add a round-trip per image and break the app's disk cache on
  every expiry — a real cost on a slow connection, for no security gain.

**Do not flip `payment-receipts` to public to "make receipts work".** If an admin cannot see a
receipt, the cause is one of the items in §4, not the bucket's visibility.

### Verifying the policies

```sql
select policyname, roles::text, cmd
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by policyname;
```

You should see, for `payment-receipts`: an anon INSERT, an anon UPDATE (this one makes retries
work — without it every re-submission fails silently), and admin SELECT/ALL gated on `is_admin()`.
For `gallery`: a public SELECT and an admin-only ALL.

---

## 3. Two settings you must change in the dashboard

SQL cannot do these.

1. **Authentication → Providers → Email → disable "Enable sign ups".**
   Without this anyone can self-register. They still would not be an admin — `admin_users` is the
   gate — but they would hold a valid session against your project.
2. **Authentication → Users → Invite user** is now the only way to add an administrator, followed by
   granting them access in the portal (Users & Admins) or via the SQL in §0.

---

## 4. When an admin cannot see a receipt

Work down this list; it is ordered by how often each is the cause.

```sql
-- Is a path even stored on the row?
select id, name, payment_receipt_url, created_at
from bookings order by created_at desc limit 10;
```

- **`payment_receipt_url` is null** → nothing was uploaded. Either the parishioner did not attach
  one, or the upload failed and they chose "submit without the receipt". The app no longer writes a
  path for a failed upload, so a null here is truthful.
- **A path is stored** → check the object actually exists:

```sql
select name, (metadata->>'size')::bigint as bytes
from storage.objects
where bucket_id = 'payment-receipts'
order by created_at desc limit 10;
```

- **`bytes` is 0** → this is the zero-byte bug that has now been fixed in the app. Old rows written
  before the fix will still point at empty objects and cannot be recovered; ask the parishioner to
  resend. New uploads are rejected client-side before they can reach storage empty.
- **No matching object** → the row's path and the bucket disagree. Confirm the anon INSERT policy
  exists (§2).
- **Object exists, right size, still will not display** → the admin account is not on
  `admin_users`, so the SELECT policy denies it and the signed URL 403s. See §0.

---

## 5. Health check

Paste this whole block; every row should read `ok`.

```sql
select 'admin roster'      as check,
       case when exists (select 1 from public.admin_users) then 'ok' else 'EMPTY — see §0' end as status
union all
select 'receipts bucket',
       case when exists (select 1 from storage.buckets where id='payment-receipts' and public=false)
            then 'ok' else 'MISSING or public' end
union all
select 'gallery bucket',
       case when exists (select 1 from storage.buckets where id='gallery' and public=true)
            then 'ok' else 'MISSING' end
union all
select 'anon receipt update policy',
       case when exists (select 1 from pg_policies where tablename='objects'
                         and policyname='Anon overwrite own payment receipt')
            then 'ok' else 'MISSING — retries will fail silently' end
union all
select 'no legacy auth.role policies',
       case when not exists (select 1 from pg_policies where schemaname='public' and qual like '%auth.role()%')
            then 'ok' else 'STILL PRESENT — rerun security hardening' end
union all
select 'booking amount trigger',
       case when exists (select 1 from pg_trigger where tgname='bookings_validate_amount')
            then 'ok' else 'MISSING' end
union all
select 'baptism date bounds',
       case when exists (select 1 from sacrament_request_types
                         where type='baptismal_card'
                           and required_fields @> '[{"key":"baptism_date","datePreset":"past"}]'::jsonb)
            then 'ok' else 'MISSING — rerun security hardening' end;
```
