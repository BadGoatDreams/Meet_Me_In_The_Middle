/* Example from Leaflet Quick Start Guide*/

var map = L.map('map').setView([51.505, -0.09], 13);

// Add tile layer
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// Function to fetch and draw isochrone
async function fetchIsochrone(lat, lng, range = 300) {
    let url = `http://20.118.209.69:5000/route?mode=isochrone&start=${lat},${lng}&range=${range}`;

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

        // Draw the isochrone on the map
        L.geoJSON(data, {
            style: function () {
                return { color: "blue", weight: 2, opacity: 0.6, fillOpacity: 0.2 };
            }
        }).addTo(map);
    } catch (error) {
        console.error("Error fetching isochrone:", error);
    }
}

// Check if geolocation is supported
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (position) {
        // Get the user's coordinates
        var userLat = position.coords.latitude;
        var userLng = position.coords.longitude;

        // Zoom to the user's location
        map.setView([userLat, userLng], 13);

        // Add a marker at the user's location
        L.marker([userLat, userLng]).addTo(map)
            .bindPopup('You are here!')
            .openPopup();

        // Fetch and draw the isochrone
        fetchIsochrone(userLat, userLng, 300);  // 10-minute isochrone (600 sec)
    }, function () {
        alert("Geolocation failed or permission denied.");
        console.log("Geolocation failed or permission denied.");
    });
} else {
    alert("Geolocation is not supported by this browser.");
}
