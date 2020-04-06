'use strict';
// Load Environment Variables from (.env) file:
require('dotenv').config();

// Application Dependencies:
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');

// Application Setup:
const PORT = process.env.PORT || 4000;
const app = express(); //creating the server, waiting for the app.listen
app.use(cors());//will respond to any request

// API Main Route:
app.get('/', (request, response) => {
  response.status(200).send('Home Page!');
});

// Route Definitions
app.get('/location', locationHandler);
app.get('/weather', weatherHandler);
app.get('/trails', trailsHandler);
app.use('*', notFoundHandler);
app.use(errorHandler);

// Route Handlers:
function locationHandler(request, response) {
  const city = request.query.city;
  superagent(
    `https://eu1.locationiq.com/v1/search.php?key=${process.env.GEOCODE_API_KEY}&q=${request.query.city}&format=json`
  )
    .then((res) => {
      const geoData = res.body;
      const locationData = new Location(city, geoData);
      response.status(200).json(locationData);
    })
    .catch((err) => errorHandler(err, request, response));
}
    
function weatherHandler(request, response) {
  superagent(
    `https://api.weatherbit.io/v2.0/forecast/daily?city=${request.query.search_query}&key=${process.env.WEATHER_API_KEY}`
    )
    .then((skyData) => {
      console.log(skyData); 
      const weatherDataArr = skyData.body.data.map((day) => {
        return new Weather(day);
      });
      response.status(200).json(weatherDataArr);
    })
    .catch((err) => errorHandler(err, request, response));
}

function trailsHandler(request, response) {
  superagent(
    // `https://www.hikingproject.com/data/get-trails-by-id?ids=${request.query.id}&key=${process.env.TRAIL_API_KEY}`
    `https://www.hikingproject.com/data/get-trails?lat=${request.query.latitude}&lon=${request.query.longitude}&key=${process.env.TRAIL_API_KEY}`
    )
    .then((trailData) => {
      // console.log(trailData);
      const trailDataArr = trailData.body.trails.map((trailData) => {
        return new Trail(trailData);
      });
      response.status(200).json(trailDataArr);
    })
    .catch((err) => errorHandler(err, request, response));
}

//Constructor Functions:
function Location(city, geoData) {
  this.search_query = city;
  this.formatted_query = geoData[0].display_name;
  this.latitude = geoData[0].lat;
  this.longitude = geoData[0].lon;
}

function Weather(skyData) {
  this.forecast = skyData.weather.description;
  this.time = new Date(skyData.valid_date).toDateString();
}

function Trail(trailData) {
  this.name = trailData.name;
  this.location = trailData.location;
  this.length = trailData.length;
  this.stars = trailData.stars;
  this.stars_votes = trailData.starsVotes;
  this.summary = trailData.summary;
  this.trail_url = trailData.url;
  this.conditions = trailData.conditionDetails;
  this.condition_date = trailData.conditionDate.toDateString();
  this.condition_time = trailData.conditionDate.toTimeString();
}

//Error Handlers:
function notFoundHandler(request, response) {
  response.status(404).send('NOT FOUND!!');
}
function errorHandler(error, request, response) {
  response.status(500).send(error);
}

//Server is listening for requests:
app.listen(PORT, () => console.log(`the server is up and running on ${PORT}`));
