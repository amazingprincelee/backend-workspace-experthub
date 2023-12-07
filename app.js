import express from 'express';
import cors from 'cors'; 
import indexRoute from './routes/index.js';
import usersRoute from './routes/users.js';
import bodyParser from 'body-parser';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); 
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static('public'))
app.set('view engine', 'ejs');
app.use(express.json());



app.use('/', indexRoute);
app.use('/users', usersRoute);




app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
