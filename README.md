# Forge — smart workout generator

A free, offline, installable workout app inspired by Fitbod. It builds each workout around how recovered your muscles are, and progresses your weights automatically.

## Features

- **Recovery-aware generator.** Every completed set adds fatigue to the muscles it trains (primary 100%, secondary 50%). Fatigue decays exponentially, and big muscles recover more slowly. "Smart" mode trains your freshest muscles. You can also pick Full Body, Upper, Lower, Push, Pull or Core, or tap muscles on the body map.
- **Muscle heat map.** An SVG body (front and back) colored from fatigued (red) to fresh (green).
- **Progressive overload.**
  - Hit the top of the rep range on every set → the weight goes up next time.
  - Land inside the range → aim for one more rep.
  - Miss the range twice in a row → a 10% deload.
  - First-time weights are estimated from bodyweight, experience and sex.
- **Goal-based programming.** Sets, reps and rest times differ for strength, hypertrophy and endurance. Workouts are trimmed to fit your session length.
- **Workout logger.**
  - Each set shows what you lifted last session.
  - A changed weight carries forward to the remaining sets.
  - Warm-up sets are added to heavy compound lifts.
  - The rest timer beeps and vibrates when it ends.
  - The screen stays awake during a workout.
  - There's a plate calculator, and you can swap, add or remove exercises mid-session.
- **Progress.**
  - Charts of estimated 1RM over time and weekly volume.
  - Sets per muscle over the last 7 days.
  - Weekly streak and PR detection, with a summary when you finish a workout.
- **About 90 exercises**, filtered by the equipment you own. Mark favorites to see them more often, or exclude exercises so they're never suggested.
- **Private.** No account and no server; your data stays on the device (localStorage). You can export and import JSON backups. Works offline through a service worker.

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
| `js/engine.js` | Recovery model, generator, progression, stats |
| `js/body.js` | SVG heat map |
| `js/app.js` | UI, state, interactions |
| `sw.js`, `manifest.webmanifest` | PWA / offline |
