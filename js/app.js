const displayArea = document.getElementById('display-area');
let map, geojsonLayer;
let geojsonData = null;
let allMarkers = [];
let idleTimer;
let isReading = false; // Prevents map from resetting while actively reading an exhibit

// Map Initialization
map = L.map('map', {
    zoomControl: false // We will add it manually to style it
}).setView([21.0, 78.0], 5);

// Add zoom control to top-left
L.control.zoom({ position: 'topleft' }).addTo(map);

// Premium Dark Map Skin
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/dark_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 20
}).addTo(map);

// Load Indian States GeoJSON from the fast, minified local JS variable
function initGeoJSON(data) {
    geojsonData = data;
    
    geojsonLayer = L.geoJSON(data, {
        style: {
            color: '#d4af37',
            weight: 1,
            opacity: 0.1,
            fillColor: '#d4af37',
            fillOpacity: 0.0,
            className: 'state-boundary'
        },
        onEachFeature: function(feature, layer) {
            let rawName = feature.properties.NAME_1 || feature.properties.st_nm || feature.properties.ST_NM || feature.properties.state_name || "Unknown State";
            const featureStateName = rawName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
            
            layer.on('click', function() {
                activateState(featureStateName);
            });
        }
    }).addTo(map);
}

// Fetch geometry organically from the pre-loaded DOM file to bypass local offline blocks
if (typeof localGeoJSON !== 'undefined' && localGeoJSON.features) {
    initGeoJSON(localGeoJSON);
} else {
    console.warn("Could not find local map data! Fallback to Web API...");
    fetch('https://raw.githubusercontent.com/Subhash9325/GeoJson-Data-of-Indian-States/master/Indian_States')
        .then(r => r.json())
        .then(data => initGeoJSON(data))
        .catch(err => console.error("Could not load backup API:", err));
}

// Offset Map Center Utility
function flyToOffset(latlng, zoom, duration = 1.5) {
    const targetPoint = map.project(latlng, zoom);
    
    // Desktop: Sidebar right (450px)
    if (window.innerWidth > 768) {
        targetPoint.x += 225; // Shift center right by 225px
    } else {
        // Mobile: Sidebar bottom (45% height)
        targetPoint.y += (window.innerHeight * 0.45) / 2; // Shift center down
    }
    
    const targetLatLng = map.unproject(targetPoint, zoom);
    map.flyTo(targetLatLng, zoom, { animate: true, duration: duration });
}

// Initialization Function for Markers
function loadMarkers() {
    if (typeof statesData === 'undefined') {
        console.error("Heritage data is missing. Make sure data.js is loaded.");
        return;
    }

    // Iterate through states in statesData
    for (const [stateName, stateInfo] of Object.entries(statesData)) {
        stateInfo.sections.forEach(section => {
            section.items.forEach(place => {
                
                // Construct standard Leaflet HTML Marker
                const icon = L.divIcon({
                    className: 'custom-marker', // Default class is very small
                    iconSize: null // Defined in CSS for responsive scaling logic
                });

                const marker = L.marker(place.coords, { icon: icon }).addTo(map);
                
                // Attach tooltip (only shows on hover)
                marker.bindTooltip(place.title, {
                    permanent: false,
                    direction: 'bottom',
                    className: 'gold-tooltip',
                    offset: [0, 8]
                });

                // Attach state metadata to marker
                marker.stateName = stateName;
                marker.placeId = place.id;
                
                // Click interaction -> zooms a bit more, triggers DOM accordion open
                marker.on('click', function(e) {
                    L.DomEvent.stopPropagation(e); // Prevent bubbling to the state polygon
                    
                    // Reset idle timer
                    resetTimer();
                    
                    // Zoom lightly
                    flyToOffset(place.coords, 10, 1.0);
                    
                    // Open the corresponding accordion section
                    const detailsEl = document.getElementById(`details-${place.id}`);
                    if (detailsEl) {
                        detailsEl.open = true;
                        detailsEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                });

                allMarkers.push(marker);
            });
        });
    }
}

// Function triggered when State is activated
function activateState(stateName) {
    resetTimer();

    // 1. Highlight GeoJSON Boundary
    if (geojsonLayer) {
        geojsonLayer.eachLayer(layer => {
            let rawName = layer.feature.properties.NAME_1 || layer.feature.properties.st_nm || layer.feature.properties.ST_NM || layer.feature.properties.state_name || "";
            const featureStateName = rawName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
            
            if (featureStateName.toLowerCase() === stateName.toLowerCase()) {
                layer.setStyle({ fillColor: '#d4af37', fillOpacity: 0.25, weight: 2, opacity: 0.8 });
                layer.bringToBack();
            } else {
                layer.setStyle({ weight: 1, opacity: 0.1, fillColor: '#d4af37', fillOpacity: 0.0 });
            }
        });
    }

    // 2. Fly to State Location
    const data = statesData[stateName] || statesData[Object.keys(statesData).find(key => key.toLowerCase() === stateName.toLowerCase())];
    
    if (data) {
        flyToOffset(data.coords, data.zoom || 6, 1.5);
        
        // 3. Render HTML Accordions
        renderSidebar(stateName, data);
        
        // 4. Reveal markers specific to this state
        toggleMarkers(stateName);
    } else {
        // If state is clicked but no data found, just render placeholder
        renderPlaceholder(stateName);
        toggleMarkers(null); 
    }
}

// Marker Visibility Toggler
function toggleMarkers(activeStateName) {
    allMarkers.forEach(marker => {
        if (activeStateName && marker.stateName.toLowerCase() === activeStateName.toLowerCase()) {
            L.DomUtil.addClass(marker._icon, 'visible-marker');
        } else {
            L.DomUtil.removeClass(marker._icon, 'visible-marker');
        }
    });
}

// Render the Sidebar Accordions
function renderSidebar(stateName, stateData) {
    let sectionsHtml = '';
    
    stateData.sections.forEach(section => {
        let itemsHtml = '';
        section.items.forEach(item => {
            const tags = item.category.split('/').map(cat => `<span class="category-tag">${cat.trim()}</span>`).join('');
            const linkHtml = item.articleLink ? `<a href="${item.articleLink}" target="_blank" class="article-link">Read Full Article</a>` : '';

            itemsHtml += `
                <details id="details-${item.id}" class="exhibit-item fade-in">
                    <summary>${item.title}</summary>
                    <div class="exhibit-content">
                        <div class="tag-container" style="margin-top: 10px;">
                            <span class="era-tag">${item.era}</span>
                            ${tags}
                        </div>
                        <span class="location"><i class="fas fa-map-marker-alt"></i> ${item.city}</span>
                        <img src="${item.image}" alt="${item.title}">
                        <p>${item.description}</p>
                        ${linkHtml}
                    </div>
                </details>
            `;
        });

        sectionsHtml += `
            <div class="exhibit-section">
                <h3 class="section-title">${section.sectionTitle}</h3>
                ${itemsHtml}
            </div>
        `;
    });

    displayArea.innerHTML = `
        <div class="state-header fade-in">
            <h1>${stateName}</h1>
            <p class="state-intro">${stateData.introduction}</p>
        </div>
        <div class="accordion-container">
            ${sectionsHtml}
        </div>
    `;

    // Bind reverse-events: Sidebar Accordion -> Map Marker
    stateData.sections.forEach(section => {
        section.items.forEach(item => {
            const detailsEl = document.getElementById(`details-${item.id}`);
            if (detailsEl) {
                detailsEl.addEventListener('toggle', (e) => {
                    const marker = allMarkers.find(m => m.placeId === item.id);
                    if (detailsEl.open) {
                        // Automatically collapse all other currently open sections
                        document.querySelectorAll('details.exhibit-item').forEach(d => {
                            if (d !== detailsEl && d.open) {
                                d.open = false; // Triggers its own closure logic safely
                            }
                        });

                        isReading = true; // Pause AFK resets
                        resetTimer();
                        flyToOffset(item.coords, 10, 1.0); // Pan to pointer
                        if (marker) {
                            marker.openTooltip(); // Show the golden name tooltip
                            L.DomUtil.addClass(marker._icon, 'active-highlight');
                        }
                    } else {
                        // Check if any other accordions are still open
                        const anyOpen = Array.from(document.querySelectorAll('details.exhibit-item')).some(d => d.open);
                        isReading = anyOpen; // Resume AFK resets if nothing is open
                        
                        if (marker) {
                            marker.closeTooltip();
                            L.DomUtil.removeClass(marker._icon, 'active-highlight');
                        }
                        resetTimer(); // Restart the timer
                    }
                });
            }
        });
    });
}

// Render fallback placeholder
function renderPlaceholder(stateName) {
    displayArea.innerHTML = `
        <div class="museum-placeholder fade-in">
            <i class="fas fa-map-marked-alt fa-3x" style="color: #64748b; margin-bottom: 15px;"></i>
            <h2>${stateName}</h2>
            <p>Data for this state is currently being excavated. Try exploring <strong>Kerala</strong>!</p>
        </div>
    `;
}

// Maps Idle Reset Logic
function resetTimer() {
    clearTimeout(idleTimer);
    
    // Only start the 7-second idle reset if the user isn't actively reading a site.
    if (!isReading) {
        idleTimer = setTimeout(() => {
            // Reset to initial India view properly centered
            flyToOffset([21.0, 78.0], 5, 1.5);
            
            // Remove geojson highlights
            if (geojsonLayer) {
                geojsonLayer.eachLayer(layer => {
                    layer.setStyle({ weight: 1, opacity: 0.1, fillColor: '#d4af37', fillOpacity: 0.0 });
                });
            }
            
            // Hide all markers
            toggleMarkers(null);
            
            // Reset sidebar
            displayArea.innerHTML = `
                <div class="museum-placeholder fade-in">
                    <i class="fas fa-map-marked-alt fa-3x" style="color: #d4af37; margin-bottom: 15px;"></i>
                    <h2>Explore the Heritage</h2>
                    <p>Click on a State to unveil the hidden history, vibrant culture, and ancient civilizations across India.</p>
                </div>
            `;
        }, 7000); // 7 seconds timeout
    }
}

// Bind Map Movements to Reset Timer
map.on('mousemove', resetTimer);
map.on('dragstart', resetTimer);
map.on('zoomstart', resetTimer);

// Initialize system
loadMarkers();
resetTimer();
