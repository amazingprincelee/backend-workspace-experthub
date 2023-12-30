import 'dotenv/config.js';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import cors from 'cors'; 
import authRoute from './routes/authRoute.js';
import bodyParser from 'body-parser';
import { connect } from './config/connectionState.js'



const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); 
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

//connect database
connect();


app.use('/', authRoute);






app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
