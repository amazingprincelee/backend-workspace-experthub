const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: true,
    unique: true, 
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0],
    },
  },
  selectedLocation: {
    fullAddress: { type: String, default: '' }, // e.g., "Wale Estate, Kporo road, Rumuodara"
    state: { type: String, default: '' },
    city: { type: String, default: '' },
  },
});

// Create a 2dsphere index for geospatial queries
locationSchema.index({ location: '2dsphere' });

const Location = mongoose.model('Location', locationSchema);
module.exports = Location;