const express = require('express');
const router = express.Router();
const _ = require('lodash')
const verifyHeader = require('./../middlewares/verifyHeader');
const bookSlots = require('./../model/bookSlots');
const slots = require('../model/defineSlots');


function checkDate(date) {
    let today = new Date().toISOString().substr(0, 10);
    let requestedDay = new Date(date).toISOString().substr(0, 10);
    if (requestedDay == today || requestedDay > today) {
        let days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        return { "message": true, "day": days[new Date(date).getDay()] };
    }
    else {
        return { "message": false };
    }
}


router.post('/bookSlots', verifyHeader, function (req, res) {

    if (req.body && req.body.to && req.body.date && req.body.time) {

        let dateCheck = checkDate(req.body.date);
        let dateTimeStamp = Math.round(new Date(req.body.date).getTime() / 1000);

        if (dateCheck.message == false) {
            return res.send({ "message": "You cannot book past day slot" });
        }

        let query = {
            "to": req.body.to,
            "date": dateTimeStamp,
            "slots.start": parseInt(req.body.time) * 60 + parseInt(req.body.time.split(":")[1])
        };
        bookSlots.find(query, function (err, bookSlots_res) {
            if (err) {
                res.send({ "error": "something went wrong" });
            }
            else {
                if (bookSlots_res.length > 0) {
                    res.send({ "message": "slot is not available" });
                }
                else {
                    let query = {};
                    let projectionData = {};
                    query.userId = req.body.to;
                    projectionData["slots." + dateCheck.day] = 1;
                    //check available slot
                    slots.findOne(query, projectionData, function (err, slots_res) {
                        if (err) {
                            res.send({ "error": "something went wrong" });
                        }
                        else {

                            if (slots_res != null && slots_res.slots && _.isEmpty(slots_res.slots) != true) {

                                let bookSlot = new bookSlots();
                                bookSlot.slots = {};
                                bookSlot.to = req.body.to;
                                bookSlot.from = res.locals.userId;
                                bookSlot.date = dateTimeStamp;
                                bookSlot.slots.start = parseInt(req.body.time) * 60 + parseInt(req.body.time.split(":")[1]);
                                bookSlot.slots.end = (parseInt(req.body.time) + 1) * 60 + parseInt(req.body.time.split(":")[1]);

                                if (bookSlot["slots"]["start"] >= slots_res["slots"][dateCheck.day].start &&
                                    bookSlot["slots"]["start"] < slots_res["slots"][dateCheck.day].end) {
                                    bookSlot.save(function (err, result) {
                                        if (err) {
                                            res.send({ "error": "Something went wrong" });
                                        }
                                        else {
                                            res.send({ "message": "slot booked" });
                                        }
                                    });
                                }
                                else {
                                    res.send({ "message": "slot is not available" });
                                }

                            }
                            else {
                                res.send({ "message": "slot is not available" });
                            }
                        }
                    });

                }
            }
        });
    }
    else {
        return res.send({ "error": "Not able to book slot if date or to or time fields are not presenet." });
    }

});

module.exports = router;