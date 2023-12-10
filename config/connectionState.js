import mongoose from 'mongoose';

const connectionState = {
  connected: false,
  connecting: false,
  error: null,
};

const connect = async () => {
  connectionState.connecting = true;
  try {
    await mongoose.connect(`mongodb://127.0.0.1:27017/trainingsDB`)
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

export { connectionState, connect, disconnect };
