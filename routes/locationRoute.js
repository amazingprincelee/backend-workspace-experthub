const express = require('express');
const {getPlaceDetails, searchLocation, createLocation, getNearByWorkspaceByAddress} = require('../controllers/locationController.js');

const locationRouter = express.Router();




locationRouter.get('/search-locations', searchLocation);
locationRouter.get('/place-details', getPlaceDetails);
locationRouter.post('/create-location/:userId', createLocation);
locationRouter.get('/nearby-workspace/:address', getNearByWorkspaceByAddress)



module.exports = locationRouter;


