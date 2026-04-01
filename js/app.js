const displayArea = document.getElementById('display-area');
let map, geojsonLayer;
let geojsonData = null;

// 1. Initialize the Map centered on India
map = L.map('map').setView([21.0, 78.0], 5);

// 2. Premium Dark Map Skin (CartoDB Dark Matter)
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/dark_nolabels/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 20
}).addTo(map);

// Removed the label tile layer so default city names don't crowd the map.


// 3. Fetch the Indian States GeoJSON for State Highlighting
fetch('https://raw.githubusercontent.com/geohacker/india/master/state/india_state.geojson')
    .then(res => {
        if (!res.ok) throw new Error("GeoJSON not found");
        return res.json();
    })
    .then(data => {
        geojsonData = data;
        
        // Define default styling for states (invisible/dimmed)
        geojsonLayer = L.geoJSON(data, {
            style: {
                color: '#d4af37',
                weight: 1,
                opacity: 0.1,
                fillColor: '#d4af37',
                fillOpacity: 0.0,
                className: 'state-boundary'
            }
        }).addTo(map);
    })
    .catch(err => console.warn("Could not load Indian States GeoJSON for highlighting:", err));

// 4. Function to highlight a specific state
function highlightState(stateName) {
    if (!geojsonLayer) return;
    
    geojsonLayer.eachLayer(layer => {
        // Normalizing names for comparison (Kerala vs KERALA, etc.)
        const featureStateName = layer.feature.properties.NAME_1 || layer.feature.properties.st_nm || layer.feature.properties.ST_NM || "";
        
        if (featureStateName.toLowerCase() === stateName.toLowerCase()) {
            layer.setStyle({
                fillColor: '#d4af37',
                fillOpacity: 0.25,
                weight: 2,
                opacity: 0.8
            });
            layer.bringToBack(); // Keep borders behind markers
        } else {
            // Reset others
            layer.setStyle({
                weight: 1,
                opacity: 0.1,
                fillColor: '#d4af37',
                fillOpacity: 0.0
            });
        }
    });
}


// 5. Function to update the sidebar exhibit
function showExhibit(data) {
    // Generate tags dynamically
    const tags = data.category.split('/').map(cat => `<span class="category-tag">${cat.trim()}</span>`).join('');
    
    // Check for article link
    const linkHtml = data.articleLink ? `<a href="${data.articleLink}" target="_blank" class="article-link">Read Full Article</a>` : '';

    displayArea.innerHTML = `
        <div class="exhibit-content">
            <div class="tag-container">
                <span class="era-tag">${data.era}</span>
                ${tags}
            </div>
            <h1>${data.title}</h1>
            <span class="location"><i class="fas fa-map-marker-alt"></i> ${data.city}, ${data.state}</span>
            <img src="${data.image}" alt="${data.title}">
            <p>${data.description}</p>
            ${linkHtml}
        </div>
    `;
    
    // Trigger GeoJSON state highlight
    highlightState(data.state);
}


// 6. Use the global heritageData from js/data.js and Add Markers
function loadMarkers() {
    // If the data is empty or missing, log an error
    if (typeof heritageData === 'undefined') {
        console.error("Heritage data is missing. Make sure data.js is loaded.");
        return;
    }

    heritageData.forEach(place => {
        // Create a custom div icon
        const icon = L.divIcon({
            className: 'custom-marker',
            iconSize: [10, 10]
        });

        // Add Marker
        const marker = L.marker(place.coords, { icon: icon }).addTo(map);

        // Bind a tooltip to show the name on hover
        marker.bindTooltip(place.title, {
            permanent: false,
            direction: 'bottom',
            className: 'gold-tooltip',
            offset: [0, 10]
        });

        // HOVER EFFECT
        marker.on('mouseover', function() {
            showExhibit(place);
            // Bring this marker to the front
            this.setZIndexOffset(1000); 
        });

        // Optional: Click to zoom
        marker.on('click', function() {
            map.flyTo(place.coords, 10, {
                animate: true,
                duration: 1.5
            });
        });
    });
}

// Call the function
loadMarkers();

