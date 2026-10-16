# WeZza Workout App

A free, offline, installable workout app. WeZza builds each workout around how recovered your muscles are and progresses your weights automatically, like Fitbod. It also logs workouts the way Strong and Hevy do, and adds the motivation features from Nike Training Club and Apple Fitness.

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

### Logging (Strong / Hevy-style)
- **Routines.** Save any workout or generated plan as a routine. When you reuse it, the weights still progress.
- **Supersets.** Link exercises into a group. Rest only starts after the last exercise of each round.
- **Set types.** Tap the set number to cycle through working, warm-up (W), drop (D) and failure (F).
- **Previous-session column**, with a changed weight carried forward to the remaining sets.
- **Rest timer.** Set it per exercise; it beeps and vibrates at the end.
- **Notes** for the whole workout and for each exercise.
- **Reordering.** Move exercises up or down, swap them, or add and remove them mid-workout.
- **Custom exercises** with your own muscles, equipment and flags.
- **How-to cues** for all ~90 built-in exercises.
- **Auto warm-ups** on heavy compound lifts.
- **The screen stays awake** during a workout.

### Progress & motivation
- **Charts** of estimated 1RM over time, weekly volume, and sets per muscle over the last 7 days.
- **Body tracking.** Log weight, body fat and waist and see a trend chart. Your latest weight feeds the starting-weight estimates.
- **Weekly goal ring** and weekly streak (Apple Fitness-style).
- **17 achievements**, including streaks, total tonnage, PRs and bodyweight strength milestones.
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
| `js/cues.js` | Form cues per exercise |
| `js/engine.js` | Recovery model, generator, progression, stats, achievements |
| `js/body.js` | SVG heat map |
| `js/app.js` | UI, state, interactions |
| `sw.js`, `manifest.webmanifest` | PWA / offline |
