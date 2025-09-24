const fetch = require("node-fetch");

// Store your Clarifai Personal Access Token (PAT) in Render environment variables
const PAT = process.env.CLARIFAI_API_KEY;   // set this in Render → Environment
const USER_ID = "your_user_id";             // from Clarifai portal
const APP_ID = "your_app_id";               // from Clarifai portal
const MODEL_ID = "face-detection";          // Clarifai's face detection model

// Call Clarifai API
const handleApiCall = (req, res) => {
  const IMAGE_URL = req.body.input;

  const raw = JSON.stringify({
    user_app_id: {
      user_id: USER_ID,
      app_id: APP_ID
    },
    inputs: [
      {
        data: {
          image: {
            url: IMAGE_URL
          }
        }
      }
    ]
  });

  fetch(`https://api.clarifai.com/v2/models/${MODEL_ID}/outputs`, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Authorization": "Key " + PAT
    },
    body: raw
  })
    .then(response => response.json())
    .then(data => res.json(data))
    .catch(err => res.status(400).json("Unable to work with API"));
};

// Increment user entries in Postgres
const handleImage = (req, res, db) => {
  const { id } = req.body;
  db("users")
    .where("id", "=", id)
    .increment("entries", 1)
    .returning("entries")
    .then(entries => {
      res.json(entries[0].entries);
    })
    .catch(err => res.status(400).json("unable to get entries"));
};

module.exports = {
  handleImage,
  handleApiCall
};