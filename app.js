import 'dotenv/config.js';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import cors from 'cors'; 
import fileUpload from "express-fileupload";
import authRoute from './routes/authRoute.js';
import userRouter from './routes/userRoute.js';
import courseRouter from './routes/courseRoute.js';
import accessmentRouter from './routes/assessments.js';
import bodyParser from 'body-parser';
import { connect } from './config/connectionState.js';



const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, DELETE, PUT"
  );
  res.setHeader("Access-Control-Allow-Headers", "content-type");

  // res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization ");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
}); 

app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({extended: false}));
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
app.use('/assessment', accessmentRouter);








app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
