const express = require('express');
const router = express.Router();
const moment = require("moment");
const _ = require('lodash');
const verifyHeader = require('../middlewares/verifyHeader');
const slots = require('../model/defineSlots');
const bookedSlots = require('./../model/bookSlots');

/**
 * @function formatSlotsDataFromUser
 * @param {Array} body
 * @param {object} slotsData
 * @return {object}
 * @description Checking any field is empty or not and 
 * converting time string to numeric format to store in DB
 */
function formatSlotsDataFromUser(body, slotsData) {

    let flag = 0;

    body.map(item => {

        if (item.day && item.day != null && item.start && item.start != null && item.end && item.end != null) {
            let day = item.day.toLowerCase();
            delete item.day;
            item.start = parseInt(item.start) * 60 + parseInt(item.start.split(":")[1]);
            item.end = parseInt(item.end) * 60 + parseInt(item.end.split(":")[1]);
            slotsData.slots[day] = item;
        }
        else {
            flag++;
        }

    });

    if (flag > 0 && flag <= body.length) {
        return {};
    }
    else {
        return slotsData;
    }
}

/**
 * @function formatSlotsToDisplay
 * @param {object} data
 * @return {Array}
 * @description converting numeric time to string format(HH:mm) to display to the user
 */

function formatSlotsToDisplay(data) {

    let definedSlots = [];

    Object.entries(data).forEach(entry => {
        let obj = {};
        obj.day = entry[0];
        obj.start_time = moment(entry[1].start / 60, 'HH').format('HH:mm');
        obj.end_time = moment(entry[1].end / 60, 'HH').format('HH:mm');
        definedSlots.push(obj);
    });

    return definedSlots;

}

/**
 * @function checkDate
 * @param {date} date
 * @return {object}
 * @description Checking user has given past date or not.If not proceeding further.
 */

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



//To define available slots of a day or mulitple days
router.post('/defineSlots', verifyHeader, function (req, res) {
    let slotsData = new slots();
    slotsData.slots = {};
    if (res.locals.userId) {
        slotsData.userId = res.locals.userId;
    }
    if (req.body && req.body.length > 0) {
        let formattedSlotsData = formatSlotsDataFromUser(req.body, slotsData);
        if (_.isEmpty(formattedSlotsData) == true) {
            return res.send({ error: "Please provide proper data.Every field must be filled." });
        }
    }
    else {
        return res.send({ error: "Please provide proper data.Every field must be filled." });
    }

    slotsData.save((err, result) => {
        if (err) {
            if (err.code == 11000) {
                return res.status(400).send({
                    error: "Free slots already defined.You can only modify those slots."
                });
            }
            else {
                return res.status(400).send({
                    error: "Failed to define slots"
                });
            }
        }
        else {
            return res.status(201).send({
                message: "Free slots defined successfully"
            });
        }
    });
});


// To get defined slots of individual or some other person.
router.get('/getDefinedSlots', verifyHeader, function (req, res) {
    let query = {};

    if (req.query.to && req.query.to != null) {
        query.userId = req.query.to;
    }
    else {
        query.userId = res.locals.userId;
    }

    slots.findOne(query, function (err, slots_res) {
        if (err) {
            return res.send({ error: "Something went wrong" });
        }
        else {
            if (slots_res != null) {
                let definedSlots = formatSlotsToDisplay(slots_res["slots"]);
                if (definedSlots.length > 0) {
                    return res.send({ "message": definedSlots });
                }
                else {
                    return res.send({ "message": "no freeslots available" });
                }

            }
            else {
                return res.send({ "message": "Slots are not defined yet." })
            }
        }
    });
});


//To change any slot which is already defined.
router.put('/modifySlots', verifyHeader, function (req, res) {
    if (req.body.length > 0) {
        let slotsData = new slots();
        slotsData.slots = {};
        let formattedSlotsData = formatSlotsDataFromUser(req.body, slotsData);
        if (formattedSlotsData.length == 0) {
            return res.send({ error: "Please provide proper data.Every field must be filled." });
        }
        else {
            slots.findOne({ userId: res.locals.userId }, function (err, slots_res) {
                if (err) {
                    res.send({ error: "Something went wrong" });
                }
                else {
                    if (slots_res != null) {
                        _.each(slots_res.slots, function (value, key) {
                            slots_res.slots[key] = slotsData.slots[key] || value;
                            delete slotsData.slots[key];
                        });
                        if (slotsData.slots != null) {
                            _.each(slotsData.slots, function (value, key) {
                                slots_res.slots[key] = slotsData.slots[key] || value;
                                delete slotsData.slots[key];
                            });
                        }
                        let query = { userId: slots_res.userId };
                        let data = { $set: { "slots": slots_res.slots } };
                        slots.updateOne(query, data, function (err, update_result) {
                            if (err) {
                                res.send({ "error": "Slots modification failed" });
                            }
                            else {
                                if (update_result.nModified == 1) {
                                    return res.send({ "message": "Slots modified successfully" });
                                }
                                else {
                                    return res.send({ "error": "Error in Slots modification" });
                                }
                            }
                        })
                    }
                }
            });
        }
    }
    else {
        return res.send({ error: "Please provide the slots." });
    }
});

//To get available slots of a particular person
router.get('/getAvailableSlots', verifyHeader, function (req, res) {
    let query = {};
    let projectionData = {};
    if (req.query.to && req.query.to != null && req.query.date && req.query.date != null) {
        query.userId = req.query.to;
        let dateCheck = checkDate(req.query.date);
        if (dateCheck.message == true) {
            projectionData["slots." + dateCheck.day] = 1;
        }
        else {
            return res.send({ "message": "You cannot get details about past day slots" });
        }

        slots.findOne(query, projectionData, function (err, definedSlots_res) {
            if (err) {
                return res.send({ error: "Something went wrong" });
            }
            else {
                if (definedSlots_res != null && definedSlots_res.slots && _.isEmpty(definedSlots_res.slots) != true) {
                    let dateTimeStamp = Math.round(new Date(req.query.date).getTime() / 1000);
                    let bookedSlotQuery = {};
                    let bookedSlotProjection = { "slots": 1 };
                    bookedSlotQuery.to = req.query.to;
                    bookedSlotQuery.date = dateTimeStamp;

                    bookedSlots.find(bookedSlotQuery, bookedSlotProjection, function (err, bookedSlots_res) {
                        if (err) {
                            return res.send({ "error": "something went wrong." });
                        }
                        else {
                            if (bookedSlots_res.length > 0) {

                                let data = [];

                                for (var i = 0; i < bookedSlots_res.length - 1; i++) {
                                    if (bookedSlots_res[i + 1].slots.start > bookedSlots_res[i].slots.end) {
                                        if (bookedSlots_res[i].slots.end >= definedSlots_res["slots"][dateCheck.day].start && bookedSlots_res[i + 1].slots.start < definedSlots_res["slots"][dateCheck.day].end) {
                                            if (bookedSlots_res[i + 1].slots.start - bookedSlots_res[i].slots.end >= 60) {
                                                let startTime = Math.floor(bookedSlots_res[i].slots.end / 60) + ":" + bookedSlots_res[i].slots.end % 60;
                                                let endTime = Math.floor(bookedSlots_res[i + 1].slots.start / 60) + ":" + bookedSlots_res[i + 1].slots.start % 60;
                                                data.push({ "start_time": startTime, "end_time": endTime });
                                            }
                                        }
                                    }
                                }

                                if (bookedSlots_res[0].slots.start > definedSlots_res["slots"][dateCheck.day].start) {
                                    if (bookedSlots_res[0].slots.start - definedSlots_res["slots"][dateCheck.day].start >= 60) {
                                        let startTime = Math.floor(definedSlots_res["slots"][dateCheck.day].start / 60) + ":" + definedSlots_res["slots"][dateCheck.day].start % 60;
                                        let endTime = Math.floor(bookedSlots_res[0].slots.start / 60) + ":" + bookedSlots_res[0].slots.start % 60;
                                        data.push({ "start_time": startTime, "end_time": endTime });
                                    }
                                }

                                if (definedSlots_res["slots"][dateCheck.day].end > bookedSlots_res[bookedSlots_res.length - 1].slots.end && bookedSlots_res[bookedSlots_res.length - 1].slots.end > definedSlots_res["slots"][dateCheck.day].start) {

                                    if (definedSlots_res["slots"][dateCheck.day].end - bookedSlots_res[bookedSlots_res.length - 1].slots.end >= 60) {
                                        let startTime = Math.floor(bookedSlots_res[bookedSlots_res.length - 1].slots.end / 60) + ":" + bookedSlots_res[bookedSlots_res.length - 1].slots.end % 60;
                                        let endTime = Math.floor(definedSlots_res["slots"][dateCheck.day].end / 60) + ":" + definedSlots_res["slots"][dateCheck.day].end % 60;
                                        data.push({ "start_time": startTime, "end_time": endTime });
                                    }
                                }

                                if (data.length == 0) {
                                    let availableSlots = formatSlotsToDisplay(definedSlots_res.slots);
                                    delete availableSlots[0].day;
                                    if (availableSlots.length > 0) {
                                        return res.send(availableSlots);
                                    }
                                    else {
                                        return res.send({ "message": "no freeslots available" });
                                    }
                                }
                                else {
                                    res.send(data);
                                }

                            }
                            else {
                                let definedSlots = formatSlotsToDisplay(definedSlots_res.slots);
                                delete definedSlots[0].day;
                                if (definedSlots.length > 0) {
                                    return res.send(definedSlots);
                                }
                                else {
                                    return res.send({ "message": "no freeslots available" });
                                }
                            }

                        }
                    })
                }
                else {
                    return res.send({ "message": "No slots are available on this day." });
                }

            }
        });
    }
    else {
        return res.send({ "error": "Not able to provide available slots if date or to fields are not presenet." });
    }
});



module.exports = router;