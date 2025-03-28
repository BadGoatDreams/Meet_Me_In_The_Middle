/* Example from Leaflet Quick Start Guide*/

//var map = L.map('map').setView([45, -123], 10);

// Replace with your Mapbox access token
const mapboxAccessToken = 'pk.eyJ1IjoiYmFkZ29hdGRyZWFtcyIsImEiOiJjbTZpdzJlZzQwZDdxMmpvbzMzYm5zZHpwIn0.FS149B5ltQdbRgLL7ctZkQ';

var map = L.map('map').setView([45, -123], 10);
var iso_overlap_flag = true;

// Add Mapbox tile layer
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=' + mapboxAccessToken, {
    attribution: '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> <strong><a href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a></strong>',
    tileSize: 512,
    maxZoom: 18,
    zoomOffset: -1,
    id: 'badgoatdreams/cm6zeg28000hk01re55nj1px4', // Corrected style ID
    accessToken: mapboxAccessToken
}).addTo(map);

// Function to fetch and draw isochrone
let isochroneLayers = []; // Array to store isochrone layers and data
let meetingPlacesLayer; // This will be a Leaflet layer group
let markerLabelLayers = {}; // Store label layers

async function fetchIsochrone(lat, lng, range = 300, message = "You are here!") {
    const baseUrl = "https://meetmeinthemiddle.duckdns.org/route"; // Updated base URL
    let url = `${baseUrl}?mode=isochrone&start=${lat},${lng}&range=${range}`;

    function getRandomHexColor() {
        return '#' + Math.floor(Math.random() * 16777215).toString(16);
    }

    try {
        const response = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" }
        });

        if (!response.ok) {
            throw new Error("Failed to fetch isochrone data");
        }

        const data = await response.json();
        console.log("Isochrone Data:", data);

        const layer = L.geoJSON(data, {
            style: function () {
                return { color: getRandomHexColor(), weight: 2, opacity: 0.7, fillOpacity: 0.2 };
            }
        }).addTo(map);

        const marker = L.marker([lat, lng]).addTo(map);

        // Create a custom popup with an "x" button
        const popupContent = document.createElement('div');
        popupContent.innerHTML = `${message} <button onclick="removeMarkerAndIsochrone(${lat}, ${lng}, ${L.Util.stamp(marker)}, ${L.Util.stamp(layer)})">x</button>`;
        marker.bindPopup(popupContent).openPopup();

        isochroneLayers.push({ layer: layer, data: data, marker: marker }); // Store layer, data, and marker

        filterMeetingPlaces();

    } catch (error) {
        console.error("Error fetching isochrone:", error);
    }
}

// Function to remove the marker and the associated isochrone
function removeMarkerAndIsochrone(lat, lng, markerId, layerId) {
    // Find and remove the marker
    const markerIndex = isochroneLayers.findIndex(item => L.Util.stamp(item.marker) === markerId);
    if (markerIndex !== -1) {
        map.removeLayer(isochroneLayers[markerIndex].marker);
    }

    // Find and remove the isochrone layer
    const layerIndex = isochroneLayers.findIndex(item => L.Util.stamp(item.layer) === layerId);
    if (layerIndex !== -1) {
        map.removeLayer(isochroneLayers[layerIndex].layer);
    }

    // Remove the entry from the isochroneLayers array
    isochroneLayers = isochroneLayers.filter((item, index) => index !== markerIndex && index !== layerIndex);

    // Re-filter meeting places
    filterMeetingPlaces();
}

function filterMeetingPlaces() {
    if (!meetingPlacesLayer) return; // Ensure the layer exists

    meetingPlacesLayer.eachLayer(function (layer) {
        if (layer instanceof L.CircleMarker) {
            const markerId = L.Util.stamp(layer);
            const meetingPoint = turf.point([layer.getLatLng().lng, layer.getLatLng().lat]);
            let insideAllIsochrones = true;

            // If there are fewer than 2 isochrones, hide all meeting points and labels
            if (isochroneLayers.length < 2) {
                if (markerLabelLayers[markerId]) {
                    markerLabelLayers[markerId].remove();
                    delete markerLabelLayers[markerId];
                }
                layer.setStyle({ opacity: 0, fillOpacity: 0 }); // Hide the meeting point
                return;
            }

            // Check if the meeting point is inside all isochrones
            for (const isochrone of isochroneLayers) {
                const isochronePolygon = turf.polygon(isochrone.data.features[0].geometry.coordinates);
                if (!turf.booleanPointInPolygon(meetingPoint, isochronePolygon)) {
                    insideAllIsochrones = false;
                    break;
                }
            }

            // If the meeting point is inside all isochrones, show it and its label
            if (insideAllIsochrones) {
                layer.setStyle({ opacity: 1, fillOpacity: 0.8 }); // Show the meeting point
                if (!markerLabelLayers[markerId]) {
                    markerLabelLayers[markerId] = L.tooltip({ permanent: true, direction: 'top' })
                        .setContent(layer.feature.properties.name || layer.feature.properties.Name || "Label")
                        .setLatLng(layer.getLatLng())
                        .addTo(map);
                } else {
                    markerLabelLayers[markerId].addTo(map);
                }
            } else {
                // If the meeting point is not inside all isochrones, hide it and its label
                layer.setStyle({ opacity: 0, fillOpacity: 0 }); // Hide the meeting point
                if (markerLabelLayers[markerId]) {
                    markerLabelLayers[markerId].remove();
                    delete markerLabelLayers[markerId];
                }
            }
        }
    });
}
function clearIsochrones() {
    isochroneLayers.forEach(isochrone => {
        map.removeLayer(isochrone.layer);
    });
    isochroneLayers = [];
    filterMeetingPlaces();
}

// Check if geolocation is supported
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (position) {
        var userLat = position.coords.latitude;
        var userLng = position.coords.longitude;
        map.setView([userLat, userLng], 13);
        promptForTravelTime(userLat, userLng);
    }, function () {
        alert("Geolocation failed or permission denied.");
        console.log("Geolocation failed or permission denied.");
        
    });
} else {
    alert("Geolocation is not supported by this browser.");
}

function draw_user(event) {
    event.preventDefault();
    var friendcoords = document.getElementById('FLoc').value.split(",");
    console.log("Friend coords: " + friendcoords[1]);
    promptForTravelTime(friendcoords[0], friendcoords[1]);
}

let User_dict = {};

function getCoordinatesOnClick(map, iso_flag = true) {
if (iso_flag === true){
    map.on('click', function (e) {
        let userID = Object.keys(User_dict).length + 1;
        let lat = e.latlng.lat;
        let lng = e.latlng.lng;
        User_dict["Friend_" + userID] = [lat, lng];
        console.log(User_dict);
        message1 = "Friend " + userID + " Is here";
        promptForTravelTime(lat, lng, message1);
    }); 
} else{
    //add route code here later 
}

}

getCoordinatesOnClick(map, iso_overlap_flag);

async function loadMeetingPlaces() {
    try {
        const response = await fetch('data/michigan_meeting_places.geojson');
        if (!response.ok) {
            throw new Error('Failed to load meeting places GeoJSON');
        }
        const meetingPlacesData = await response.json();

        meetingPlacesLayer = L.layerGroup().addTo(map);

        L.geoJSON(meetingPlacesData, {
            pointToLayer: function (feature, latlng) {
                const marker = L.circleMarker(latlng, {
                    radius: 5,
                    fillColor: "#ff7800",
                    color: "#000",
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.8
                });
                marker.feature = feature;
                marker.addTo(meetingPlacesLayer);
                return marker;
            },
            onEachFeature: function (feature, layer) {
                if (feature.geometry.type === 'Polygon') {
                    const centroid = turf.centroid(feature.geometry);
                    const latlng = L.latLng(centroid.geometry.coordinates[1], centroid.geometry.coordinates[0]);
                    const marker = L.circleMarker(latlng, {
                        radius: 3,
                        fillColor: "#0288D1",
                        color: "#000",
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 0.8
                    });
                    marker.feature = feature;
                    marker.addTo(meetingPlacesLayer);
                }
            }
        });
        filterMeetingPlaces();

    } catch (error) {
        console.error('Error loading meeting places:', error);
    }
}

loadMeetingPlaces();

function promptForTravelTime(lat, lng, message = "You are here!") {
    const travelTimeMinutes = prompt("Enter travel time in minutes:");

    if (travelTimeMinutes !== null) {
        const travelTimeSeconds = parseInt(travelTimeMinutes) * 60;
        if (!isNaN(travelTimeSeconds)) {
            fetchIsochrone(lat, lng, travelTimeSeconds, message);
        } else {
            alert("Invalid travel time. Please enter a number.");
        }
    }
}


const routeModeButton = document.getElementById('routeModeButton');
let routeModeEnabled = false; // Initialize to isochrone mode

routeModeButton.addEventListener('click', function() {
    routeModeEnabled = toggleMode(map, routeModeEnabled); // Toggle and update

    if (routeModeEnabled) {
        routeModeButton.textContent = "Disable Route Mode";
    } else {
        routeModeButton.textContent = "Enable Route Mode";
    }
});

// Initialize with isochrone mode
toggleClickMode(map, routeModeEnabled);


function toggleClickMode(map, routeModeEnabled) {
    if (routeModeEnabled) {
        // Disable isochrone clicking, enable route clicking
        map.off('click'); // Remove any existing click handlers

        map.on('click', function(e) {
            // Route clicking logic here
            let clickLatLng = e.latlng;
            routeAllPointsToClick(clickLatLng);
        });
    } else {
        // Enable isochrone clicking, disable route clicking
        map.off('click'); // Remove any existing click handlers
        getCoordinatesOnClick(map); // Re-enable isochrone clicking
    }
}

function routeAllPointsToClick(clickLatLng) {
    // Clear previous routes
    map.eachLayer(layer => {
        if (layer instanceof L.Polyline) { // Assuming routes are polylines
            map.removeLayer(layer);
        }
    });

    // Route isochrone markers
    if (isochroneLayers) {
        isochroneLayers.forEach(isochrone => {
            if (isochrone.marker) {
                let start = [isochrone.marker.getLatLng().lat, isochrone.marker.getLatLng().lng];
                let end = [clickLatLng.lat, clickLatLng.lng];
                fetchRoute(start, end);
            }
        });
    }
}
async function fetchRoute(start, end, routeIndex) { // Added routeIndex for color variation
    const flaskRouteUrl = 'https://meetmeinthemiddle.duckdns.org/route'; // Your Flask server's route URL

    try {
        const response = await fetch(flaskRouteUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                mode: 'route',
                coordinates: [
                    [start[1], start[0]],
                    [end[1], end[0]]
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error fetching route:', errorData);
            throw new Error(`Failed to fetch route. Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Route Data:', data);

        // Extract duration
        const durationSeconds = data.features[0].properties.summary.duration;
        const durationMinutes = Math.round(durationSeconds / 60);

        // Color Variation
        const colors = ['red', 'green', 'purple', 'orange', 'brown']; // Add more colors if needed
        const routeColor = colors[routeIndex % colors.length]; // Cycle through colors

        const routeLayer = L.geoJSON(data, {
            style: function () {
                return { color: routeColor, weight: 5, opacity: 0.7 };
            }
        }).addTo(map);

        // Popup with duration
        routeLayer.bindPopup(`Driving time: ${durationMinutes} minutes`);

    } catch (error) {
        console.error('Error fetching route:', error);
    }
}

function routeFriendsToClick(clickLatLng) {
    // Clear previous routes
    map.eachLayer(layer => {
        if (layer instanceof L.Polyline) {
            map.removeLayer(layer);
        }
    });

    // Route friend points (isochrone markers)
    if (isochroneLayers) {
        isochroneLayers.forEach((isochrone, index) => { // Added index
            if (isochrone.marker) {
                let start = [isochrone.marker.getLatLng().lat, isochrone.marker.getLatLng().lng];
                let end = [clickLatLng.lat, clickLatLng.lng];
                fetchRoute(start, end, index); // Passed index
            }
        });
    }
}

function toggleClickMode(map, routeModeEnabled) {
    if (routeModeEnabled) {
        // Disable isochrone clicking, enable route clicking
        map.off('click'); // Remove any existing click handlers

        map.on('click', function(e) {
            // Route clicking logic here
            let clickLatLng = e.latlng;
            routeFriendsToClick(clickLatLng);
        });
    } else {
        // Enable isochrone clicking, disable route clicking
        map.off('click'); // Remove any existing click handlers
        getCoordinatesOnClick(map); // Re-enable isochrone clicking
    }
}

function toggleMode(map, routeModeEnabled) {
    routeModeEnabled = !routeModeEnabled; // Toggle the mode
    toggleClickMode(map, routeModeEnabled);
    return routeModeEnabled; // Return the updated mode
}

// ... (Your other JavaScript code, including getCoordinatesOnClick, etc.) ...

function getCoordinatesOnClick(map) {
    map.on('click', function (e) {
        let userID = Object.keys(User_dict).length + 1;
        let lat = e.latlng.lat;
        let lng = e.latlng.lng;
        User_dict["Friend_" + userID] = [lat, lng];
        console.log(User_dict);
        message1 = "Friend " + userID + " Is here";
        promptForTravelTime(lat, lng, message1);
    });
}

// Example of how to toggle the mode
function toggleMode(map, routeModeEnabled) {
    routeModeEnabled = !routeModeEnabled; // Toggle the mode
    toggleClickMode(map, routeModeEnabled);
    return routeModeEnabled; // Return the updated mode
}
