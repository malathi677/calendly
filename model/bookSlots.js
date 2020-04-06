const mongoose = require('mongoose');
const bookedSlotsSchema = mongoose.Schema({
    from: {
        type: String,
        required: true
    },
    to: {
        type: String,
        required: true
    },
    date: {
        type: Number,
        required: true
    },
    slots: {
        type: Object
    }
});

const bookedSlots = module.exports = mongoose.model('bookedSlots', bookedSlotsSchema); 
