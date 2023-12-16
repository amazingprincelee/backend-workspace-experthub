import mongoose from 'mongoose';

const connectionState = {
  connected: false,
  connecting: false,
  error: null,
};

const connect = async () => {
  connectionState.connecting = true;

//

  try {
    await mongoose.connect(`mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@theplaint.u7pbgty.mongodb.net/?retryWrites=true&w=majority`)
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
