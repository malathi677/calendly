const mongoose = require('mongoose');
const url_config = require('./../configs/url_config.json');
//require database URL from properties file
const dbURL = process.env.MONGODB_URI || url_config.MONGO_CONFIG.url;

mongoose.connect(dbURL, { useNewUrlParser: true, useUnifiedTopology: true });

mongoose.connection.on('connected', function () {
    db = mongoose.connection;
    console.log("Mongoose default connection is open to ", dbURL);
});

mongoose.connection.on('error', function (err) {
    console.log("Mongoose default connection has occured ", err);
});

mongoose.connection.on('disconnected', function () {
    console.log("Mongoose default connection is disconnected");
});

process.on('SIGINT', function () {
    mongoose.connection.close(function () {
        console.log("Mongoose default connection is disconnected due to application termination");
        process.exit(0)
    });
});

