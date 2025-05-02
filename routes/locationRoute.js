const express = require('express');
const {getPlaceDetails, searchLocation, createLocation} = require('../controllers/locationController.js');

const locationRouter = express.Router();




locationRouter.get('/search-locations', searchLocation);
locationRouter.get('/place-details', getPlaceDetails);
locationRouter.post('/create-location/:userId', createLocation);



module.exports = locationRouter;


