const AuditLog = require('../models/AuditLog');

const logAdminAction = async (email, action, details) => {
    try {
        const log = new AuditLog({
            actor_email: email,
            action,
            details: JSON.stringify(details)
        });
        await log.save();
        console.log(`[AUDIT] ${action} by ${email}`);
    } catch (error) {
        console.error('Failed to save audit log:', error);
    }
};

module.exports = { logAdminAction };
