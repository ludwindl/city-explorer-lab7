'use strict';

// these are our application dependencies
const express = require('express');
const app = express();
const superagent = require('superagent');

//
const cors = require('cors');
app.use(cors());

// configure environment variables
require('dotenv').config();
const PORT = process.env.PORT || 3000;

// tell our express server to start listening on port PORT
app.listen(PORT, () => console.log(`listening on port ${PORT}`));

//routes to handle user request and send the response from our database
app.get('/location', (req,res) => {
  searchToLatLong(req.query.data)
    .then(location => res.send(location));
});

app.get('/weather', getWeather);
app.get('/events', getEvents);


// constructor function to buld a city object instances
function City(query, data){
  this.search_query = query;
  this.formatted_query = data.body.results[0].formatted_address;
  this.latitude = data.body.results[0].geometry.location.lat;
  this.longitude = data.body.results[0].geometry.location.lng;
}

function Event(url, name, event_date, summary) {
  this.url = url;
  this.name = name;
  // Date makes time stamp prettier
  this.event_date = new Date(event_date).toDateString();
  this.summary = summary;
}

function getEvents(request, response) {
  const url = `https://www.eventbriteapi.com/v3/events/search/?location.longitude=${request.query.data.longitude}&location.latitude=${request.query.data.latitude}&expand=venue&token=${process.env.EVENTBRITE_API_KEY}`;
  superagent.get(url)
    .then(result => {
      let eventData = result.body.events.map( event => new Event(event.url, event.name.text, event.start.local, event.summary));
      response.send(eventData);
    }).catch(error => {
      console.error(error);
      response.status(500).send('Status 500: Unable to get Event data');
    });
}


function Weather(day) {
  this.forecast = day.summary;
  this.time = new Date(day.time * 1000).toString().slice(0, 15);
}

// Helper functions
function getWeather(request, response) {
  const url = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${request.query.data.latitude},${request.query.data.longitude}`;
  superagent.get(url)
    .then(result => {
      let weather = result.body.daily.data.map( day => new Weather(day));
      response.send(weather);
    }).catch(error => {
      console.error(error);
      response.status(500).send('Status 500: Unable to get weather');
    });
}

function searchToLatLong(query){
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${process.env.GEOCODE_API_KEY}`;
  return superagent.get(url)
    .then(res => {
      return new City(query, res);
    });
}
