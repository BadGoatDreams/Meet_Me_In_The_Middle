/* Example from Leaflet Quick Start Guide*/

//var map = L.map('map').setView([45, -123], 10);

// Replace with your Mapbox access token
const mapboxAccessToken = 'pk.eyJ1IjoiYmFkZ29hdGRyZWFtcyIsImEiOiJjbTZpdzJlZzQwZDdxMmpvbzMzYm5zZHpwIn0.FS149B5ltQdbRgLL7ctZkQ';

var map = L.map('map').setView([45, -123], 10);

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

        isochroneLayers.push({ layer: layer, data: data }); // Store layer and data

        L.marker([lat, lng]).addTo(map).bindPopup(message).openPopup();
        filterMeetingPlaces();

    } catch (error) {
        console.error("Error fetching isochrone:", error);
    }
}

function filterMeetingPlaces() {
    if (!meetingPlacesLayer) return; // Ensure the layer exists

    meetingPlacesLayer.eachLayer(function (layer) {
        if (layer instanceof L.CircleMarker) {
            const markerId = L.Util.stamp(layer);
            const meetingPoint = turf.point([layer.getLatLng().lng, layer.getLatLng().lat]);
            let insideAllIsochrones = true;

            if (isochroneLayers.length < 2) {
                if(markerLabelLayers[markerId]){
                    markerLabelLayers[markerId].remove();
                    delete markerLabelLayers[markerId];
                }
                return;
            }

            for (const isochrone of isochroneLayers) {
                const isochronePolygon = turf.polygon(isochrone.data.features[0].geometry.coordinates);
                if (!turf.booleanPointInPolygon(meetingPoint, isochronePolygon)) {
                    insideAllIsochrones = false;
                    break;
                }
            }

            if (insideAllIsochrones) {
                if (!markerLabelLayers[markerId]) {
                    markerLabelLayers[markerId] = L.tooltip({ permanent: true, direction: 'top' })
                        .setContent(layer.feature.properties.name || layer.feature.properties.Name || "Label")
                        .setLatLng(layer.getLatLng())
                        .addTo(map);
                } else {
                    markerLabelLayers[markerId].addTo(map);
                }
            } else {
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

getCoordinatesOnClick(map);

async function loadMeetingPlaces() {
    try {
        const response = await fetch('data/meeting_places.geojson');
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