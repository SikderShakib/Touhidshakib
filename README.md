# Sikder Touhid Shakib — Portfolio

Personal portfolio site (single-file `index.html`), plus my CV.

**Live:** https://sikdershakib.github.io/Touhidshakib/

## What's inside

- Hero, About (bento overview), Skills, Journey timeline, Projects
- **Live Business Websites showcase** — real, publicly hosted client-style builds:
  - চা-বিলাসী | Beta Tea — https://sikdershakib.github.io/beta-tea/
  - RAFI A PETS — https://sikdershakib.github.io/RAFI-PET-STORE/
- Booking scheduler, contact section, printable interactive CV, dark/light theme

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The whole portfolio (HTML + CSS + JS, no build step) |
| `assets/profile.png` | Profile photo (real PNG, 333 KB) |
| `assets/profile.webp` | Same photo, 32 KB — served to modern phones |
| `assets/Touhid_Shakib_CV.pdf` | Downloadable CV |

## Local preview

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Mobile notes

- Photo loads from `profile.webp` (32 KB) on phones via `<picture>`, PNG as fallback.
- Sticky WhatsApp / Hire-me bar on screens under 768px.
- No horizontal scrolling: project grid uses `min(320px, 100%)`, drawer scrolls, URLs wrap.
