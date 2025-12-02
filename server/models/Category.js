const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    label: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Category', CategorySchema);
