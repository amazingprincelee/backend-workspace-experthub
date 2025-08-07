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


const getNearByWorkspaceByAddress = async (req, res) => {
  try {
    const userAddress = req.params.address;
    const maxDistance = req.query.maxDistance || 5000; // Default 5km
    const limit = req.query.limit || 8; // Default 8 results

    // Validate address
    if (!userAddress || typeof userAddress !== 'string' || userAddress.trim() === '') {
      return res.status(400).json({ message: "Valid address string is required" });
    }

    // Validate query parameters
    const maxDistanceNum = parseInt(maxDistance);
    const limitNum = parseInt(limit);
    if (maxDistanceNum < 1000 || maxDistanceNum > 50000) {
      return res.status(400).json({ message: "maxDistance must be between 1km and 50km" });
    }
    if (limitNum < 1 || limitNum > 20) {
      return res.status(400).json({ message: "limit must be between 1 and 20" });
    }

    // Check if Google Maps API key is available
    if (!GOOGLE_MAPS_API_KEY) {
      return res.status(500).json({ error: "Google Maps API key is missing" });
    }

    // Geocode the provided address
    const geocodeResponse = await axios.get("https://maps.googleapis.com/maps/api/geocode/json", {
      params: {
        address: userAddress,
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    console.log("geocode response status:", geocodeResponse.data.status);
    console.log("geocode results count:", geocodeResponse.data.results?.length || 0);

    // Check if geocoding was successful
    if (geocodeResponse.data.status !== "OK" || !geocodeResponse.data.results.length) {
      return res.status(400).json({ 
        message: "Address not found or geocoding failed",
        status: geocodeResponse.data.status 
      });
    }

    // Extract coordinates from geocoding response
    const { lat, lng } = geocodeResponse.data.results[0].geometry.location;
    const userCoordinates = [lng, lat]; // [longitude, latitude] for MongoDB

    console.log("User coordinates:", userCoordinates);
    console.log("Searching within radius (meters):", maxDistanceNum);

    // First, let's check if there are any locations in the database
    const totalLocations = await Location.countDocuments();
    console.log("Total locations in database:", totalLocations);

    // Find nearby locations first
    const nearbyLocationIds = await Location.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: userCoordinates
          },
          $maxDistance: maxDistanceNum // Distance in meters
        }
      }
    })
    .select('_id location selectedLocation')
    .limit(limitNum * 3) // Get more locations to ensure we have enough workspaces
    .lean();

    console.log("Nearby locations found:", nearbyLocationIds.length);
    if (nearbyLocationIds.length > 0) {
      console.log("Sample nearby location:", {
        id: nearbyLocationIds[0]._id,
        coordinates: nearbyLocationIds[0].location.coordinates,
        address: nearbyLocationIds[0].selectedLocation?.fullAddress
      });
    }

    // Extract location IDs
    const locationIds = nearbyLocationIds.map(loc => loc._id);

    // Check total workspaces in database
    const totalWorkspaces = await WorkSpace.countDocuments();
    const approvedWorkspaces = await WorkSpace.countDocuments({ approved: true });
    console.log("Total workspaces in database:", totalWorkspaces);
    console.log("Approved workspaces in database:", approvedWorkspaces);

    // If no nearby locations found, let's try a broader search
    if (locationIds.length === 0) {
      console.log("No nearby locations found, trying broader search...");
      
      // Try finding any workspaces first to see if there are any in the database
      const anyWorkspaces = await WorkSpace.find({ approved: true })
        .populate({
          path: 'location',
          select: 'location selectedLocation'
        })
        .limit(5)
        .lean();
      
      console.log("Sample workspaces in database:", anyWorkspaces.length);
      if (anyWorkspaces.length > 0) {
        console.log("Sample workspace location:", {
          title: anyWorkspaces[0].title,
          coordinates: anyWorkspaces[0].location?.location?.coordinates,
          address: anyWorkspaces[0].location?.selectedLocation?.fullAddress
        });
      }
      
      return res.json({
        message: "No workspaces found within the specified radius",
        userAddress,
        userCoordinates,
        searchRadiusKm: maxDistanceNum / 1000,
        totalLocationsInDb: totalLocations,
        totalWorkspacesInDb: totalWorkspaces,
        approvedWorkspacesInDb: approvedWorkspaces,
        nearbyLocationsFound: 0,
        workspaces: [],
        suggestion: "Try increasing the search radius or check if there are workspaces in your area"
      });
    }

    // Find workspaces that have these locations
    const nearbyWorkspaces = await WorkSpace.find({
      location: { $in: locationIds },
      approved: true // Only return approved workspaces
    })
    .populate({
      path: 'location',
      select: 'location selectedLocation'
    })
    .populate('providerId', 'name email userType')
    .limit(limitNum)
    .lean();

    console.log("Workspaces found with nearby locations:", nearbyWorkspaces.length);

     // If no workspaces found, let's debug what location IDs the workspaces are actually using
     if (nearbyWorkspaces.length === 0) {
       console.log("Debugging: Checking what location IDs workspaces are using...");
       const allWorkspaces = await WorkSpace.find({ approved: true })
         .select('_id title location')
         .limit(10)
         .lean();
       
       console.log("Sample workspace location IDs:");
       allWorkspaces.forEach((workspace, index) => {
         console.log(`Workspace ${index + 1}: ${workspace.title} -> Location ID: ${workspace.location}`);
       });
       
       console.log("Looking for location ID:", locationIds[0]);
       console.log("Available location IDs in workspaces:", allWorkspaces.map(w => w.location.toString()));
     }

    // Calculate distances and format response
    const workspacesWithDistance = nearbyWorkspaces.map(workspace => {
      const distance = calculateDistance(userCoordinates, workspace.location.location.coordinates);
      return {
        _id: workspace._id,
        title: workspace.title,
        providerName: workspace.providerName,
        providerImage: workspace.providerImage,
        thumbnail: workspace.thumbnail,
        category: workspace.category,
        about: workspace.about,
        providerId: workspace.providerId,
        persons: workspace.persons,
        duration: workspace.duration,
        startDate: workspace.startDate,
        endDate: workspace.endDate,
        startTime: workspace.startTime,
        endTime: workspace.endTime,
        fee: workspace.fee,
        strikedFee: workspace.strikedFee,
        room: workspace.room,
        location: {
          fullAddress: workspace.location.selectedLocation.fullAddress,
          state: workspace.location.selectedLocation.state,
          city: workspace.location.selectedLocation.city,
          coordinates: workspace.location.location.coordinates
        },
        distanceKm: Math.round(distance * 100) / 100 // Round to 2 decimal places
      };
    });

    // Sort by distance
    workspacesWithDistance.sort((a, b) => a.distanceKm - b.distanceKm);

    res.json({
      message: "Nearby workspaces found successfully",
      userAddress,
      userCoordinates,
      totalFound: workspacesWithDistance.length,
      maxDistanceKm: maxDistanceNum / 1000,
      workspaces: workspacesWithDistance
    });

  } catch (error) {
    console.error("Get nearby workspaces error:", error.message);
    res.status(500).json({ 
      error: "Failed to find nearby workspaces", 
      details: error.message 
    });
  }
}




module.exports = {
  searchLocation,
  getPlaceDetails,
  createLocation,
  getNearByWorkspaceByAddress,
};