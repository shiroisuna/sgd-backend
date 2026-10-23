const express = require('express');
const router = express.Router();
const { getNotifications, sendReminders } = require('./notifications.controller');

router.get('/', getNotifications);
router.post('/send-reminders', sendReminders);

module.exports = router;
