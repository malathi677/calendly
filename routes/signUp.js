const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const auth_config = require('./../configs/auth_config.json');
const User = require('../model/user');

// User login api 
router.post('/login', (req, res) => {
  User.findOne({ email: req.body.email }, function (err, user) {
    if (user === null) {
      return res.status(400).send({
        message: "User not found."
      });
    }
    else {
      if (user.validPassword(req.body.password)) {
        jwt.sign(req.body.email, auth_config.secret, (err, token) => {
          if (err) {

          }
          else {
            return res.status(201).send({
              token: token,
              message: "User Logged In",
            });
          }
        });
      }
      else {
        return res.status(400).send({
          message: "Wrong Password"
        });
      }
    }
  });
});

// User signup api 
router.post('/signUp', (req, res, next) => {
  let newUser = new User();

  newUser.name = req.body.name,
    newUser.email = req.body.email

  newUser.setPassword(req.body.password);

  newUser.save((err, User) => {
    if (err) {
      if (err.code == 11000) {
        return res.status(400).send({
          message: "User already existed."
        });
      }
      else {
        return res.status(400).send({
          message: "Failed to add user."
        });
      }
    }
    else {
      return res.status(201).send({
        message: "User added successfully."
      });
    }
  });
});

module.exports = router;