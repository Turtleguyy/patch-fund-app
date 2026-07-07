# Supabase setup for Patch Fund

Follow these steps after creating a Supabase project.

## 1. Run the database migration

1. Open your project in the [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **SQL Editor** → **New query**.
3. Paste the contents of [`migrations/001_household_schema.sql`](./migrations/001_household_schema.sql).
4. Click **Run**.

You should see tables: `profiles`, `households`, `household_members`, `children`, `ledger_entries`, `week_summaries`.

## 1b. Parent attribution (if you already ran step 1 earlier)

If your database was created before parent names on entries were added, run the follow-up migration:

1. **SQL Editor** → **New query**
2. Paste [`migrations/002_parent_attribution.sql`](./migrations/002_parent_attribution.sql)
3. **Run**

This lets household members read each other's display names and auto-fills `created_by` on new entries.

## 2. Enable Realtime (for live sync)

1. Go to **Database** → **Replication** (or **Publications**).
2. Ensure `supabase_realtime` publication includes:
   - `children`
   - `ledger_entries`
   - `week_summaries`

Or run in SQL Editor:

```sql
alter publication supabase_realtime add table public.children;
alter publication supabase_realtime add table public.ledger_entries;
alter publication supabase_realtime add table public.week_summaries;
```

## 3. Enable Sign in with Apple

1. Go to **Authentication** → **Providers** → **Apple**.
2. Turn **Apple enabled** on.
3. Under **Authorized Client IDs**, add your iOS bundle ID:
   ```
   com.zach.patchfund
   ```
4. Save.

For native iOS (`signInWithIdToken`), you typically do **not** need a Services ID secret if you only use the app on device. If sign-in fails, see [Supabase Apple auth docs](https://supabase.com/docs/guides/auth/social-login/auth-apple).

## 4. Add API keys to `.env`

In Supabase: **Project Settings** → **API**

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Copy from `.env.example` if needed. Restart Metro after changing `.env`.

## 5. Rebuild the native app

Apple Sign In and any native config changes require a new dev build:

```bash
npm run prebuild
cd ios && pod install && cd ..
npm run ios -- --device
```

### Fix: “Provisioning Profile does not support Sign In with Apple”

If `expo run:ios` fails with errors about `com.apple.developer.applesignin`:

1. Open [Apple Developer → Identifiers](https://developer.apple.com/account/resources/identifiers/list).
2. Select **`com.zach.patchfund`** (or create it if missing).
3. Enable **Sign In with Apple** → **Save**.
4. Open `ios/PatchFund.xcworkspace` in Xcode.
5. Select the **PatchFund** target → **Signing & Capabilities**.
6. Confirm **Sign In with Apple** appears (add it via **+ Capability** if not).
7. Toggle **Automatically manage signing** off and on to refresh the profile.
8. **Product → Clean Build Folder**, then run `npm run ios -- --device` again.

## 6. Test the flow

**Parent A (creates household)**

1. Open Patch Fund → Sign in with Apple.
2. Tap **Create household**.
3. On the **Kids** tab, note the **invite code** (e.g. `K7M2NP`) and tap **Share invite code**.

**Parent B (joins)**

1. Install the app and sign in with Apple.
2. Tap **Join household** and enter the code.
3. Both devices should show the same children. Log an entry on one phone — it should appear on the other within a few seconds.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Invalid invite code" | Code is 6 characters, case-insensitive. Creator must share from **Kids** tab. |
| Apple sign-in fails | Rebuild native app; confirm bundle ID in Supabase Apple provider. |
| Build error: provisioning profile does not support Sign In with Apple | Enable **Sign In with Apple** on App ID `com.zach.patchfund` in Apple Developer, then refresh signing in Xcode (see [supabase/SETUP.md](supabase/SETUP.md)). |
| No live updates | Enable Realtime on the three tables (step 2). |
| App skips sign-in | Supabase env vars missing — app falls back to local-only mode. |
| RLS errors on insert | User must be in `household_members` for that household (create or join first). |

## Security notes

- The **anon** key is safe in the mobile app; Row Level Security limits access to household members only.
- Never put the **service_role** key in the app.
- `.env` is gitignored; use `.env.example` as a template.
