# Patch Fund

A parent-facing allowance tracker for iOS. Log weekly allowance for each child, see the current balance at a glance, review past weeks, and log entries manually or via Siri.

Built with **Expo SDK 56**, **React Native**, and a custom native module for Siri App Intents and App Group storage.

## What it does

### Home

- Shows the **current week's allowance** as the hero element (large balance, green when positive / red when negative).
- **Log an entry** — add or take money with an amount and a short note ("What for?").
- **Start new week** — closes the current week (saves a summary to history) and resets the child to their weekly starting allowance. Past entries are kept.
- Lists **this week's entries** (reason, date, amount).

Child switching appears on Home only when you have more than one kid.

### Kids (tab)

- List all children with weekly allowance.
- **Tap a child** to edit name and weekly allowance.
- **Remove** deletes the child and all their ledger history (with confirmation).
- **Add a child** opens a blank form.

### History (tab)

- Past weeks for the selected child, newest first.
- Each row shows the date range, starting allowance, and **ending balance**.
- Tap a week to see its entries and ending total.
- Weeks are recorded when you tap **Start new week** on Home.
- Older entries from before week summaries existed are grouped by calendar week as a best-effort fallback.

### Siri shortcuts

Requires a **development build** (not Expo Go). Phrases include:

- "Add a dollar in Patch Fund" / "to Patch Fund" / etc.
- "Take a dollar from Patch Fund" / etc.

Siri writes the spoken phrase to a shared App Group. When the app opens, it parses the phrase (OpenAI when configured, with a local rules fallback), resolves the child, and either:

- Saves immediately if confidence is high, or
- Shows a **From Siri** confirmation screen to review before saving.

Children names are synced to the App Group so Siri can target the right kid when multiple children exist.

## Requirements

| Requirement | Notes |
|-------------|--------|
| **Dev build** | Uses `expo-dev-client` and native `allowance-intents` module — **Expo Go will not work**. |
| **Physical iPhone** | Siri App Intents and App Groups need a real device (or simulator with limitations). |
| **Apple Developer account** | For App Groups, Siri, and device installs. |
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

Never commit `.env`.

### 3. Generate native projects

```bash
npm run prebuild
cd ios && pod install && cd ..
```

### 4. Run on device

```bash
# Terminal 1 — Metro (use LAN or tunnel if the phone can't reach your Mac)
npm run start:lan
# or
npm run start:tunnel

# Terminal 2 — build and install (first time or after native changes)
npm run ios -- --device
```

On first launch you'll see the **Expo Dev Client** launcher. Tap **Patch Fund** to load JS from Metro. Grant **Local Network** if the dev server doesn't appear.

After changing Swift files under `modules/allowance-intents/plugin/swift/`, rebuild the native app. Keep `ios/PatchFund/AppIntents/` in sync if you edit shortcuts there directly.

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

All data is stored locally in **AsyncStorage** on the device.

- **Children** — id, name, `weeklyStartingAmount`, `weekStartedAt` (start of current week).
- **Ledger entries** — id, childId, `amountDelta`, reason, source (`manual` \| `siri` \| `ai`), `createdAt`.
- **Week summaries** — created when a week is closed; stores date range, starting allowance, and ending balance.

Removing a child deletes their entries and week summaries. There is no cloud sync or backup in the app today.

## Weekly allowance logic

- Each child starts a week with their **weekly allowance** (e.g. $10).
- Entries add or subtract from that balance: `balance = weeklyStartingAmount + sum(amountDelta)`.
- **Start new week** snapshots the current week, then sets `weekStartedAt` to now so Home only shows entries from the new week.

## Project structure

```
src/
  screens/          # Home, Adjustment, History, Kids, Siri confirm, etc.
  components/       # BalanceCard, ChildSelector, LedgerEntryList, …
  services/         # allowanceService, storage, Siri, AI parser
  navigation/       # Tab + stack navigators, deep linking
  models/           # Child, LedgerEntry, WeekSummary
  theme.ts          # Colors, spacing, typography
modules/
  allowance-intents/  # Expo native module + config plugin (Siri, App Group)
app.config.ts       # Expo config (reads .env)
```

## Navigation

Bottom tabs:

| Tab | Icon | Screens |
|-----|------|---------|
| **Home** | wallet | Balance, log entry, current week |
| **History** | calendar | Past weeks, week detail |
| **Kids** | people | Manage children, add/edit child |

Modal stack above tabs: **From Siri** confirmation when needed.

## Design notes

- **Accent**: hot pink (`#DB2777`) for primary actions and selected child chips.
- **Balance hero**: green/red tint based on positive/negative balance (not the accent color).
- **Start new week**: neutral secondary button (not destructive red).

## Known limitations

- **iOS-first** — Siri and App Groups are iOS-only; Android package exists but is not the focus.
- **No edit/delete for individual ledger entries** — only add and view.
- **Week history before summaries** — inferred by calendar week; less precise than weeks closed via **Start new week**.
- **Dev client** — production builds are not documented here yet.
- **Seed data** — on first launch with no children, the app may seed demo children (`Daniel`, `Emma`) until you remove them.

## License

Private project.
