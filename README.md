# Aravali Maintenance Portal

A simple maintenance-request portal for Aravali Hostel, IIT Delhi.
Anyone can report and view problems; the maintenance secretary, warden
and caretaker log in to change a problem's status.

- **Frontend:** Vite + React + React Router (plain CSS, no UI library)
- **Backend / database / photo storage / auth:** Supabase (free tier)
- **Hosting:** Vercel (free)

## 1. Run it locally

```bash
npm install
cp .env.example .env      # then fill in your Supabase values
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

## 2. Set up Supabase (one time)

1. Create a free project at https://supabase.com.
2. **SQL Editor → New query →** paste all of `supabase-setup.sql` → **Run**.
3. **Storage → New bucket →** name it `problem-photos`, turn **Public bucket ON**.
   (The SQL above already added the upload/read policies for it.)
4. **Authentication → Users → Add user →** create one account each for the
   secretary, warden and caretaker (enable "Auto Confirm User").
5. **Project Settings → API →** copy the **Project URL** and **anon public key**
   into your `.env` file.

## 3. Deploy to Vercel (free)

1. Push this folder to a GitHub repo.
2. On https://vercel.com → **Add New → Project →** import the repo.
3. Framework preset: **Vite** (auto-detected). Build command `npm run build`,
   output `dist` (auto-filled).
4. **Environment Variables →** add `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY` (same values as your `.env`).
5. **Deploy.** Every push to the repo re-deploys automatically.

## Statuses

| Status              | Meaning                          | Colour |
|---------------------|----------------------------------|--------|
| Not Yet Registered  | Reported, not yet picked up      | red    |
| Registered          | Acknowledged / being worked on   | amber  |
| Resolved            | Fixed                            | green  |

## Notes

- The `anon` key is safe to expose in the browser — RLS policies control
  what anonymous users can do (read + add only). Never put the `service_role`
  key in this app.
- Only give login credentials to the three staff members.
