const mongoose = require('mongoose');

const connectionState = {
  connected: false,
  connecting: false,
  error: null,
};

const connect = async () => {
  connectionState.connecting = true;

  mongoose.set("debug", true); // Enable debug mode for detailed logs

  try {
    await mongoose.connect(`mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@theplaint.u7pbgty.mongodb.net/?retryWrites=true&w=majority`, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 60000, // Increased timeout to 60 seconds
      socketTimeoutMS: 90000, // Increased socket timeout to 90 seconds
    });
    console.log('Connected to MongoDB!');
    connectionState.connected = true;
  } catch (error) {
    connectionState.error = error;
    console.error('MongoDB connection error:', error);
  } finally {
    connectionState.connecting = false;
  }
};

const disconnect = async () => {
  try {
    await mongoose.disconnect();
    connectionState.connected = false;
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
  }
};

module.exports = { connectionState, connect, disconnect };
