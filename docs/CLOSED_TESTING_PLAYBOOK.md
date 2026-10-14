# Closed Testing Playbook: 12 testers × 14 days

**The rule** ([Google, checked 14 Oct 2026](https://support.google.com/googleplay/android-developer/answer/14151465)):
at least **12 testers opted in continuously for at least 14 days**. Someone who opts out before 14 days does not
count. Someone who opts out and back in must again complete 14 days **in a row**.

**What does not count:** iPhone testers (TestFlight is Apple's, not Google's), people who install the APK file
from WhatsApp or the website, and people who were invited but never tapped the opt-in link.

## Before you message anyone

- [ ] Closed test approved by Google and showing **Available to testers** (`PLAY_CONSOLE_RELEASE_GUIDE.md`, Step 4)
- [ ] You have installed it yourself from the opt-in link and tested the main journeys
- [ ] Signing decision made. If you chose Option A (new Google key), testers with the old APK must uninstall it first.
- [ ] Every Android tester's **Gmail address** is on the closed-test email list
- [ ] Tracker spreadsheet created (below)
- [ ] TestFlight public link ready, if you have iPhone testers (`APP_STORE_RELEASE_GUIDE.md`, Step 5)

**Recruit 15–16 Android testers**, not 12. If someone drops out on day 10, you are still above 12 and the clock
does not restart for everyone else.

## What each tester needs

1. An **Android phone** with the Play Store, signed in with the Gmail address they gave you.
2. To open the **opt-in link** on that phone (or in a browser signed in to the same Gmail), tap **Become a
   tester**, then **Download it on Google Play**.
3. To **stay opted in and keep the app installed for at least 14 days**, and to use it as they normally would.

## Tracker (Google Sheets)

**Testers sheet:** Tester ref (T01…) · Gmail · Phone & Android version · Date invited · **Date opted in** ·
Installed from Play? (Y/N) · Still opted in? (check weekly) · Notes

**Feedback sheet:** Date · Tester ref · App version · Phone/Android · Feature · Steps · Expected · What happened ·
Severity (Blocker / Major / Minor / Idea) · Status (New / Fixing / Fixed in build X / Won't fix)

Only record what testers actually told you. Keep screenshots of the Play Console tester count and the
feedback. You will need them for the production application.

## Plan for the 14 days

| Days | Focus | Ask testers to try |
|---|---|---|
| 1–2 | Install and first look | Open the app, today's readings, Divine Office, turn off data to check offline |
| 3–4 | Daily prayer | Morning/Evening Prayer, prayers, favourites, text size |
| 5–6 | Parish information | Mass times, announcements, events, calendar |
| 7 | Mid-point check | Progress message; confirm everyone is still opted in |
| 8–9 | Reminders | Set a reminder, and see whether it arrives |
| 10–11 | Requests | A **real** Mass booking or sacrament request if they genuinely need one; otherwise just walk through the form without submitting |
| 12–13 | Anything else | Explore, report anything confusing |
| 14 | Wrap-up | Final feedback, and a reminder **not to opt out yet** |

Every day, as the developer: look at the feedback sheet, the Play Console → **Quality → Android vitals**
(crashes), and the admin portal (did test submissions arrive?). Fix blockers first.

**Do not** ask anyone to post fake bookings, write reviews, or say anything they did not experience.

## What to do if…

| Situation | Action |
|---|---|
| Tester opts out | Ask them to rejoin. Their own 14 days restart; check you are still at ≥ 12 others. |
| Cannot install ("item not available") | Wrong Gmail on the phone, not on the list, or the test is not yet approved. Check the list and the account. |
| "App not installed" / conflict | Old APK signed with a different key. They must uninstall the old app (Option A). |
| Stops responding | One gentle message. Silence is fine as long as they stay opted in; keep the buffer. |
| Critical bug | Fix, build a new AAB, upload to the same closed track. Testers stay opted in and the clock continues. |
| Console shows fewer testers than expected | Compare against your Testers sheet; message the missing ones. Do not apply until the count is real. |

## Production application: answer structure

Fill these in from your evidence only:
- **Recruiting testers:** "We invited [N] parishioners and youth members of St Kizito Parish Eligbolo, the
  people who will actually use the app. Recruitment was [easy/difficult] because…"
- **Engagement:** "Testers used [features] over 14 days. We collected feedback through a WhatsApp group and a
  feedback sheet. We received [N] reports."
- **Feedback and changes:** list real issues and what you changed (build numbers).
- **Audience and value:** "Catholic parishioners of St Kizito Parish Eligbolo, Port Harcourt, and the wider
  community: offline daily readings, Divine Office, prayers, and parish services."
- **First-year installs:** choose a realistic range for the parish's size.
- **Readiness:** crash-free days in Android vitals, blockers resolved, the policy published.

---

## Messages (WhatsApp)

### 1. Welcome message for the group

> Good day everyone, and thank you so much for agreeing to help! 🙏
>
> **What this group is for**
> Our St Kizito Parish Eligbolo app is getting ready to go on the Google Play Store and the Apple App Store. Before Google will allow a new app on the Play Store, it must first be tested by at least 12 real people for 14 days in a row. That's you! This group is where I'll share the test link, updates, and where you can tell me about anything that doesn't work.
>
> **How it will go**
> 1. Please send me the **Gmail address you use on your phone's Play Store** (Android). If you use an iPhone, just tell me and I'll send you a separate link.
> 2. Once Google approves the test, I'll post a link here. Open it on your phone, tap **"Become a tester"**, then install the app from the Play Store.
> 3. For the next **14 days**, simply use the app as you normally would: read the day's readings, pray the Divine Office, check Mass times, and so on. I'll post a small suggestion every couple of days.
> 4. If anything looks wrong, confusing, or crashes, tell me here, or send a screenshot privately.
>
> **What I'm asking of you**
> ✅ Keep the app **installed** and **don't leave the test** for at least 14 days. If anyone leaves early, Google can make us start the count again.
> ✅ Open it now and then, and use it honestly. No need to pretend or write reviews.
> ✅ Please don't make fake Mass bookings. If you want to try the form, fill it in but don't press submit, unless it's a real request.
>
> Your details stay private and are only used for this test. Thank you for helping our parish. God bless you! 🕊️

### 2. Test link (when approved)
> The test is ready! 🎉 Open this link on your Android phone, signed in with the Gmail you gave me: [OPT-IN LINK]
> Tap **Become a tester**, then **Download it on Google Play**. Please reply "Done ✅" once installed. If you have the old version of the app, [uninstall it first / it will update automatically].

### 3. Day 3
> Hello all 👋 Thank you to everyone who has installed it. Today, please try **Morning or Evening Prayer** and save a prayer to your favourites. Anything confusing? Tell me here.

### 4. Day 7 (halfway)
> We're halfway there, thank you! 🙌 Please **keep the app installed and stay in the test** for one more week. This week, try setting a prayer **reminder** and tell me if it arrived on time.

### 5. Day 10
> Quick check-in: is the app still working well for you? If you've found anything odd, even small, please share it. It really helps.

### 6. Day 13
> Tomorrow is day 14! Please don't leave the test or uninstall yet. I'll let you know when it's safe to do so. 🙏

### 7. Day 14
> We made it, 14 days! Thank you. Please answer three quick questions: (1) What did you use most? (2) What didn't work or confused you? (3) What would you like added? Please keep the app installed for now while I apply to Google.

### 8. New build
> I've fixed a few things you reported 🛠️ The Play Store will update the app automatically. If it doesn't, open Play Store → St Kizito Parish → Update. You don't need to do anything else, and please stay in the test.

### 9. Urgent problem
> ⚠️ Please don't use [feature] for now. There's a problem I'm fixing. Everything else is fine. I'll post here as soon as it's sorted.

### 10. Thank you
> Thank you all so much. Because of you, the St Kizito Parish Eligbolo app has been [submitted to / approved on] the Play Store! 🎉 Please keep using it and tell others in the parish. God bless you abundantly. 🙏
