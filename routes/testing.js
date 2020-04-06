const moment = require('moment');

function formatSlotsToDisplay(data) {
    let definedSlots = [];
    Object.entries(data).forEach(entry => {
        let obj = {};
        obj.day = entry[0];
        obj.start_time = moment(entry[1].start / 60, 'HH').format('HH:mm')
        obj.end_time = moment(entry[1].end / 60, 'HH').format('HH:mm')
        definedSlots.push(obj);
    });
    return definedSlots;
}


let slots_res = {
    _id: "5e8ad1727d7410482ffdc0b4",
    slots: { thursday: { start: 600, end: 960 } }
}

let bookedSlots_res = [{
    _id: "5e8ada54036ad45100cb2383",
    slots: { start: 630, end: 690 }
}];
let dateCheck = { "day": "thursday" };


let data = [];

for (var i = 0; i < bookedSlots_res.length - 1; i++) {
    if (bookedSlots_res[i + 1].slots.start > bookedSlots_res[i].slots.end) {
        if (bookedSlots_res[i].slots.end >= slots_res["slots"][dateCheck.day].start && bookedSlots_res[i + 1].slots.start < slots_res["slots"][dateCheck.day].end) {
            data.push({ "start_time": moment(bookedSlots_res[i].slots.end / 60, 'HH:mm').format('HH:mm'), "end_time": moment(bookedSlots_res[i + 1].slots.start / 60, 'HH:mm').format('HH:mm') });
        }

    }
}

if (bookedSlots_res[0].slots.start > slots_res["slots"][dateCheck.day].start) {
    data.push({ "start_time": moment(slots_res["slots"][dateCheck.day].start / 60, 'HH:mm').format('HH:mm'), "end_time": moment(bookedSlots_res[0].slots.start / 60, 'HH:mm').format('HH:mm') })
}
if (slots_res["slots"][dateCheck.day].end > bookedSlots_res[bookedSlots_res.length - 1].slots.end && bookedSlots_res[bookedSlots_res.length - 1].slots.end > slots_res["slots"][dateCheck.day].start) {
    console.log("---------------", Math.floor(bookedSlots_res[bookedSlots_res.length - 1].slots.end / 60) + ":" + bookedSlots_res[bookedSlots_res.length - 1].slots.end % 60);
    data.push({ "start_time": moment(bookedSlots_res[bookedSlots_res.length - 1].slots.end / 60, 'HH:mm').format('HH:mm'), "end_time": moment(slots_res["slots"][dateCheck.day].end / 60, 'HH:mm').format('HH:mm') })

}
console.log(data);