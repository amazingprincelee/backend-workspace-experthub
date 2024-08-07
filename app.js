require('dotenv/config');
const express = require('express');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const http = require('http');
const { Server } = require("socket.io");
const Notification = require("./models/notifications.js");

const authRoute = require('./routes/authRoute');
const userRouter = require('./routes/userRoute');
const courseRouter = require('./routes/courseRoute');
const accessmentRouter = require('./routes/assessments');
const notificationRouter = require('./routes/notification');
const resourceRoute = require('./routes/resourceRouter');
const eventRouter = require('./routes/eventRoute');
const categoryRoute = require('./routes/categoryRoute');
const noticeRouter = require('./routes/noticeRouter');
const transactionRouter = require('./routes/transactionRoute');
const appointmentRouter = require('./routes/appointmentRouter.js');

const Chat = require('./models/chat');
const User = require('./models/user');

const { sendEmail } = require('./utils/sendEmail');
const bodyParser = require('body-parser');
const { connect } = require('./config/connectionState');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: "*",
  allowedHeaders: ["*"],
  methods: ["*"],
  credentials: true,
}));

app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '35mb' }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(express.json());


// File upload middleware
app.use(fileUpload({
  useTempFiles: true,
}));

// Connect to database
connect();

// Routes
app.use('/auth', authRoute);
app.use('/user', userRouter);
app.use('/courses', courseRouter);
app.use('/events', eventRouter);
app.use('/resources', resourceRoute);
app.use('/assessment', accessmentRouter);
app.use('/notifications', notificationRouter);
app.use('/category', categoryRoute);
app.use('/notice', noticeRouter);
app.use('/transactions', transactionRouter);
app.use('/appointment', appointmentRouter);

// Socket.io logic
io.on('connection', async (socket) => {
  const user_id = socket.handshake.query["user_id"];

  console.log(`User connected ${socket.id}`);

  // if (user_id) {
  //   try {
  //     await User.findByIdAndUpdate(user_id, {
  //       socket_id: socket.id,
  //       status: "Online",
  //     });
  //   } catch (e) {
  //     console.log(e);
  //   }
  // }

  socket.on("get_direct_conversations", async ({ user_id }, callback) => {
    const existing_conversations = await Chat.find({
      participants: { $all: [user_id] },
    }).populate("participants", "fullname _id email profilePicture");

    console.log(existing_conversations);

    callback(existing_conversations);
  });

  socket.on("start_conversation", async (data, callback) => {
    const { to, from } = data;

    const existing_conversations = await Chat.find({
      participants: { $size: 2, $all: [to, from] },
    }).populate("participants", "fullname _id email profilePicture");

    console.log(existing_conversations[0], "Existing Conversation");

    if (existing_conversations.length === 0) {
      let new_chat = await Chat.create({
        participants: [to, from],
      });

      new_chat = await Chat.findById(new_chat._id).populate(
        "participants",
        "fullname _id email profilePicture"
      );

      // console.log(new_chat);

      socket.emit("start_chat", new_chat);
      if (callback) callback(new_chat);
    } else {
      socket.emit("start_chat", existing_conversations[0]);
      if (callback) callback(existing_conversations[0]);
    }
  });

  socket.on("get_messages", async (data, callback) => {
    try {
      const { messages } = await Chat.findById(data.conversation_id).select("messages");
      callback(messages);
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("send_dm", async (data) => {
    console.log("Received message:", data);

    const { text, conversation_id, from, to, type } = data;

    const to_user = await User.findById(to);
    const from_user = await User.findById(from);

    const new_message = {
      to: to,
      from: from,
      type: type,
      created_at: Date.now(),
      text: text
    };

    const chat = await Chat.findById(conversation_id);
    chat.messages.push(new_message);
    await chat.save({ new: true, validateModifiedOnly: true });

    await Notification.create({
      title: "Message",
      content: `${from_user.fullname} Just sent you a message '${text}'`,
      contentId: conversation_id,
      userId: to,
    });

    io.to(to_user?.socket_id).emit("new_message", {
      conversation_id,
      message: new_message,
    });

    io.to(from_user?.socket_id).emit("new_message", {
      conversation_id,
      message: new_message,
    });

  });

  socket.on("end", async (data) => {
    if (data.user_id) {
      await User.findByIdAndUpdate(data.user_id, { status: "Offline" });
    }
    console.log("closing connection");
    socket.disconnect(0);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
