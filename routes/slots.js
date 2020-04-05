const express = require('express');
const router = express.Router();
const moment = require("moment");
const _ = require('lodash');
const verifyHeader = require('../middlewares/verifyHeader');
const slots = require('../model/defineSlots');

function formatSlotsData(body, slotsData) {
    let flag = 0;
    body.map(item => {
        if (item.day && item.day != null && item.start && item.start != null && item.end && item.end != null) {
            let day = item.day.toLowerCase();
            delete item.day;
            item.start = parseInt(item.start) * 60;
            item.end = parseInt(item.end) * 60;
            slotsData.slots[day] = item;
        }
        else {
            flag++;
        }
    });
    if (flag > 0 && flag < body.length) {
        return [];
    }
    else {
        return slotsData;
    }
}


router.post('/defineSlots', verifyHeader, function (req, res) {
    let slotsData = new slots();
    slotsData.slots = {};
    if (res.locals.userId) {
        slotsData.userId = res.locals.userId;
    }
    if (req.body && req.body.length > 0) {
        let formattedSlotsData = formatSlotsData(req.body, slotsData);
        // req.body.map(item => {
        //     if (item.day && item.day != null && item.start && item.start != null && item.end && item.end != null) {
        //         let day = item.day.toLowerCase();
        //         delete item.day;
        //         item.start = parseInt(item.start) * 60;
        //         item.end = parseInt(item.end) * 60;
        //         slotsData.slots[day] = item;
        //     }
        //     else {
        //         flag++;
        //     }
        // });
        //console.log(slotsData);
        if (formattedSlotsData.length == 0) {
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


router.get('/getSlots', verifyHeader, function (req, res) {
    slots.findOne({ userId: res.locals.userId }, function (err, slots_res) {
        if (err) {
            return res.send({ error: "Something went wrong" });
        }
        else {
            let definedSlots = [];
            if (slots_res != null) {
                Object.entries(slots_res["slots"]).forEach(entry => {
                    let obj = {};
                    obj.day = entry[0];
                    obj.start_time = moment(entry[1].start / 60, 'HH').format('HH:mm')
                    obj.end_time = moment(entry[1].end / 60, 'HH').format('HH:mm')
                    definedSlots.push(obj);
                });
                return res.send({ "message": definedSlots });
            }
            else {
                return res.send({ "message": "Slots are not defined yet." })
            }
        }
    })
})


router.put('/modifySlots', verifyHeader, function (req, res) {
    if (req.body.length > 0) {
        let slotsData = new slots();
        slotsData.slots = {};
        let formattedSlotsData = formatSlotsData(req.body, slotsData);
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
                                console.log("Error in updating the slots", err);
                            }
                            else {
                                if (update_result.nModified == 1) {
                                    return res.send({ "message": "Slots modified successfully" });
                                }
                                else {
                                    return res.send({ "erro": "Error in Slots modification" });
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
module.exports = router;