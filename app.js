import express from 'express';
import cors from 'cors'; 
import indexRoute from './routes/index.js';
import fellowsRoute from './routes/fellow.js';
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



//connect database
connect();


app.use('/', indexRoute);
app.use('/fellows', fellowsRoute);




app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
