# India Cultural Museum Map 🇮🇳

A stunning, interactive, and high-performance vanilla web application that showcases the deep, unseen cultural heritage of India. Built to provide a premium "museum-like" digital experience through modern web design (Dark Mode & Glassmorphism) and interactive mapping.

## Features

- 🗺️ **Interactive Leaflet Map**: Uses a premium, dark-mode CartoDB map skin ensuring cultural markers pop clearly without visual clutter.
- 🏛️ **Heritage Exhibits**: Hovering over golden markers reveals an elegantly designed, glassmorphic sidebar showcasing rich history, images, and context.
- ✨ **Dynamic State Highlighting**: The application instantly boundaries and highlights individual Indian States dynamically when you explore monuments within that state (Powered by GeoJSON data).
- ⚡ **Zero-Build Vanilla Architecture**: Built purely with HTML, CSS, and JS. No massive Node dependencies, no Webpack bundles—just lightning-fast loading entirely offline or on static site hosts.

## Live Demo

If you'd like to explore the interactive map right now, **[click here to visit the hosted site](https://ayushman-pyne.github.io/Tourism-Project/)**! 

## Project Structure

```text
Tourism-Project/
├── index.html            # Main Entry Point with full Semantic HTML
├── css/
│   └── style.css         # Animations, Layouts, and Premium User Interface
├── js/
│   ├── app.js            # Core Leaflet Initialization and Event Handlers
│   └── data.js           # Structured Heritage Dataset (replaces JSON for CORS)
├── datasets/
│   └── heritage_data.json# Raw JSON replica of the Data for API potential
└── archive/
    └── version_1.html    # Original prototype architecture
```


## Current Dataset Focus: Kerala

The initial dataset was constructed based on deep-dive ethnographic and academic findings from **Kerala**. The exhibits currently encompass:

- **The Moosharis of Kunhimangalam**: A 900-year legacy of bell-metal casting.
- **The Cholanaikkans**: India's isolated hunter-gatherer tribe hiding inside the Nilambur forest.
- **Vadakke Madham Manuscripts**: 748 palm-leaf manuscripts preserved in Thrissur.
- **Kan.akkatikaram Treatises**: Medieval vernacular mathematics from Thiruvananthapuram.
- **Mavilan Tulu Language**: A distinct linguistic preservation effort happening in North Kerala.
- **Arabi-Malayalam Script**: A marginalized Malayalam scriptorial variant using Arabic structures.

## Roadmap

- Expansion into the rich Temple architectures of **Tamil Nadu**.
- Integration of the distinct Forts in **Rajasthan**.
- Interactive map-filtering capabilities (e.g., Filtering by Era or Category directly on the canvas).
