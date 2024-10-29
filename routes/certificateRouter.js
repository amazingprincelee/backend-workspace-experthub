const express = require('express');
const certificateController = require('../controllers/certificateController.js');
const certificateRoute = express.Router();

certificateRoute.post('/claim', certificateController.claimCetificate)
certificateRoute.get('/:id', certificateController.getUserCetificate)
certificateRoute.delete('/delete/:id', certificateController.deleteOne)


module.exports = certificateRoute;
