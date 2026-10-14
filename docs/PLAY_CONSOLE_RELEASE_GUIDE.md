# Google Play Release Guide: St. Kizito Parish Eligbolo

Last checked against Google's official pages: **14 October 2026**. Play Console menu names change from time
to time. If a label differs, use the **Dashboard**, which links to every outstanding task.

| Fact | Value | Source |
|---|---|---|
| Package name | `com.dave.js.stkizito` | `apps/mobile/app.json` |
| Account type | Personal, created about Aug 2026 | Owner |
| Testing rule | **12 testers opted in for 14 days in a row** before Apply for production is unlocked | [Google: testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465) |
| Target API | Must target API 36 (Android 16). Expo SDK 55 targets 36 ✅ | [Google: target SDK](https://developer.android.com/google/play/requirements/target-sdk) |
| Account deletion | Not required: parishioners cannot create accounts | [Google: account deletion](https://support.google.com/googleplay/android-developer/answer/13327111) |
| Privacy policy | https://stkizitoparisheligbolo.org/privacy-policy | `apps/web/app/privacy-policy` |
| Support page | https://stkizitoparisheligbolo.org/support | `apps/web/app/support` |
| Latest sideloaded APK | `production-apk`, version code 12, signed by the EAS keystore | `eas build:list` |

---

## The four stages

```
1. Set up the app ──► 2. Closed test (12+ testers × 14 days) ──► 3. Apply for production ──► 4. Production release
   (store listing,       (first release is reviewed by Google;        (questionnaire, review       (another review,
    app content, AAB)     the 14 days start once testers opt in)       usually ≤ 7 days)            then live)
```

**Do you need internal testing?** No, Google does not require it. Closed testing alone counts. It is still
worth using once, by yourself, for one reason: it lets you install the real Play-signed build within minutes,
before the 12 testers depend on it (see Step 0). It does not count toward the 14 days.

---

## Step 0: Decide the signing key BEFORE the first upload (cannot be undone)

Parishioners already have the APK installed (version code 12), signed with the EAS keystore. On your first
upload, Google asks how to sign the app:

- **Option A: let Google create a new key** (the default). This is simplest, but Android will treat the Play
  version as a different app from the APK people already have. Anyone with the old APK, **including testers**,
  must **uninstall it first** and loses their favourites and reminder settings. Updates never cross between
  the two.
- **Option B: give Google your existing EAS key** (recommended, because the APK is already in parishioners'
  hands). Play installs then upgrade the existing APK in place, and nobody has to uninstall.
  1. `cd apps/mobile` → `npx eas-cli credentials -p android` → choose the production build profile →
     **Download credentials** (keystore + passwords). Store them in a password manager, never in git.
  2. On the first upload, under **App integrity → App signing**, choose **Use a different key /
     Export and upload a key from Java keystore**, and follow the PEPK instructions Google shows.

If an AAB has already been uploaded to this Play app, the choice has already been made. Check
**Test and release → App integrity**.

---

## Step 1: Build the Android App Bundle (.aab)

Run every command from `apps/mobile`, never the repo root.

```powershell
cd apps/mobile
npx eas-cli whoami                       # should print dave.js
npx expo-doctor                          # config sanity check; fix any errors it reports
npx eas-cli build -p android --profile production
```

- The `production` profile builds an **.aab** (`android.buildType: app-bundle`) and raises the version code
  automatically, so it will be **13 or higher**, above the parishioners' APK.
- The Supabase variables are read from EAS's **production** environment (`EXPO_PUBLIC_SUPABASE_URL`,
  `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_SHARE_APP`), which is already set. Your local `.env` is not
  uploaded.
- When the build finishes, check that the artifact link ends in **`.aab`**, then download it.
- **Size:** a universal APK, like the ~120 MB one, contains code for every phone processor. From an AAB,
  Google sends each phone only what it needs, so the download is smaller. The real number appears in
  Play Console → **App bundle explorer** after upload. About 33 MB of liturgical text is bundled no matter
  what.
- If the build fails, open the build page on expo.dev and read the first red error.

---

## Step 2: Set up the app (Dashboard → "Set up your app")

### 2.1 Store listing (Grow users → Store presence → Main store listing)
| Field | What to enter |
|---|---|
| App name (≤ 30) | `St Kizito Parish Eligbolo` |
| Short description (≤ 80) | `Daily readings, Divine Office, prayers & parish services for St Kizito Eligbolo` |
| Full description (≤ 4000) | Describe only what works: readings, Divine Office, prayers, calendar, Mass times, announcements, Mass booking and offerings by **bank transfer** (confirmed by the parish office), parish record requests, reminders. Do **not** say "pay in app" or "instant confirmation". |
| App icon | 512 × 512 PNG |
| Feature graphic | 1024 × 500 PNG/JPG |
| Phone screenshots | 2–8, from the real app: Home, Daily Readings, Divine Office, Mass booking, Prayers, Calendar |
| Category | Lifestyle (or Books & Reference) |
| Contact email | davidaniago@gmail.com · Website: https://stkizitoparisheligbolo.org |

### 2.2 App content (Policy and programs → App content)
| Declaration | Answer for this app | Why |
|---|---|---|
| Privacy policy | https://stkizitoparisheligbolo.org/privacy-policy | |
| Ads | **No, my app does not contain ads** | No ad SDKs in `package.json` |
| App access | **All functionality is available without special access** | No parishioner login |
| Content rating | Fill in the IARC questionnaire honestly. Category: Reference/News/Educational or "All other app types". No violence, gambling or similar. User-generated content shared with other users: **No** (submissions only go to the parish office). | Usually rated "Everyone" |
| Target audience | **13–15, 16–17, 18 and over**. Do not tick under-13 groups. | The policy says the app is not directed at children under 13. Ticking under-13 triggers the Families policy. |
| Data safety | See 2.3 | |
| Government app | No | |
| Financial features | **My app doesn't provide any financial features** | Payments happen by bank transfer outside the app |
| Health | No health features | |
| News app | No | |

### 2.3 Data safety answers (from the audit)
- Does the app collect or share user data? **Yes, collects.** Shared with third parties? **No.** Service
  providers acting for you, like Supabase, do not count as "sharing".
- Encrypted in transit? **Yes** (HTTPS). Can users request deletion? **Yes**, by email; URL
  `https://stkizitoparisheligbolo.org/privacy-policy#your-rights`.

| Data type | Collected | Optional? | Purpose |
|---|---|---|---|
| Personal info → Name | Yes | Optional (only when a form is used) | App functionality |
| Personal info → Email address | Yes (sacrament request form) | Optional | App functionality |
| Personal info → Phone number | Yes (sacrament request form) | Optional | App functionality |
| Personal info → Other info | Yes (dates and places of sacraments) | Optional | App functionality |
| Financial info → Other financial info | Yes (offering amount, transfer name and reference) | Optional | App functionality |
| Photos and videos → Photos | Yes (receipt image) | Optional | App functionality |
| Files and docs | Yes (receipt PDF) | Optional | App functionality |
| App activity → Other user-generated content | Yes (Mass intention, donation message) | Optional | App functionality |
| Location, contacts, device IDs, diagnostics, analytics | **No** | | No such SDKs in the app |

Reminders, favourites and settings stay on the phone, so they are not "collected".

---

## Step 3 (optional but recommended): Internal test, just you

**Test and release → Testing → Internal testing** → Testers: add your own Gmail → **Create new release** → upload
the AAB (make the Step 0 signing choice here) → **Save → Review → Start rollout**. Open the opt-in link on
your phone and install from Play.

Check: it installs over the old APK without uninstalling (if you chose Option B), opens offline, readings load,
a test Mass booking with a receipt reaches the admin portal, and reminders fire.

## Step 4: Closed test

1. **Test and release → Testing → Closed testing** → open the default track (or **Create track**).
2. **Testers** tab → **Create email list** → add every tester's **Gmail address, the one signed in to Play
   on their phone**. Add 15 or more for a buffer → **Save**. Set a **feedback URL or email**:
   davidaniago@gmail.com.
3. **Countries/regions** → add **Nigeria** (and any country a tester lives in).
4. **Create new release** → **Add from library** (pick the AAB already uploaded) or upload it → release
   name `1.0.0 (13)` → release notes → **Next → Save → Go to overview → Send changes for review**
   (Publishing overview).
5. Wait for Google's review, from hours to a few days. When approved, the track shows **Available to testers**.
6. Only then copy the **opt-in link** (Testers tab → "How testers join your test") and send it to the
   testers. **The 14 days start for each tester when they opt in**, not when you invite them.

See `docs/CLOSED_TESTING_PLAYBOOK.md` for running the 14 days.

**Updating during the test:** upload a new AAB to the same closed track. Testers who stay opted in keep their
continuity. The rule counts people opted in, not builds.

## Step 5: Apply for production (after 14 full days)

**Dashboard → Apply for production**. There are three sections: *About your closed test*, *About your app*,
and *Production readiness*. Answer from your tracker evidence. Review usually takes ≤ 7 days. If Google says
testing was insufficient, keep the closed test running and apply again later.

## Step 6: Production release

**Test and release → Production → Create new release** → promote the tested AAB → release notes →
**Send for review**. Consider a staged rollout (e.g. 20%) for the first release.

---

## Master checklist

| # | Task | Blocks | Status |
|---|---|---|---|
| 1 | Merge PR (privacy policy + support page) and confirm both URLs load on Vercel | Store listing, Data safety | ⬜ |
| 2 | Turn off Supabase email sign-ups; change admin password | Production (security) | ⬜ |
| 3 | Decide signing key (Option A or B) | First upload | ⬜ |
| 4 | Build production AAB (version code ≥ 13) | Testing | ⬜ |
| 5 | Store listing + graphics | Closed test review | ⬜ |
| 6 | All App content declarations | Closed test review | ⬜ |
| 7 | Internal test install on your phone | Optional | ⬜ |
| 8 | Closed test approved and "Available to testers" | Opt-in link | ⬜ |
| 9 | ≥ 12 testers opted in; record the date each one joined | 14-day clock | ⬜ |
| 10 | 14 consecutive days complete; tracker evidence collected | Apply for production | ⬜ |
| 11 | Production access granted | Production release | ⬜ |
| 12 | Production release reviewed and live | | ⬜ |
