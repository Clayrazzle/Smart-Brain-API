const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const knex = require('knex');
const fetch = require('node-fetch'); // ✅ Use REST API instead of gRPC

// Controllers
const register = require('./controllers/register');
const signin = require('./controllers/signin');
const profile = require('./controllers/profile');
const image = require('./controllers/image');

// Database connection
const db = knex({
  client: 'pg',
  connection: {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    host: process.env.DATABASE_HOST,
    port: 5432,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PW,
    database: process.env.DATABASE_DB
  }
});

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => res.send('Server is running'));

app.post('/signin', signin.handleSignin(db, bcrypt));
app.post('/register', (req, res) => register.handleRegister(req, res, db, bcrypt));
app.get('/profile/:id', (req, res) => profile.handleProfileGet(req, res, db));
app.put('/image', (req, res) => image.handleImage(req, res, db));

// ✅ Clarifai REST API integration
app.post('/imageurl', async (req, res) => {
  try {
    const raw = await fetch('https://api.clarifai.com/v2/models/face-detection/outputs', {
      method: 'POST',
      headers: {
        'Authorization': 'Key 17edf5a4d12d4d3b9e553fe654586d9a', // ✅ Your actual API key
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: [
          {
            data: {
              image: {
                url: req.body.input
              }
            }
          }
        ]
      })
    });

    const data = await raw.json();
    if (data.status.code !== 10000) {
      console.error("Clarifai API error:", data.status.description);
      return res.status(400).json("Unable to work with API");
    }
    res.json(data);
  } catch (error) {
    console.error("Clarifai fetch error:", error);
    res.status(500).json("API call failed");
  }
});

// Optional debug routes
app.get('/test', (req, res) => {
  db.select('*').from('users')
    .then(data => res.json({ success: true, data }))
    .catch(error => {
      console.error('Error retrieving data:', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve data' });
    });
});

app.get('/test-db-connection', async (req, res) => {
  try {
    await db.raw('SELECT 1');
    res.json({ success: true, message: 'Database connection successful' });
  } catch (error) {
    console.error('Error connecting to the database:', error);
    res.status(500).json({ success: false, error: 'Database connection failed' });
  }
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App is running on port ${port}`);
});