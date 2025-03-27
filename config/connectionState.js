const mongoose = require('mongoose');

const connectionState = {
  connected: false,
  connecting: false,
  error: null,
};

const connect = async () => {
  connectionState.connecting = true;

//'mongodb://127.0.0.1:27017/expertHub'


  try {
    await mongoose.connect(`mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@theplaint.u7pbgty.mongodb.net/?retryWrites=true&w=majority`, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // 30 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds socket timeout
    })
    .then(() => console.log('Connected!'));
    connectionState.connected = true;
  } catch (error) {
    connectionState.error = error;
    console.log(error);
  } finally {
    connectionState.connecting = false;
  }
};

const disconnect = async () => {
  await mongoose.disconnect();
  connectionState.connected = false;
};

module.exports = { connectionState, connect, disconnect };