import mongoose from 'mongoose';

const connectionState = {
  connected: false,
  connecting: false,
  error: null,
};

const connect = async () => {
  connectionState.connecting = true;

//mongodb+srv://evansb45:7QeF3uOMZ26lnFUt@theplaint.u7pbgty.mongodb.net/?retryWrites=true&w=majority

  try {
    await mongoose.connect(`mongodb://127.0.0.1:27017/expertHub`)
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
