# Backend review — fixes

All paths are relative to your backend root. Only changed files are included
in this zip; drop them over your project.

## 🔴 Do this first (not a code change)
Your `.env` was shared with live credentials and was NOT in `.gitignore`.
Rotate every secret and treat them as compromised:
DB password, JWT_SECRET, SendGrid / Brevo / Zoho keys, AWS access key + secret,
Zoho EMAIL_PASS. Then redeploy with the new values.
`.gitignore` now ignores `.env`; use the included `.env.example` (no secrets).

## Security / access control
- **routes/authRouts.js** — `GET /` (list users) and `PATCH /:id/status`
  (suspend/activate) now require `isAdmin`, not just a login.
- **routes/categoryRoutes.js** — create / delete / status / admin-list now
  require `isAdmin`. (Deleting a category cascades to its ads, so this was
  dangerous when open to any user.)
- **routes/featuredRoutes.js** — `POST /expire` now requires `isAdmin`
  (was completely unauthenticated).
- **controllers/adsController.js** — `changeStatus` now authorises:
  admins can approve/reject/sold/delete any ad; an owner can only make
  seller transitions on their **own** ad (active↔sold, delete), and cannot
  approve a pending ad or reject. Previously any logged-in user could change
  any ad's status. (Uses the extended lookup in **services/adsService.js**.)
- **config/database.js** — `DB_NAME` is validated before being used in DDL,
  and the existence check is parameterised.

## Correctness bugs
- **index.js** — table creation reordered so parents exist before children
  (`categories` before `ads`). On a FRESH database the old order threw a
  foreign-key error and `ads` was never created. Also CORS origins now carry a
  scheme (the old `"18.188.218.74"` entries never matched) and read
  FRONTEND_URL / FRONTEND_URL_2 from env.
- **services/reviewsService.js** — `getReviewsByAd` selected `u.name`, which
  doesn't exist (users has `first_name`). `GET /api/reviews/:adId` was throwing.
- **services/dashboardService.js** — the admin stats object defined `categories`
  twice; renamed the count to `categoryCount` so nothing is shadowed. Also
  aliased the public `views` sum.
- **services/authService.js** — `getUserById` now selects subscription fields
  (so premium detection in `createAdService` actually works), and `verifyUser`
  clears the one-time `email_verification_token` after use.
- **controllers/supportController.js** + **services/notificationService.js** —
  removed the hardcoded "admin = user id 1". New tickets and user replies now
  notify every admin; admin replies notify the ticket owner.
- **middlewares/upload.js** — `sharp` was used but never imported (would throw
  `sharp is not defined`). Imported it, and left a note: `shouldTransform` /
  `transforms` only work with the `multer-s3-transform` package, not stock
  `multer-s3` — confirm which one is in package.json or compression is skipped.
- **jobs/subscriptionJob.js** — used `require("../config/database").query`
  via a confusingly named `pool`; now imports `{ query }` explicitly.

## Email template
- **utils/emailTemplate.js** — the header title was white text on a header with
  no background → invisible in every email. Gave the header the brand navy
  background and aligned the button colour. (Verified by rendering.)

## Not changed — recommendations
- JWT stays valid until expiry; a password reset/change can't invalidate an
  already-issued token without a token-version/denylist. Consider adding one.
- Add rate limiting on /login, /register, /forgot-password (brute force).
- The table-create helpers swallow errors (`console.error` + continue). The
  reorder fixes the known case, but consider rethrowing so a failed migration
  stops startup instead of booting half-made.
- Two cron jobs run `0 0 * * *` in different timezones (Asia/Colombo and
  Australia/Melbourne) — confirm the DB-backup timezone is intentional.
