const Location = require("../models/location.js");
const User = require("../models/user.js");
const axios = require("axios");
require("dotenv").config();

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;



// Utility function to calculate distance between two coordinates (in kilometers)
const calculateDistance = (coords1, coords2) => {
  const [lon1, lat1] = coords1;
  const [lon2, lat2] = coords2;

  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

// Search for locations using Google Maps Places Autocomplete
const searchLocation = async (req, res) => {
  try {
    const query = req.query.area;
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    if (!GOOGLE_MAPS_API_KEY) {
      return res.status(500).json({ error: "Google Maps API key is missing" });
    }

    const response = await axios.get("https://maps.googleapis.com/maps/api/place/autocomplete/json", {
      params: {
        input: query,
        key: GOOGLE_MAPS_API_KEY,
        components: "country:NG",
        types: "geocode|establishment",
      },
    });

    if (response.data.status !== "OK") {
      return res.status(500).json({ error: `Google Maps API error: ${response.data.status}` });
    }

    const predictions = response.data.predictions.map((prediction) => ({
      description: prediction.description,
      placeId: prediction.place_id,
    }));

    res.json({ predictions });
  } catch (error) {
    console.error("Location search error:", error.message);
    res.status(500).json({ error: "Failed to search locations" });
  }
};

// Controller to get place details (coordinates, state, city)
const getPlaceDetails = async (req, res) => {
  try {
    const placeId = req.query.placeId;
    if (!placeId) {
      return res.status(400).json({ error: "Place ID is required" });
    }

    const response = await axios.get("https://maps.googleapis.com/maps/api/place/details/json", {
      params: {
        place_id: placeId,
        key: GOOGLE_MAPS_API_KEY,
        fields: "geometry,formatted_address,address_components",
      },
    });

    if (response.data.status !== "OK") {
      return res.status(500).json({ error: `Google Maps API error: ${response.data.status}` });
    }

    const { result } = response.data;
    const { lat, lng } = result.geometry.location;
    const coordinates = [lng, lat];

    let state = "";
    let city = "";
    for (const component of result.address_components) {
      if (component.types.includes("administrative_area_level_1")) {
        state = component.long_name;
      }
      if (component.types.includes("locality")) {
        city = component.long_name;
      }
    }

    res.json({
      fullAddress: result.formatted_address,
      state,
      city,
      coordinates,
    });
  } catch (error) {
    console.error("Place details error:", error.message);
    res.status(500).json({ error: "Failed to fetch place details" });
  }
};

// Update or create location for a user (using req.params)
const createLocation = async (req, res) => {
  try {
    const { placeId } = req.body;
    const userId = req.params.userId;

    if (!placeId) {
      return res.status(400).json({ error: "Place ID is required" });
    }

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Fetch place details (user-selected location)
    const placeResponse = await axios.get("https://maps.googleapis.com/maps/api/place/details/json", {
      params: {
        place_id: placeId,
        key: GOOGLE_MAPS_API_KEY,
        fields: "geometry,formatted_address,address_components",
      },
    });

    if (placeResponse.data.status !== "OK") {
      console.error("Google Maps API response:", placeResponse.data);
      return res.status(500).json({ error: `Google Maps API error: ${placeResponse.data.status}`, details: placeResponse.data.error_message || "No additional details" });
    }

    const { result } = placeResponse.data;
    const { lat, lng } = result.geometry.location;
    const selectedCoordinates = [lng, lat];

    let state = "";
    let city = "";
    for (const component of result.address_components) {
      if (component.types.includes("administrative_area_level_1")) {
        state = component.long_name;
      }
      if (component.types.includes("locality")) {
        city = component.long_name;
      }
    }

    const selectedLocation = {
      fullAddress: result.formatted_address,
      state,
      city,
    };

    // Update or create location document for the user
    const updatedLocation = await Location.findOneAndUpdate(
      { userId },
      {
        userId,
        selectedLocation,
        location: {
          type: "Point",
          coordinates: selectedCoordinates,
        },
      },
      { upsert: true, new: true }
    );

    // Update the User document
    await User.findByIdAndUpdate(userId, {
      location: updatedLocation._id,
      state,
      address: result.formatted_address,
    });

    // Return the updated location
    res.json({
      message: "Location updated successfully",
      location: updatedLocation,
    });
  } catch (error) {
    console.error("Update location error:", error.message);
    res.status(500).json({ error: "Failed to update location", details: error.message });
  }
};



module.exports = {
  searchLocation,
  getPlaceDetails,
  createLocation,
};