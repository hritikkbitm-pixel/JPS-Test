const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
    actor_email: {
        type: String,
        required: true
    },
    action: {
        type: String,
        required: true
    },
    details: {
        type: String, // Storing as stringified JSON for flexibility
        required: false
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('AuditLog', AuditLogSchema);
