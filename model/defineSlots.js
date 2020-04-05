const mongoose = require('mongoose');
const slotsSchema = mongoose.Schema({
    userId: {
        type: String,
        unique: true,
        required: true
    },
    slots: {
        type: Object
    }
});

const Slots = module.exports = mongoose.model('Slots', slotsSchema); 
