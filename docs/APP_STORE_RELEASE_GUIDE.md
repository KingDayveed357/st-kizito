# Apple App Store Release Guide: St. Kizito Parish Eligbolo

Last checked against Apple's App Review Guidelines: **14 October 2026**.

**Good news:** you do **not** need a Mac. EAS builds the iOS app in the cloud and uploads it to Apple for you.
Apple has **no 12-tester / 14-day rule**. TestFlight is optional, but it is the way your iPhone testers can try
the app.

| Fact | Value |
|---|---|
| Bundle ID | `com.dave.js.stkizito` (`apps/mobile/app.json`) |
| iPhone only | `supportsTablet: false`, so no iPad screenshots or iPad review |
| Encryption question | Already answered in the app (`ITSAppUsesNonExemptEncryption: false`) |
| Privacy policy / Support URL | https://stkizitoparisheligbolo.org/privacy-policy · https://stkizitoparisheligbolo.org/support |
| Account deletion (5.1.1(v)) | Not applicable: no account creation in the app |

---

## The order of steps

```
1. Join Apple Developer Program ─► 2. eas build (creates bundle ID + certificates) ─► 3. Create the app in App Store Connect
   ─► 4. eas submit ─► 5. TestFlight (iPhone testers) ─► 6. Fill in the store page ─► 7. Submit for App Review
```

## Step 1: Join the Apple Developer Program (US$99 per year)

1. Make sure your Apple ID (davidaniago@gmail.com, or another) has **two-factor authentication** on.
2. The easiest route is the **Apple Developer app** on an iPhone → Account → **Enroll Now**. Alternatively,
   go to https://developer.apple.com/programs/enroll/ in a browser.
3. Choose **Individual / Sole Proprietor** and enter your legal name exactly as on your ID. The App Store will
   show this name as the seller, matching the privacy policy ("David Aniago").
   - *Organisation* enrollment would show the parish as seller, but needs a D-U-N-S number and legal-entity
     documents. Apple waives the fee for qualifying non-profits. That is slower, but you can switch later.
4. Pay, then wait for the confirmation email (usually 1–2 days).

## Step 2: First iOS build (creates the bundle ID and certificates for you)

```powershell
cd apps/mobile
npx eas-cli build -p ios --profile production
```

- When asked, **log in with your Apple ID**. Let EAS **register the bundle identifier** and **generate the
  distribution certificate and provisioning profile**. Answer "Yes" to each.
- The build takes about 15–30 minutes. A failure here is usually an Apple account or permissions problem, and
  the build page on expo.dev shows the exact message.

## Step 3: Create the app in App Store Connect

https://appstoreconnect.apple.com → **Apps** → **+** → **New App**

| Field | Enter |
|---|---|
| Platforms | iOS |
| Name (≤ 30, must be unique on the store) | `St Kizito Parish Eligbolo` |
| Primary language | English (U.K.) |
| Bundle ID | select `com.dave.js.stkizito` (it exists after Step 2) |
| SKU | `stkizito-ios` (private, any unique text) |
| User access | Full Access |

## Step 4: Upload the build

```powershell
npx eas-cli submit -p ios --latest
```
Pick the app you just created. EAS can create an App Store Connect API key for you, so let it. After about
10–30 minutes the build appears in App Store Connect → **TestFlight**.

## Step 5: TestFlight for iPhone testers

1. **TestFlight → Test Information**: beta description ("Parish app: readings, Divine Office, prayers, Mass
   booking"), feedback email `davidaniago@gmail.com`, marketing URL, privacy policy URL. Sign-in required:
   **No**.
2. **External Testing → +** → group "Parish testers" → add the build → **Submit for Beta App Review** (usually
   about a day).
3. When approved, **Enable Public Link** and share it. Testers install the free **TestFlight** app, then tap the
   link.
4. TestFlight builds expire after **90 days**.

(Internal TestFlight testers must be App Store Connect users on your team, so external testing is the right
choice for parishioners.)

## Step 6: Fill in the App Store page

**App Information:** Category **Lifestyle** (secondary: Reference) · Content Rights: "does not contain
third-party content requiring rights" only if you are sure. The liturgical texts' licensing is an open question
(see `docs/LITURGICAL-DATA-STRATEGY.md`), so answer honestly.

**Age Rating** questionnaire: answer "None" throughout, which should give **4+**.

**Pricing and Availability:** Free · Nigeria (plus any other countries you want).

**App Privacy** (Get Started → "Yes, we collect data"). No tracking, and nothing is used for advertising:

| Apple category | Data type | Linked to identity? | Purpose |
|---|---|---|---|
| Contact Info | Name, Email Address, Phone Number | Yes | App Functionality |
| Financial Info | Other Financial Info (amount, transfer reference) | Yes | App Functionality |
| User Content | Photos or Videos (receipt), Other User Content (intentions, messages) | Yes | App Functionality |
| Other Data | Other Data Types (sacrament dates and places) | Yes | App Functionality |

**Version page (1.0):**
- **Screenshots:** 6.9-inch iPhone (1320 × 2868 or 1290 × 2796), 3–10 images. Take them from the TestFlight
  build.
- Promotional text, description, keywords (≤ 100 characters, e.g. `catholic,mass,readings,divine office,breviary,prayer,parish,rosary,liturgy`).
  Only list features the app has.
- Support URL: https://stkizitoparisheligbolo.org/support · Marketing URL: https://stkizitoparisheligbolo.org
- Copyright: `2026 St. Kizito Parish Eligbolo`
- **App Review Information:** contact name, phone, email. Sign-in required: **No**. **Notes** (important):
  > The app needs no login. Mass bookings and offerings are NOT paid in the app: the app shows the parish's
  > bank details, the parishioner pays by bank transfer through their own bank, and can attach a photo of
  > the receipt so the parish office can match it. No money is processed by the app.

## Step 7: Submit

**Add for Review → Submit**. Review usually takes 1–3 days. If rejected, reply in **Resolution Center**. You can
often fix the problem without a new build.

---

## Apple-specific risks

| Risk | Guideline | Mitigation |
|---|---|---|
| Reviewer reads "offerings / donations" as in-app fundraising | 3.2.2(iv): funds may only be collected outside the app unless you are an approved nonprofit | Money really is collected outside the app (bank transfer). Say so in the Review Notes above. Avoid "Donate now / Pay" wording in screenshots and description. |
| Privacy policy must be linked in the app and in metadata | 5.1.1(i) | Done: Settings → Your Data & Privacy → "Read the full privacy policy" (ships in the next build) |
| Contact information | 1.5 | /support page |
| Never-tested iOS layout | 2.1 (app completeness) | Test every screen on TestFlight before submitting |

## iOS checklist

| # | Task | Status |
|---|---|---|
| 1 | Apple Developer Program enrollment approved | ⬜ |
| 2 | First `eas build -p ios` succeeded | ⬜ |
| 3 | App created in App Store Connect | ⬜ |
| 4 | Build uploaded with `eas submit` | ⬜ |
| 5 | TestFlight external group approved; public link shared | ⬜ |
| 6 | Every screen tested on a real iPhone | ⬜ |
| 7 | App Privacy, age rating, screenshots, review notes complete | ⬜ |
| 8 | Submitted and approved | ⬜ |
