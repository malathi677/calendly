const express = require("express");
require('./routes/mongoConnection');
var bodyParser = require('body-parser');
const app = express();
var _ = require('lodash');
const signUp = require('./routes/signUp');
const slots = require('./routes/slots');
const bookSlots = require('./routes/bookSlots');
const error = require('./middlewares/error');


const PORT = process.ENV || 9010;

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: "100mb", extended: true, parameterLimit: 100000 }));
app.use(bodyParser.json({ limit: "100mb", extended: true, parameterLimit: 100000 }));

app.post('/signUp', signUp);
app.post('/login', signUp);
app.post('/defineSlots', slots);
app.put('/modifySlots', slots);
app.get('/getDefinedSlots', slots);
app.post('/bookSlots', bookSlots);
app.get('/getAvailableSlots', slots);
app.use(error);

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
