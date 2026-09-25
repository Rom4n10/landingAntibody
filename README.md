# 🧬 Antibody — Pitch & Hackathon Landing Page

This folder contains the complete, high-converting landing page designed to pitch and showcase **Antibody** for the **IBM Bob 2.0 Hackathon** (lablab.ai, September 2026).

---

## 🎨 Visual Identity & Architecture

- **Aesthetic Direction**: **Bio-Lab & High-End Systems Engineering**.
  - Clinical slate & papiro background (`#F2F5F7`), surgical steel borders (`#D3DFE5`), deep graphite ink (`#0F1D24`).
  - Biological accent dyes: **Crystal Violet** (`#7A2E8E`) for neutralized mutants and **Reactive Amber** (`#D97706`) for escaping variants.
  - Authentic typography: `IBM Plex Sans` and `IBM Plex Mono`.
  - Zero generic "galactic AI gradients" — designed to look like a high-precision developer tool meets immunology laboratory.
- **Tech Stack**:
  - Vanilla HTML5 + Custom Modern CSS + Modular Vanilla JS.
  - Zero dependencies, zero build steps, instant first-paint.
  - 100% responsive, dark/light clinical theme switchable (`data-theme`), and bilingual (English default with instant Spanish toggle).

---

## ⚡ Core Showstopper: The Immune Laboratory

The page features an interactive **Immune Response Simulator**:
1. **Specimen Selector**:
   - `Specimen #412`: Naive vs. Aware Datetime in Distributed Tasks (authentic sample run from `examples/sample-run/`).
   - `Specimen #587`: Async DB Connection Pool Leak.
2. **Interactive Petri Dish (Well Plate)**:
   - 6 variant attack wells (`v01` to `v06`).
   - Round-by-round progression showing immunity climb from 17% (Baseline) to 50% (Round 1) to **100% (Round 2 Hardened)**.
   - Click any well to inspect its exact mutation diff, Semgrep defense pattern, and pytest logs.
3. **Twin Hunter Red/Green Evidence**:
   - Interactive candidates (`c01` to `c05`) with deterministic pytest logs (`recorded_by: antibody-cli`).
4. **Autonomous Simulation Player**:
   - Auto-plays the entire 4-phase loop with live score counter animations.

---

## 🚀 How to Run Locally

You can run this landing page with zero installation:

### Option 1: Direct File Opening
Double-click `index.html` in your file explorer, or open it directly in any browser:
```
file:///C:/Users/roman/OneDrive/Escritorio/ibmHackathon/landing/index.html
```

### Option 2: Local HTTP Server (Python)
```bash
cd landing
python -m http.server 3000
# Open http://localhost:3000
```

### Option 3: Local Node / npx
```bash
npx serve landing
```

---

## 🌐 Deployment

This folder is ready to deploy directly with zero build commands:
- **GitHub Pages**: Set GitHub Pages source to `/landing` or push to a `gh-pages` branch.
- **Vercel**: Deploy with root directory set to `landing/`.
- **Netlify / Cloudflare Pages**: Drag and drop the `landing/` folder.
