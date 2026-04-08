# 🏛️ India Cultural Museum Map
### *A Premium Interactive Exploration of India's Unseen Heritage*

[![Live Demo](https://img.shields.io/badge/Live-Demo-gold?style=for-the-badge&logo=google-chrome&logoColor=white)](https://ayushman-pyne.github.io/Tourism-Project/)

An interactive, high-performance web application designed to showcase the deep cultural, linguistic, and historical dimensions of India. This project transforms raw heritage data into a "Digital Museum" experience, utilizing modern web aesthetics, glassmorphism, and optimized data pipelines.

---

## ✨ Key Features

### 🏛️ Museum-Quality UX
- **Dark Museum Aesthetic**: A curated high-contrast palette using deep charcoals and Royal Gold (`#d4af37`).
- **Premium Typography**: Pairings of *Cinzel* (Headings) and *Cormorant Garamond* (Body) for a classic, sophisticated feel.
- **Custom Interactive Cursor**: A sleek, golden follower cursor that reacts to interactive elements and labels.
- **Glassmorphic Sidebar**: Elegant, translucent overlays that showcase heritage exhibits with smooth animations.

### 🗺️ Intelligent Mapping
- **State-Centric Navigation**: Clicking any of the 36 States/UTs triggers a focus-zoom, highlights boundaries, and reveals specific heritage markers.
- **Smart Labels**: Custom state labels that remain interactive and scale based on zoom level.
- **Fixed-Anchor Zoom**: Zooming via buttons always centers on India's geographic heart, maintaining context during exploration.
- **Reset to Overview**: Quickly return to the full map of India via the `Esc` key or by clicking anywhere on the empty map background.

### 🚀 Performance & Optimization
- **Bundled Asset Pipeline**: Merges over 200+ heritage items from 36 separate datasets into a single, lightning-fast `data.js` bundle (reducing startup Latency).
- **Lazy-Loaded Exhibits**: Images are fetched with `loading="lazy"` and `decoding="async"`, ensuring the initial page load stays under 1MB even with 200+ high-res photos.
- **Minified Map Data**: The primary GeoJSON map is minified to ensure the browser processes complex state boundaries instantly.

---

## 🛠️ Tech Stack

- **Core**: Vanilla JavaScript (ES6+), HTML5, CSS3.
- **Mapping**: [Leaflet.js](https://leafletjs.com/) with [CartoDB Dark](https://carto.com/basemaps/) tile layers.
- **Icons & Fonts**: FontAwesome 6, Google Fonts.
- **Deployment**: Architecture-ready for GitHub Pages or any static CDN.

---

## 📁 Project Structure

```text
Tourism-Project/
├── index.html            # Core application entry point
├── css/
│   └── style.css         # Design system (Animations, Glassmorphism, Cursor)
├── js/
│   ├── app.js            # Main application logic & event systems
│   ├── data.js           # Production-ready bundled heritage dataset (36 states/UTs)
│   └── final_labelled_map.json # Minified GeoJSON Map with state boundaries
├── datasets/             # Source data for future updates
│   └── data/*.json       # Individual state source files (219+ heritage points)
└── images/               # Local asset library (Optimized heritage photos)
```

---

## 🚀 Local Development

1. **Clone the Repo**:
   ```bash
   git clone https://github.com/ayushman-pyne/Tourism-Project.git
   ```
2. **Launch**: Open `index.html` via a local server (e.g., VS Code Live Server).

---

## ⚖️ Credits
Built with ❤️ for Indian Culture by **Arceus © 2026**
*Explore the project at [ayushman-pyne.github.io](https://ayushman-pyne.github.io/portfolio.github.io/)*
