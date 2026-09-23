# Patch Fund

A parent-facing allowance tracker for iOS. Log weekly allowance for each child, see the current balance at a glance, review past weeks, and log entries manually or via Siri. Sync a household between parents with Supabase.

Built with **Expo SDK 56**, **React Native**, and a custom native module for Siri App Intents and App Group storage.

## What it does

### Home

- Shows the **current week's allowance** as the hero element (large balance, green when positive / red when negative).
- **Log an entry** — add or take money with an amount and a short note ("What for?").
- **Quick log** — after you've logged a few times, the three most common amount + note combos for the selected child appear as one-tap buttons below **Log an entry** (saves immediately).
- **Start new week** — closes the current week (saves a summary to history) and resets the child to their weekly starting allowance. Past entries are kept.
- Lists **this week's entries** (reason, date, amount, and who logged it when using household sync).
- **Tap an entry** to edit the amount or note.
- **Swipe left** on an entry to delete it (with confirmation).
- In **landscape**, balance and actions stay on the left; entries scroll on the right.

Child switching appears on Home only when you have more than one kid.

### Log an entry

Used when you tap **Log an entry** on Home or when you **tap an existing entry** to edit it.

- **Add** / **Take** toggle defaults to whichever you used last (create only; edit keeps the entry's direction).
- **Suggestions** — the same top-three common entries appear as chips at the top when creating; tap one to prefill amount and note (you can edit before saving).

### Household (tab)

Organized in sections: **You**, **Sharing** (when signed in), **Voice**, and **Kids**.

- Set or edit **your name** — shown on entries you log so the other parent knows who added them.
- **Invite code** and **Share invite code** when signed in (for the other parent to join).
- **Log with Siri** — reopen the full Siri setup guide anytime (first launch shows a shorter version).
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

### Siri shortcuts

Requires a **development or release build** (not Expo Go).

**How to use**

1. Say **"Patch Fund"** (or **"Update Patch Fund"**) to Siri.
2. Siri asks **what to log** — say a full natural-language entry, for example:
   - "add five dollars for mowing the lawn"
   - "take two dollars from Harper for talking back"
3. The app opens, parses your phrase, and saves or shows a **From Siri** confirmation screen where you can adjust add/take, amount, and note before saving.

**Parsing**

The full spoken phrase is sent to the parser (OpenAI when `EXPO_PUBLIC_OPENAI_API_KEY` is set, otherwise local rules). It extracts:

- **Amount** — signed (`+` earned, `-` deducted)
- **Child** — if you named one
- **Reason** — e.g. chore or behavior note
- **Confidence** — whether to ask before saving

**Child resolution** (when you don't name a kid in the phrase):

1. Child named in the phrase (matched against your household)
2. Child currently selected on Home
3. Only child in the household
4. Otherwise → **From Siri** confirmation screen to review before saving

The app also syncs children and the selected child to the App Group so Siri and the parser know who is in the household.

**First-time setup on device**

After installing, open Patch Fund at least once so iOS can register shortcuts. The app shows a short **Log with Siri** guide on first launch (enable Siri, then try the phrase). Reopen the full troubleshooting guide from **Household → Log with Siri**.

In iOS Settings, go to **Apple Intelligence & Siri → Apps → Patch Fund** and turn on **Learn from this App** and the **Suggestions** toggles.

Try **"Hey Siri, Patch Fund"** or search **"Log Entry"** in the Shortcuts app. Apple does not expose whether per-app shortcuts are enabled, so the in-app guide focuses on Siri permission and these settings.

Shortcut phrases and the Siri prompt text live in `modules/allowance-intents/plugin/swift/` (`AllowanceShortcuts.swift`, `LogAllowanceIntent.swift`). Run `npm run prebuild` after editing them.

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
| **Dev or release build** | Uses `expo-dev-client`, native Siri module, Sign in with Apple, native Google Sign-In — **Expo Go will not work**. |
| **Physical iPhone** | Siri App Intents and App Groups need a real device (simulator has limitations). |
| **Apple Developer account** | App Groups, Siri, device installs, and TestFlight. |
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
| `EXPO_PUBLIC_OPENAI_API_KEY` | Optional | Improves Siri phrase parsing. Without it, a local rules-based parser is used. |
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

After changing Swift files under `modules/allowance-intents/plugin/swift/`, rebuild the native app. Keep `ios/PatchFund/AppIntents/` in sync if you edit shortcuts there directly. The config plugin prunes removed Swift files from the Xcode project on prebuild.

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
| App Group | `group.com.zach.patchfund` |
| Siri deep link | `patchfund://siri/log` |

## Data model

**Local-only mode** stores everything in **AsyncStorage** on the device.

**Household sync** stores data in Supabase (children, entries, week summaries, profiles, households). The app caches the selected child id locally; cloud data is the source of truth when signed in.

- **Children** — id, name, `weeklyStartingAmount`, `weekStartedAt` (start of current week).
- **Ledger entries** — id, childId, `amountDelta`, reason, source (`manual` \| `siri` \| `ai`), `createdAt`, `createdBy` (cloud only).
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
  screens/          # Home, Adjustment, History, Household, auth, Siri confirm, etc.
  components/       # BalanceCard, ChildSelector, EntryFormFields, EntrySuggestionRow, LedgerEntryList, …
  services/         # allowance, storage, household, auth, googleSignIn, Siri, AI parser
  utils/            # entryForm, entrySuggestions, weekUtils, formatMoney
  context/          # AuthProvider (session, household, profile)
  navigation/       # Tab + stack navigators, deep linking
  models/           # Child, LedgerEntry, WeekSummary, Profile
  theme.ts          # Colors, spacing, typography
modules/
  allowance-intents/  # Expo native module + config plugin (Siri, App Group)
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

Modal stack above tabs: **From Siri** confirmation when needed.

## Design notes

- **Accent**: hot pink (`#DB2777`) for primary actions and selected child chips.
- **Balance hero**: green/red tint based on positive/negative balance (not the accent color).
- **Start new week**: neutral secondary button (not destructive red).
- **App icon**: pink patch with stitched border and dollar coin.

## Known limitations

- **iOS-first** — Siri and App Groups are iOS-only; Android package exists but is not the focus.
- **Editing or deleting entries from a closed week** updates the entry list but not the saved week summary ending balance (that was snapshotted at close).
- **Week history before summaries** — inferred by calendar week; less precise than weeks closed via **Start new week**.
- **Apple name on sign-in** — Apple only sends your full name on the very first authorization; the app prompts you to confirm or enter your name.
- **Facebook sign-in** — browser OAuth briefly routes through Supabase before returning to `patchfund://auth/callback`.

## License

Private project.
