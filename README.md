# Jain Pathshala Portal

One Next.js app that serves many pathshalas. Everyone logs in on the same page with their
**mobile number and password**; the number decides which pathshala they belong to. Each pathshala's
admins and students only ever see their own pathshala's data. A super admin creates pathshalas and
their admins at `/superadmin`.

## Roles and logins

| Role | Logs in at | With | Can do |
|---|---|---|---|
| Super admin | `/superadmin` | username + password | Create pathshalas, add/disable/delete their admins, set admin mobile numbers, reset admin passwords, deactivate a pathshala, open any pathshala's admin panel |
| Pathshala admin | `/` | mobile + password | Everything in the admin dashboard, for their pathshala only |
| Family / student | `/` | mobile + password | Attendance, gathas, history, leaderboard, achievements |

**Families:** students who share a mobile number (siblings on a parent's phone) share one login and one
password, and switch between each other inside the app. A mobile number belongs to one pathshala only.
An admin can also be a parent with the same number: the admin password opens the admin panel, the
family password opens the family.

**Admins with several pathshalas:** an admin is one person with one mobile number and password. To let
an admin manage another pathshala, open that pathshala's **Admins** at `/superadmin` and enter their
mobile number. They then get a pathshala switcher in the admin dashboard header and land in the
pathshala they used last when logging in. Removing them from a pathshala takes effect within a minute;
removing them from their last pathshala deletes the admin login. Students and families always belong to
exactly one pathshala.

## Local setup

```bash
npm install
cp .env.example .env.local     # fill in MONGODB_URI and JWT_SECRET
npm run dev                    # http://localhost:3000
```

| Variable | Required | Purpose |
|---|---|---|
| `MONGODB_URI` | yes | MongoDB connection string |
| `DB_NAME` | no | Database name, default `pathshala` |
| `JWT_SECRET` | yes | Random string (32+ chars) that signs login tokens. `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |

## Moving the live app over (one time)

1. **Back up the database** (Atlas snapshot or `mongodump`).
2. Migrate the existing data into the first pathshala:
   ```powershell
   node --env-file=.env.local scripts/migrate-to-multi-pathshala.mjs vasupujya "Shree Somchintamani Vasupujyaswami Jain Pathshala" "Aadinath Parshwanath Jain Sangh"
   ```
   Assigns every existing record to that pathshala, moves the three hardcoded admins into the database,
   adds the hardcoded students who never logged in, hashes plain-text passwords, and creates indexes.
   Safe to run again.
3. Create your super admin:
   ```powershell
   $env:SUPERADMIN_PASSWORD = '<strong password>'
   node --env-file=.env.local scripts/create-superadmin.mjs <username> "<Your Name>"
   Remove-Item Env:SUPERADMIN_PASSWORD
   ```
4. At `/superadmin` → your pathshala → **Admins**: add a mobile number to each admin (pencil icon).
   Admins without a number can't log in.
5. Admins add each student's mobile number (**Users** → edit). A student keeps their current password,
   so they log in with mobile number + old password. Students without a number can't log in.
   Give siblings the same number to make them one family login.
6. The old app stores its data in the **`jainpathshala`** database; the new app uses `DB_NAME`
   (`pathshala`). Copy the history (attendance, gatha, pending entries, audit log, activity types):
   ```powershell
   node --env-file=.env.local scripts/import-old-data.mjs jainpathshala vasupujya --dry-run   # preview
   node --env-file=.env.local scripts/import-old-data.mjs jainpathshala vasupujya
   ```
   It only reads the old database and is safe to repeat; each run brings over what the old app saved since.
7. Deploy to Vercel with `MONGODB_URI`, `DB_NAME` and `JWT_SECRET`. Right before pointing people to
   it, run the import (step 6) one last time. Everyone logs in again once.
8. Delete `scripts/legacy-pathshala-data.mjs` (old hardcoded passwords).

## Adding a new sangh

At `/superadmin`: **New pathshala** (name, sangh, short code) → **Admins** → add an admin with their
mobile number and a password → send them the site link. Their admin adds students with mobile numbers.

## Telegram approval notifications (optional)

Every new attendance or gatha request is sent to the pathshala's linked Telegram chats with
**Approve / Reject** buttons. One bot serves all pathshalas; each pathshala links its own chats.

1. In Telegram, message **@BotFather** → `/newbot` → choose a name and a username ending in `bot`.
   Copy the **token** it gives you.
2. Add to `.env.local` **and** to Vercel → Settings → Environment Variables:
   ```
   TELEGRAM_BOT_TOKEN=<token from BotFather>
   TELEGRAM_BOT_USERNAME=<your bot's username, without @>
   TELEGRAM_WEBHOOK_SECRET=<any long random string>
   APP_URL=https://<your site>
   ```
3. Deploy, then once (and again if the site address changes):
   ```powershell
   node --env-file=.env.local scripts/telegram-setup.mjs https://<your site>
   ```
4. Each pathshala admin: **Overview → Telegram notifications → Connect my Telegram** (or **Connect a group**
   after adding the bot to the group) and press **Start** in Telegram. Send `/stop` in a chat to turn it off.

### Chat commands and scheduled messages

Type these in a connected chat (`/help` lists them):

| Command | What it does |
|---|---|
| `/pending` | Lists requests waiting, with **Approve all** |
| `/today` | Today's present / absent / new gathas / pending |
| `/week` | Last week's report (Sunday to Saturday) |
| `/birthday` or `/birthday 7` | Birthdays in the next 30 (or N) days, from the date of birth students add on their profile |
| `/absent` or `/absent 14` | Students not seen for N days, with a phone number to call |
| `/present Aditi, Ariha, Ashvi` | Marks them present after you confirm. Start with `yesterday` or a date (`/present 20/10 Aditi`) for another day |

Every new request also shows an **Approve all (N)** button once two or more are waiting.

**Midnight summary:** every night a summary of the day that just ended (present, absent, new gathas, pending,
students not seen for N days) is sent with **Approve all**. Turn it on/off and pick N in the dashboard card.
It runs on Vercel Cron (`vercel.json`, 19:00 UTC = 12:30 AM IST). On the free plan Vercel may run it any time
in that hour, so it arrives between 12:30 and 1:30 AM. Nothing is sent on days with no attendance and nothing
pending (e.g. Sundays).

**Sunday weekly report:** every Sunday around 12 noon (cron 06:00 UTC, so 11:30 AM – 12:30 PM IST) a report of the
Sunday-to-Saturday week that just ended: pathshala days, attendance (and change from last week), day by day,
new and revised gathas, who came every day, top gatha learners, and who did not come at all.

1. Add `CRON_SECRET=<any long random string>` in Vercel → Settings → Environment Variables, then redeploy.
   Vercel sends it with each cron call by itself; without it the call is refused.
2. Use **Test daily summary** / **Test weekly report** in the dashboard to see them right away.

Only chats linked to a pathshala can approve its requests; tapping a button on a request that was already
decided in the dashboard just shows "Already approved/rejected".

## How data is kept separate

Every pathshala record (`users`, `attendance`, `gatha`, `pending_*`, `family_groups`, `activity_types`,
`audit_log`, `admin_notes`, `profiles`, `passwords`, `achievements`) has a `pathshalaId`. The login token
carries the pathshala, and `getCollection()` in `lib/server/db.js` returns a wrapper that adds
`pathshalaId` to every filter, insert and aggregate for the current request, so a missed filter can't
leak data. Platform data uses `getGlobalCollection()`: `pathshalas`, `admins` (unique mobile per admin)
and `accounts` (one per mobile number: pathshala + family password).

## Structure

```
app/
  page.js               login + student/admin dashboards
  superadmin/page.js    super admin dashboard
  [slug]/page.js        old per-pathshala links redirect to /
  api/[...path]/route.js  API: auth, pathshala scoping, dispatch to controllers
components/             React UI (StudentDashboard, AdminDashboard, superadmin/, i18n)
lib/server/
  routes.js             route table with access level per route
  db.js / tenant.js     Mongo connection, per-pathshala scoping
  accounts.js           mobile-number login accounts
  auth.js               signed tokens (HMAC-SHA256)
  controllers/          request handlers (ported from the Express backend)
scripts/                migration and super admin setup
```
