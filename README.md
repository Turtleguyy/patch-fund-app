# Patch Fund

A parent-facing allowance tracker for iOS. Log weekly allowance for each child, see the current balance at a glance, review past weeks, and share a household between parents with Supabase.

Built with **Expo SDK 56** and **React Native**.

## What it does

### Home

- Shows the **current week's allowance** as the hero element (large balance, green when positive / red when negative), including the week start date.
- **Log an entry** — add or take money with an amount and a short note ("What for?").
- **Quick log** — after you've logged a few times, the three most common amount + note combos for the selected child appear as one-tap buttons below **Log an entry** (saves immediately).
- Lists **this week's entries** (reason, date, amount, and who logged it when using household sync).
- **Tap an entry** to edit the amount or note.
- **Swipe left** on an entry to delete it (with confirmation).
- **Start new week** — below the entry list, with a short explanation; closes the week (saves a summary to History) and resets the child's allowance.
- In **landscape**, balance and actions stay on the left; entries scroll on the right.

Child switching appears on Home only when you have more than one kid.

### Log an entry

Used when you tap **Log an entry** on Home or when you **tap an existing entry** to edit it.

- **Add** / **Take** toggle defaults to whichever you used last (create only; edit keeps the entry's direction).
- **Suggestions** — the same top-three common entries appear as chips at the top when creating; tap one to prefill amount and note (you can edit before saving).

### Household (tab)

Organized in sections: **You**, **Sharing** (when signed in), and **Kids**.

- Set or edit **your name** — shown on entries you log so the other parent knows who added them.
- **Invite code** and **Share invite code** when signed in (for the other parent to join).
- List all children with weekly allowance; tap to edit, trash icon to remove.
- **Add a child** opens a blank form.
- **Sign out** when using household sync.

### History (tab)

- Past weeks for the selected child, newest first.
- Each row shows the date range, starting allowance, and **ending balance**.
- Tap a week to see its entries and ending total.
- **Tap an entry** to edit the amount or note.
- **Swipe left** to delete entries from that week.
- Weeks are recorded when you tap **Start new week** on Home.
- Older entries from before week summaries existed are grouped by calendar week as a best-effort fallback.

### Household sync (Supabase)

When `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are set:

- **Sign in** with Apple (iOS), Google (native account picker), or Facebook (browser OAuth) — each provider is a separate account (no linking).
- **Set your name** (from the provider when available, or enter it manually).
- **Create a household** or **join** with a 6-character invite code from another parent.
- Children, entries, and week history sync through Supabase with **real-time updates** between devices.
- Each entry records **which parent logged it** (by display name).
- Optionally copy kids already on the device when creating a new household.

Without Supabase env vars, the app runs in **local-only** mode (single device, AsyncStorage). Parent attribution and invite codes are not available in local mode.

See **[supabase/SETUP.md](supabase/SETUP.md)** for dashboard configuration (including a follow-up migration for parent attribution).

## Requirements

| Requirement | Notes |
|-------------|--------|
| **Dev or release build** | Uses `expo-dev-client`, Sign in with Apple, native Google Sign-In — **Expo Go will not work**. |
| **Apple Developer account** | Device installs and TestFlight. |
| **Node.js** | LTS recommended. |

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env` and fill in:

| Variable | Required | Purpose |
|----------|----------|---------|
| `APPLE_TEAM_ID` | iOS builds | 10-character Team ID from Apple Developer → Membership. |
| `EXPO_PUBLIC_SUPABASE_URL` | Household sync | Supabase project URL (Project Settings → API). |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Household sync | Supabase anon/public key. |
| `EXPO_PUBLIC_GOOGLE_AUTH_WEB_CLIENT_ID` | Google sign-in | Web OAuth client ID (also goes in Supabase Google provider). |
| `EXPO_PUBLIC_GOOGLE_AUTH_IOS_CLIENT_ID` | Google sign-in | iOS OAuth client ID for bundle `com.zach.patchfund`. |

Never commit `.env`. Env vars are **baked in at build time** — set them before `prebuild` and building a release or TestFlight archive. After changing `.env`, restart Metro for JS; run `prebuild` and rebuild the native app when adding native modules (e.g. Google Sign-In).

### 3. Configure Supabase (household sharing)

Follow **[supabase/SETUP.md](supabase/SETUP.md)**:

1. Run `migrations/001_household_schema.sql` in the Supabase SQL Editor.
2. Run `migrations/002_parent_attribution.sql` (parent names on entries).
3. Run `migrations/003_ledger_entry_update.sql` (allows editing entry amount and reason).
4. Enable Realtime on `children`, `ledger_entries`, `week_summaries`.
5. Enable the Apple auth provider (add bundle ID `com.zach.patchfund`).
6. Enable Google (Web + iOS OAuth clients, **Skip nonce check**) — see [supabase/SETUP.md](supabase/SETUP.md) §3b.
7. Enable Facebook (App ID + Secret, redirect `patchfund://auth/callback`) — see [supabase/SETUP.md](supabase/SETUP.md) §3c.
8. Add Supabase and Google client IDs to `.env` (see step 2 above).

### 4. Generate native projects

```bash
npm run prebuild
cd ios && pod install && cd ..
```

### 5. Run on device (development)

```bash
# Terminal 1 — Metro (use LAN or tunnel if the phone can't reach your Mac)
npm run start:lan
# or
npm run start:tunnel

# Terminal 2 — build and install (first time or after native changes)
npm run ios -- --device
```

On first launch you'll see the **Expo Dev Client** launcher. Tap **Patch Fund** to load JS from Metro. Grant **Local Network** if the dev server doesn't appear.

Google Sign-In requires the Google client IDs in `.env` **before** `prebuild` (adds the iOS URL scheme and CocoaPods config). If `pod install` fails on Google pods, the `withGoogleSignInPods` plugin adds the required modular headers.

### 6. Release build & TestFlight

For standalone use (no Metro, no cable) — e.g. your phone or a spouse's device via TestFlight:

1. Confirm `.env` has the Supabase keys you want in production.
2. Build Release and install locally, or archive for TestFlight:

```bash
# Local release install
npx expo run:ios --configuration Release --device

# Or in Xcode: open ios/PatchFund.xcworkspace → Product → Archive → Distribute to App Store Connect
```

3. In [App Store Connect](https://appstoreconnect.apple.com), create an app for bundle ID `com.zach.patchfund` if you haven't already.
4. Upload the archive, add **internal** or **external** testers in TestFlight, and install via the TestFlight app.

The release build uses the bundled JS and shows the real app icon and splash screen (not the Expo dev launcher).

## Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start Metro |
| `npm run start:lan` | Metro on LAN (good for same Wi‑Fi) |
| `npm run start:tunnel` | Metro via tunnel (good when LAN fails) |
| `npm run ios` | Build/run iOS |
| `npm run prebuild` | Regenerate `ios/` and `android/` |
| `npm run prebuild:clean` | Clean prebuild |

## App identity

Defined in `src/config/appIdentity.js`:

| Key | Value |
|-----|--------|
| App name | Patch Fund |
| URL scheme | `patchfund://` |
| Bundle ID | `com.zach.patchfund` |

## Data model

**Local-only mode** stores everything in **AsyncStorage** on the device.

**Household sync** stores data in Supabase (children, entries, week summaries, profiles, households). The app caches the selected child id locally; cloud data is the source of truth when signed in.

- **Children** — id, name, `weeklyStartingAmount`, `weekStartedAt` (start of current week).
- **Ledger entries** — id, childId, `amountDelta`, reason, source (`manual`, or legacy `siri` / `ai`), `createdAt`, `createdBy` (cloud only).
- **Profiles** — display name per parent (cloud only).
- **Week summaries** — created when a week is closed; stores date range, starting allowance, and ending balance.

Removing a child deletes their entries and week summaries.

## Weekly allowance logic

- Each child starts a week with their **weekly allowance** (e.g. $10).
- Entries add or subtract from that balance: `balance = weeklyStartingAmount + sum(amountDelta)`.
- **Start new week** snapshots the current week, then sets `weekStartedAt` to now so Home only shows entries from the new week.

## Project structure

```
src/
  screens/          # Home, Adjustment, History, Household, auth, etc.
  components/       # BalanceCard, ChildSelector, EntryFormFields, EntrySuggestionRow, LedgerEntryList, …
  services/         # allowance, storage, household, auth, googleSignIn
  utils/            # entryForm, entrySuggestions, weekUtils, formatMoney
  context/          # AuthProvider (session, household, profile)
  navigation/       # Tab + stack navigators, deep linking
  models/           # Child, LedgerEntry, WeekSummary, Profile
  theme.ts          # Colors, spacing, typography
plugins/
  withGoogleSignInPods.js  # CocoaPods fix for Google Sign-In
supabase/
  migrations/       # SQL schema + RLS
  SETUP.md          # Dashboard setup steps
app.config.ts       # Expo config (reads .env)
assets/             # App icon, splash, adaptive icons
```

## Navigation

Bottom tabs:

| Tab | Icon | Screens |
|-----|------|---------|
| **Home** | wallet | Balance, log entry, current week |
| **History** | calendar | Past weeks, week detail |
| **Household** | people | Your name, invite code, manage children |

Auth flow (when Supabase is configured): Sign in (Apple, Google, or Facebook) → Your name → Create/join household → main app.

## Design notes

- **Accent**: hot pink (`#DB2777`) for primary actions and selected child chips.
- **Balance hero**: green/red tint based on positive/negative balance (not the accent color).
- **Start new week**: calendar action under this week's entries (not a muted button next to Log).
- **App icon**: pink patch with stitched border and dollar coin.

## Known limitations

- **iOS-first** — Android package exists but is not the focus.
- **Editing or deleting entries from a closed week** updates the entry list but not the saved week summary ending balance (that was snapshotted at close).
- **Week history before summaries** — inferred by calendar week; less precise than weeks closed via **Start new week**.
- **Apple name on sign-in** — Apple only sends your full name on the very first authorization; the app prompts you to confirm or enter your name.
- **Facebook sign-in** — browser OAuth briefly routes through Supabase before returning to `patchfund://auth/callback`.

## License

Private project.
