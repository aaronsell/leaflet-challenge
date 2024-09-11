// Create tile layers
var defaultMap = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

// Gray-scale layer
var grayScale = L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}{r}.{ext}', {
	minZoom: 0,
	maxZoom: 20,
	attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	ext: 'png'
});

// Water color layer
var waterColor = L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.{ext}', {
	minZoom: 1,
	maxZoom: 16,
	attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	ext: 'jpg'
});

// Topography map layer
let topoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
	maxZoom: 17,
	attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});

// Make base map
let baseMaps = {
    GrayScale: grayScale,
    "Water Color": waterColor,
    TopoMap: topoMap,
    Default: defaultMap,
};

// Make map object
var myMap = L.map("map", {
    center: [36.7783, -119.4179],
    zoom: 4,
    layers: [defaultMap, grayScale, waterColor, topoMap]
});

// Add a default map
defaultMap.addTo(myMap);

// Get tectonic plate data and draw on it on the map
let tectonicPlates = new L.layerGroup();

// Call API for the data
d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json")
.then(function(plateData){
    console.log(plateData)

    // Load using GeoJSON
    L.geoJson(plateData, {
        color: "yellow",
        weight: 1
    }).addTo(tectonicPlates);
});

// Add tectonic plates to the map
tectonicPlates.addTo(myMap);

// Create info for earthquake overlay
let earthquakes = new L.layerGroup();

// Get info and populate
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson")
.then(
    function(earthquakeData){
        // Plot circles for magnitude

        // Make function that chooses color
        function dataColor(depth){
            if (depth > 90)
                return "red";
            else if (depth > 70)
                return "#cc5500";
            else if (depth > 50)
                return "#ed872d";
            else if (depth > 30)
                return "#fc8403";
            else if (depth > 10)
                return "#cafc03";
            else   
                return "green"
        }

        // Function for the radius
        function radiusSize(mag){
            if (mag == 0)
                return 1;
            else
                return mag * 5;
        }

        // Add style for datapoints
        function dataStyle(feature)
        {
            return {
                opacity: 0.5,
                fillOpacity: 0.5,
                fillColor: dataColor(feature.geometry.coordinates[2]),
                color: "000000",
                radius: radiusSize(feature.properties.mag),
                weight: 0.5,
                stroke: true
            }
        }

        // Add GeoJSON Data
        L.geoJson(earthquakeData, {
            // Make markers
            pointToLayer: function(feature, latLng) {
                return L.circleMarker(latLng);
            },
            // Set style for marker
            style: dataStyle,

            // Add popups
            onEachFeature: function(feature, layer){
            layer.bindPopup(`Magnitude: <b>${feature.properties.mag}</b><br> 
                     Depth: <b>${feature.geometry.coordinates[2]}</b><br> 
                     Location: <b>${feature.properties.place}</b><br>`);
}

        }).addTo(earthquakes);
    }

    
)

// Add earthquake layer
earthquakes.addTo(myMap);

// Add the overlay to the tectonic plates
let overlays = {
    "Tectonic Plates": tectonicPlates,
    "Earthquake Data": earthquakes
}

// Add a control layer
L.control
    .layers(baseMaps, overlays)
    .addTo(myMap);

// Add a legend
let legend = L.control({
    position: "bottomright"
});

// 
legend.onAdd = function() {
    // Create div for the legend
    let div = L.DomUtil.create("div", "info legend");

    // Intervals
    let intervals = [-10, 10, 30, 50, 70, 90];
    // Set colors
    let colors = [
        "#00ff00",  // Green
        "#cafc03",  // Yellow-green
        "#fc8403",  // Orange
        "#ed872d",  // Dark orange
        "#cc5500",  // Burnt orange
        "#ff0000"   // Red
    ];

    // Loop through colors and intervals
    for (var i = 0; i < intervals.length; i++) {
        // Inner html
        div.innerHTML += 
            `<i style="background:${colors[i]}; width: 18px; height: 18px; display: inline-block;"></i> ` 
            + intervals[i] 
            + (intervals[i + 1] ? `km &ndash; ${intervals[i + 1]}km<br>` : "+ km");
    }
    return div;
};

legend.addTo(myMap);