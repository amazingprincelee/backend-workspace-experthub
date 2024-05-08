require('dotenv/config');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const authRoute = require('./routes/authRoute');
const userRouter = require('./routes/userRoute');
const courseRouter = require('./routes/courseRoute');
const accessmentRouter = require('./routes/assessments');
const notificationRouter = require('./routes/notification');
const resourceRoute = require('./routes/resourceRouter');
const eventRouter = require('./routes/eventRoute');
const categoryRoute = require('./routes/categoryRoute');
const noticeRouter = require('./routes/noticeRouter');

const { sendEmail } = require('./utils/sendEmail')
const bodyParser = require('body-parser');
const { connect } = require('./config/connectionState');


const app = express();


const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    // origin:"https://trainings.experthubllc.com",
    origin: "*",
    allowedHeaders: ["*"],
    methods: ["*"],
    credentials: true,
  }),
);

app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '35mb' }));
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(express.static('public'))
app.set('view engine', 'ejs');
app.use(express.json());

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

//cloudinary upload ie
app.use(
  fileUpload({
    useTempFiles: true
  })
);

//connect database
connect();



app.use('/auth', authRoute);
app.use('/user', userRouter);
app.use('/courses', courseRouter);
app.use('/events', eventRouter);
app.use('/resources', resourceRoute);
app.use('/assessment', accessmentRouter);
app.use('/notifications', notificationRouter);
app.use('/category', categoryRoute)
app.use('/notice', noticeRouter)


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
