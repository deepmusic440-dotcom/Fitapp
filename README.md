# WeZza Workout App

A free, offline, installable workout app. WeZza builds each workout around how recovered your muscles are and progresses your weights automatically, like Fitbod. It runs proven programs like Boostcamp and StrongLifts, and logs lifting and cardio the way Strong and Hevy do. It also adds the motivation features from Nike Training Club and Apple Fitness.

## Features

### Smart training (Fitbod-style)
- **Recovery-aware generator.** Every set adds fatigue to the muscles it works, and that fatigue decays over time; big muscles recover more slowly. "Smart" mode trains your freshest muscles. You can also choose Full Body, Upper, Lower, Push, Pull or Core, or tap muscles on the body map.
- **Muscle heat map.** A front-and-back body view coloured from fatigued (red) to fresh (green).
- **Progressive overload.**
  - Hit the top of the rep range on every set → the weight goes up next time.
  - Land inside the range → aim for one more rep.
  - Miss the range twice → a 10% deload.
  - Drop sets are ignored when working out the next target.
- **Goal-based programming.** Sets, reps and rest differ for strength, hypertrophy and endurance, and workouts are trimmed to fit your session length.

### AI coach
- **Chat with a coach that knows your training.** It sees your profile, equipment, muscle recovery, recent workouts, main lifts and body stats, and answers questions about technique, plateaus, nutrition and recovery.
- **Plans you can use right away.** Ask for a workout and the reply includes a card you can load straight into Train or save as a routine. Ask for a multi-day plan and you can start it as a program; the app moves through its days like the built-in programs.
- **Weights stay yours.** The coach picks exercises, sets, reps and rest; the app fills in each working weight from your history and keeps progressing it.
- **How it connects:** opened from the Claude app, it uses your Claude account with no setup. Anywhere else, paste an Anthropic API key in the Coach tab (it's stored only on this device, never in backups, and sent only to Anthropic).

### Programs (Boostcamp / JEFIT / StrongLifts-style)
- **Six built-in programs:** StrongLifts 5×5, Full Body Foundations, Push/Pull/Legs, Upper/Lower, Dumbbell Only and Bodyweight Basics.
- **The next day loads automatically.** The Train tab shows "Up next" and moves to the following day each time you finish a session. You can skip a day, or generate a one-off Smart workout and stay on the program.
- **Each program sets its own rep ranges** (for example 5×5 or 3×8–12), and the weights still progress from your history.
- **Equipment swaps.** Exercises you can't do with your equipment are replaced with the closest alternative.

### Logging (Strong / Hevy-style)
- **Routines.** Save any workout or generated plan as a routine. When you reuse it, the weights still progress.
- **Supersets.** Link exercises into a group. Rest only starts after the last exercise of each round.
- **Set types.** Tap the set number to cycle through working, warm-up (W), drop (D) and failure (F).
- **Previous-session column**, with a changed weight carried forward to the remaining sets.
- **Rest timer.** Set it per exercise; it beeps and vibrates at the end.
- **RPE (optional).** After each set, rate how hard it was from 6 to 10. If the top of the rep range felt easy (RPE ≤ 7), the weight goes up by double the usual step; if it was max effort (RPE 10), the weight stays the same.
- **Cardio.** Log running, walking, cycling, rowing, elliptical, stair climber, jump rope and swimming as distance and time (km or mi), with pace and distance PRs.
- **Edit past workouts, or log one you forgot,** including its date, start time, duration and title.
- **Notes** for the whole workout and for each exercise.
- **Reordering.** Move exercises up or down, swap them, or add and remove them mid-workout.
- **Custom exercises** with your own muscles, equipment and flags.
- **How-to cues** for all ~90 built-in exercises.
- **Auto warm-ups** on heavy compound lifts.
- **The screen stays awake** during a workout.

### Progress & motivation
- **Charts** of estimated 1RM over time, weekly volume, and sets per muscle over the last 7 days.
- **Exercise records:** rep maxes (the best weight for 1, 3, 5, 8… reps), an estimated-1RM chart, and best set volume.
- **Body tracking.** Log weight, body fat and tape measurements (waist, chest, arm, thigh, hips, neck), with a trend chart and the change in each measurement. Your latest weight feeds the starting-weight estimates.
- **Weekly goal ring** and weekly streak (Apple Fitness-style).
- **19 achievements**, including streaks, total tonnage, PRs, bodyweight strength milestones, cardio distance and program sessions.
- **Calendar** of workouts in the History tab.
- **PR detection.** After each workout, a summary shows your PRs and newly unlocked badges.
- **Share card.** Exports a 1080×1350 image of a workout for Instagram or Stories.

### Tools
- 1RM calculator with a percentage table.
- Plate calculator, in kg or lb.
- Interval timer for HIIT, Tabata and EMOM.

### Private by design
- No account and no server: your data stays on the device (localStorage).
- You can export and import JSON backups.
- **Import from Strong or Hevy:** export a CSV from either app and import it. Exercise names are matched to WeZza's library; anything unknown becomes a custom exercise. Workouts you've already imported are skipped.
- Export your full history as a CSV that opens in any spreadsheet.
- Works offline through a service worker.
- Data saved by the earlier "Forge" build is migrated automatically.

## Run

The app is static files with no build step:

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

To install it on a phone, deploy to any static host (GitHub Pages, Netlify, …), open it in the phone's browser and choose **Add to Home Screen**.

## Structure

| File | Purpose |
| --- | --- |
| `js/data.js` | Muscles, equipment, exercise library |
| `js/programs.js` | Built-in training programs |
| `js/csv.js` | CSV export, Strong / Hevy import |
| `js/coach.js` | AI coach: prompt context, Claude calls, reply parsing |
| `js/cues.js` | Form cues per exercise |
| `js/engine.js` | Recovery model, generator, progression, stats, achievements |
| `js/body.js` | SVG heat map |
| `js/app.js` | UI, state, interactions |
| `sw.js`, `manifest.webmanifest` | PWA / offline |
