# PixelGlyph — ASCII Art Generator

A lightweight, client-side ASCII art generator. No backend, no build step.

---

## Run Locally

### Option 1 — Just open the file
Double-click `index.html` in your file manager.  
Everything is self-contained; no server needed for most features.

> **Note:** Camera capture requires a local HTTP server (browsers block `getUserMedia` on `file://`).

### Option 2 — Local HTTP server (recommended)

**Using Python:**
```bash
cd /path/to/pixelglyph
python3 -m http.server 3000
# Open http://localhost:3000
```

**Using Node.js (`npx serve`):**
```bash
npx serve .
# Open the URL shown in terminal
```

**Using VS Code:**  
Install the *Live Server* extension → right-click `index.html` → *Open with Live Server*.

---

## Deploy to Vercel

### One-click deploy (no CLI)

1. Push both files (`index.html` + `vercel.json`) to a GitHub repo.
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import that repo.
3. Leave all settings as default → click **Deploy**.
4. Your app is live in ~30 seconds. ✓

### CLI deploy

```bash
npm i -g vercel
cd /path/to/pixelglyph
vercel
# Follow the prompts — framework: Other, output: ./
```

---

## Features

| Feature | Details |
|---|---|
| Image upload | Drag & drop or file picker (JPG, PNG, WEBP) |
| Camera capture | Live camera → instant ASCII |
| Character sets | Complex · Simple · Blocks · Binary · Braille |
| Filters | Brightness, Contrast, Invert |
| Font size | 4–20 px (controls resolution) |
| Output width | 40–300 characters wide |
| Presets | Terminal · Matrix · Hi-Contrast · Neon Purple |
| Background toggle | Dark / Light |
| Export | Copy to clipboard · Download .txt · Download .png |

---

## File structure

```
pixelglyph/
├── index.html    ← entire app (HTML + CSS + JS, ~450 lines)
└── vercel.json   ← Vercel routing config
```

No npm install. No build step. No dependencies to manage.
