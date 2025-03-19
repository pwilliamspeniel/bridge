// Initializing the map
var mymap = L.map('map').setView([44.5, -100.0], 7); // Centered on South Dakota

// Base layers
var osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(mymap);

var hybrid = L.tileLayer('http://{s}.google.com/vt?lyrs=s,h&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0','mt1','mt2','mt3']
});

var satellite = L.tileLayer('http://{s}.google.com/vt?lyrs=s&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0','mt1','mt2','mt3']
});

var terrain = L.tileLayer('http://{s}.google.com/vt?lyrs=p&x={x}&y={y}&z={z}', {
    maxZoom: 20,
    subdomains: ['mt0','mt1','mt2','mt3']
});

var baseLayers = {
    "OpenStreetMap": osm,
    "Google Hybrid": hybrid,
    "Google Satellite": satellite,
    "Google Terrain": terrain,
};

L.control.layers(baseLayers).addTo(mymap);

// Adding scale to map
L.control.scale().addTo(mymap);

document.getElementById("navbar-brand").addEventListener('click', function (event) {
    event.preventDefault();
    mymap.setView([44.5, -100.0], 7); // Reset to South Dakota
});

var markers = []; // Array to store marker references

// Function to reproject NAD 1983 State Plane SD North (EPSG: 102749) to WGS 84 (EPSG: 4326)
function reprojectToWGS84(x, y) {
    var sourceProj = "+proj=lcc +lat_1=44.41666666666666 +lat_2=45.68333333333333 +lat_0=43.83333333333334 +lon_0=-100 +x_0=600000 +y_0=0 +datum=NAD83 +units=us-ft +no_defs";
    var destProj = "+proj=longlat +datum=WGS84 +no_defs";
    var coords = proj4(sourceProj, destProj, [x, y]);
    return { lon: coords[0], lat: coords[1] };
}

// Function to load and plot data from CSV
async function plotData() {
    const response = await fetch('Bridges_Only.csv'); // Ensure the file is accessible
    const text = await response.text();
    const rows = text.split("\n");
    
    if (rows.length < 2) return;

    const headers = rows[0].split(","); // Extract column names
    const dataRows = rows.slice(1); // Remove header row

    dataRows.forEach(row => {
        const cols = row.split(",");
        if (cols.length < headers.length) return;

        const x = parseFloat(cols[0]); // X coordinate in NAD 1983 State Plane
        const y = parseFloat(cols[1]); // Y coordinate in NAD 1983 State Plane

        if (!isNaN(x) && !isNaN(y)) {
            let { lon, lat } = reprojectToWGS84(x, y); // Convert to WGS 84
            
            let popupContent = `<div style='font-family: Arial, sans-serif; padding: 8px;'><h4 style='margin: 0;'>Bridge Details</h4><hr style='margin: 5px 0;'>`;
            
            headers.forEach((header, index) => {
                if (!["X", "Y", "OBJECTID", "BRIDGE_ID"].includes(header)) {
                    popupContent += `<b>${header}:</b> ${cols[index]}<br>`;
                }
            });
            popupContent += `</div>`;

            let circle = L.circleMarker([lat, lon], {
                radius: 3, // 16px diameter
                color: 'brown',
                fillColor: 'brown',
                fillOpacity: 1.0 // Solid fill
            }).addTo(mymap).bindPopup(popupContent);
            
            markers.push({ marker: circle, data: cols }); // Store marker
        }
    });

    // Add legend
    var legend = L.control({ position: 'bottomright' });
    legend.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'info legend');
        div.innerHTML = '<b>Legend</b><br>' +
                        '<svg width="16" height="16"><circle cx="8" cy="8" r="8" fill="brown" /></svg> Bridges';
        return div;
    };
    legend.addTo(mymap);
}

// Load proj4 library for coordinate conversion
var script = document.createElement('script');
script.src = "https://cdnjs.cloudflare.com/ajax/libs/proj4js/2.7.5/proj4.js";
script.onload = function() {
    plotData(); // Call function after proj4 is loaded
};
document.head.appendChild(script);


