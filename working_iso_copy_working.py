import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
import ssl

app = Flask(__name__)
CORS(app, origins=["http://127.0.0.1:5500","http://127.0.0.1:5501" ] )  # Allow frontend access

ORS_API_KEY = "5b3ce3597851110001cf6248c40c04baa7aa48fc9174dc2683eaa0c3"  # Replace with your actual ORS API key
ORS_ISOCHRONES_ENDPOINT = "https://api.openrouteservice.org/v2/isochrones/driving-car"

@app.route("/route", methods=["GET"])
def get_isochrone():
    mode = request.args.get("mode")
    start = request.args.get("start")
    range_time = request.args.get("range", "600")  # Default: 10 minutes (600s)

    if mode == "isochrone":
        if not start:
            return jsonify({"error": "Missing start parameter"}), 400

        try:
            lat, lng = map(float, start.split(","))
        except ValueError:
            return jsonify({"error": "Invalid coordinate format"}), 400

        headers = {
            "Accept": "application/geo+json",  # ORS automatically returns GeoJSON
            "Content-Type": "application/json",
            "Authorization": ORS_API_KEY
        }

        payload = {
            "locations": [[lng, lat]],  # ORS expects [longitude, latitude]
            "range": [int(range_time)],  # Time range in seconds
            "range_type": "time",
            "units": "m"
        }

        print("Sending request to ORS:", payload)  # Debugging

        response = requests.post(ORS_ISOCHRONES_ENDPOINT, json=payload, headers=headers)

        # Debugging: Log ORS response
        print("ORS Response:", response.status_code, response.text)

        if response.status_code == 200:
            return jsonify(response.json())  # Return ORS response to frontend
        else:
            return jsonify({"error": "Failed to fetch isochrone", "details": response.text}), response.status_code
    return jsonify({"error": "Invalid mode"}), 400

if __name__ == "__main__":
   app.run(host="0.0.0.0", port=5000)

