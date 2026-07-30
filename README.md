# ⚡ TypeMaster – Modern Typing Practice Web App

TypeMaster is a premium, minimal, high-performance, and feature-rich typing practice web application designed for developers, typists, and students. Built with pure HTML5, CSS3 glassmorphism design tokens, Vanilla ES6+ JavaScript, Web Audio API sound synthesis, and local browser persistence.

---

## ✨ Features

- **Modern Glassmorphism UI**: Beautiful dark mode default (#0F172A), smooth blur backdrops, soft shadows, and dynamic responsive cards.
- **8 Dynamic Themes**: Dark Space, Light Mode, Midnight, Cyber Blue, Hacker Green, Purple Neon, Ocean, Sunset. Instant theme switching using CSS variables.
- **Synthesized Audio Engine**: Zero external audio files! Uses Web Audio API for tactile mechanical keyboard switch sounds (Thock, Click, Soft), error pops, and level finish fanfares.
- **Typing Modes**:
  - **Time Modes**: 15s, 30s, 60s, 120s, 300s, Unlimited.
  - **Word Count**: 10, 25, 50, 100, 250, Custom.
  - **Difficulty Tiers**: Easy, Medium, Hard, Expert.
  - **Language / Topics**: English, Numbers, Symbols, Custom Paragraph.
  - **Programming Languages**: Real working syntax code snippets for **HTML, CSS, JavaScript, Python, Java, C, C++, SQL, JSON**.
- **Interactive Visual Keyboard**: QWERTY layout with real-time keypress feedback, active touch-typing finger color highlights, and next-character target hints.
- **Real-Time HUD**: Live WPM, Raw WPM, Accuracy %, Character breakdown (correct / error), elapsed/remaining time, and progress bar.
- **Test Complete Modal**: WPM, Raw WPM, Accuracy, Consistency score, Grade badge (S+, S, A, B, C, D), Speed Rank (Beginner to Master), interactive Chart.js line graph & pie chart split, and Confetti burst on personal bests.
- **Statistics Dashboard**: Overview cards (Best WPM, Avg WPM, Total Tests, Total Words/Chars, Practice Time, Daily Streak), WPM progression line chart, top missed keys analysis, and searchable history table.
- **Achievements & Gamification**: 9 unlockable badges with celebration toasts.
- **Daily Challenge**: Deterministic date-based daily challenge paragraph with streak tracking.
- **Focus / Zen Mode**: Clean interface hiding everything except text, timer, and caret (Exit with `ESC`).
- **Export & Import**: Export scores as formatted CSV, print official PDF certificates, or export/import JSON LocalStorage backups.
- **Progressive Web App (PWA)**: Installable on Desktop/Mobile and works 100% offline via ServiceWorker asset caching.

---

## 📁 Directory Structure

```
d:/TypeMaster/
├── assets/
│   ├── icons/
│   └── favicon.svg
├── css/
│   ├── main.css
│   ├── components.css
│   └── themes.css
├── js/
│   ├── data-texts.js
│   ├── data-code.js
│   ├── storage.js
│   ├── sound.js
│   ├── engine.js
│   ├── keyboard.js
│   ├── chart-manager.js
│   ├── stats.js
│   ├── achievements.js
│   ├── export-import.js
│   └── app.js
├── index.html
├── manifest.json
├── service-worker.js
└── README.md
```

---

## 🚀 How to Run Locally

1. Open `index.html` directly in any web browser, OR serve with a local web server (e.g. VS Code Live Server or `npx http-server ./`).
2. Practice typing! Use `Tab` to restart any test quickly. Press `ESC` to exit Focus Mode or close dialogs.

---

## 🛠️ Tech Stack

- **HTML5 & CSS3**: Custom properties, Glassmorphism, CSS Grid & Flexbox
- **Vanilla JavaScript**: ES6+ modules & Classes (no heavy frameworks required)
- **Chart.js**: Render live WPM telemetry and dashboard analytics
- **Web Audio API**: Real-time sound synthesis
- **LocalStorage API**: 100% private offline persistence
