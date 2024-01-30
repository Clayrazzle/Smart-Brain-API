const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');

const register = require('./controllers/register');
const signin = require('./controllers/signin');
const profile = require('./controllers/profile');
const image = require('./controllers/image');

const db = knex({
  // connect to your own database here:
  client: 'pg',
  connection: {
    connectionString: process.env.DATABASE_URL,
    ssl : {rejectUnauthorized: false },
    host: process.env.DATABASE_HOST,
    port: 5432,
    user : process.env.DATABASE_USER,
    password : process.env.DATABASE_PW,
    database : process.env.DATABASE_DB
  }
});

const app = express();

app.use(cors());
app.use(express.json()); 

app.post('/signin', signin.handleSignin(db, bcrypt));
app.post('/register', (req, res) => { register.handleRegister(req, res, db, bcrypt); });
app.get('/profile/:id', (req, res) => { profile.handleProfileGet(req, res, db); });
app.put('/image', (req, res) => { image.handleImage(req, res, db); });
app.post('/imageurl', (req, res) => { image.handleApiCall(req, res); });
app.get('/', (req, res) => { res.send(db.users); }); 


app.get('/test', (req, res) => {
  db.select('*')
    .from('users')
    .then(data => {
      res.json({ success: true, data });
    })
    .catch(error => {
      console.error('Error retrieving data:', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve data' });
    });
});


app.get('/test-db-connection', async (req, res) => {
  try {
    const client = await db.raw('SELECT 1');
    res.json({ success: true, message: 'Database connection successful' });
  } catch (error) {
    console.error('Error connecting to the database:', error);
    res.status(500).json({ success: false, error: 'Database connection failed' });
  }
});


const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App is running on port ${port}`);
});