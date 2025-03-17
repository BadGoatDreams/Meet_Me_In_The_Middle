# Meeting Place Finder

This web application helps users find optimal meeting places based on travel time isochrones. It uses Leaflet, Turf.js, and either the Mapbox API or the OpenRouteService (ORS) API to visualize and analyze geographic data.

## Features

* **Isochrone Visualization:**
    * Allows users to input travel time in minutes.
    * Fetches and displays isochrone polygons representing areas reachable within the specified time.
    * Uses a custom API to generate isochrones, or OpenRouteService as an alternative.
    * Displays markers at the isochrone origin.
* **Meeting Place Markers:**
    * Loads meeting place data from a GeoJSON file.
    * Displays markers at the centroid of each meeting place polygon.
    * Dynamically displays labels for meeting places that overlap with all displayed isochrones.
* **Map Tile Layer Options:**
    * Supports Mapbox tile layer rendering, providing customizable map styles.
    * Also supports OpenStreetMap tile layers.
* **Geolocation:**
    * Attempts to use the user's geolocation to set the initial map view.
* **Clickable Map:**
    * Allows the user to click on the map to add additional isochrones.

## Technologies Used

* **Leaflet:** JavaScript library for interactive maps.
* **Turf.js:** JavaScript library for geospatial analysis.
* **Mapbox API:** For map tile rendering (optional).
* **OpenRouteService (ORS) API:** For isochrone generation and map tile rendering (optional).
* **HTML/CSS/JavaScript:** For the web interface.
* **GeoJSON:** For storing geographic data.

## Setup Instructions

1.  **Clone the Repository:**

    ```bash
    git clone [repository URL]
    cd [repository directory]
    ```

2.  **Map Tile Layer and Isochrone API Options:**

    * **Mapbox (Default):**
        * Sign up for a Mapbox account at [mapbox.com](https://www.mapbox.com/).
        * Get your Mapbox access token.
        * In `main.js`, replace `'YOUR_MAPBOX_ACCESS_TOKEN'` with your actual token:

        ```javascript
        const mapboxAccessToken = 'YOUR_MAPBOX_ACCESS_TOKEN';
        ```

        * Ensure the custom isochrone API is running and accessible. The API endpoint is defined in the `fetchIsochrone` function.
            * `http://<ip address>/route?mode=isochrone&start=<span class="math-inline">\{lat\},</span>{lng}&range=${range}`
    * **OpenRouteService (ORS):**
        * Sign up for an ORS account at [openrouteservice.org](https://openrouteservice.org/).
        * Get your ORS API key.
        * In `main.js`, configure the ORS API usage. This may involve changing the `fetchIsochrone` function to use the ORS API and changing the tile layer.
            * Example ORS isochrone api call: `https://api.openrouteservice.org/v2/isochrones/{profile}?locations={lng},{lat}&range={range}&api_key={ORS_API_KEY}`
            * Example ORS tile layer: `https://tiles.openrouteservice.org/maps/raster/{variant}/{z}/{x}/{y}.png?api_key={ORS_API_KEY}`.
        * Replace `YOUR_ORS_API_KEY` with your actual ORS API key.

3.  **Meeting Place GeoJSON:**

    * Place your meeting place GeoJSON file in the `data/` directory and name it `meeting_places.geojson`.
    * Ensure the GeoJSON file contains polygons with a `name` property for labeling.

4.  **Open the HTML File:**

    * Open `index.html` in your web browser.

## Usage

1.  **Initial View:**
    * The map will attempt to set the initial view to your current location using geolocation.
    * If geolocation fails, it will default to a predefined view.

2.  **Enter Travel Time:**
    * You will be prompted to enter a travel time in minutes.
    * An isochrone will be displayed based on the entered time.

3.  **Add Additional Isochrones:**
    * You can add isochrones by entering coordinates into the text box and clicking the associated button.
    * You can also click on the map to add isochrones.

4.  **Meeting Place Labels:**
    * Labels for meeting places that overlap with all displayed isochrones will be shown as tooltips.

5.  **Clear Isochrones:**
    * There is no button in the provided code to clear isochrones.
    * To add this feature, add a button to your html file, and add a click event listener that calls the `clearIsochrones` function.

## Dependencies

* **Leaflet:** (CDN)
* **Turf.js:** (CDN)
* **Mapbox API:** (CDN) (optional)
* **OpenRouteService (ORS) API:** (CDN) (optional)

## Notes

* Ensure you have a stable internet connection for map tile loading.
* The accuracy of isochrones depends on the underlying routing data and the chosen API (custom, ORS, etc.).
* If you are running this application locally, you may need to run a local web server.
* Remember to respect the terms of service of the APIs you use (Mapbox, ORS).
