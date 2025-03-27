const Assessment = require("../models/assessment.js");
const Course = require("../models/courses.js");
const LearningEvent = require("../models/event.js");
const Notification = require("../models/notifications.js");


const notificationController = {


    markAsRead: async (req, res) => {
        try { 
            const { id } = req.params;
            const notification = await Notification.findById(id)

            if (!notification) {
                return res.status(404).json({ message: 'Notification not found' });
            }
            if (notification.read) {
                return res.status(200).json({ message: 'Already Read' });
            }
            notification.read=true
            await notification.save()
            return res.status(200).json({ message: 'Marked as read' });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Unexpected error during resource addition' });
        }
    },
    
    getUserNotificatins: async (req, res) => {
        try {
            const { id } = req.params;
            const notifications = await Notification.find({ userId: id })
                .sort({ createdAt: -1 })
                .populate('userId');
            const notificationsWithContent = await notifications.reduce(async (accPromise, notification) => {
                const acc = await accPromise;

                let contentInfo;
                let contentType;
                if (notification.title.startsWith('Course')) {
                    contentInfo = await Course.findById(notification.contentId);
                    contentType = 'course';
                } else if (notification.title.startsWith('Event')) {
                    contentInfo = await LearningEvent.findById(notification.contentId);
                    contentType = 'event';
                }

                acc.push({
                    ...notification.toObject(),
                    contentInfo,
                    contentType
                });

                return acc;
            }, Promise.resolve([]));

            return res.status(201).json(notificationsWithContent);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Unexpected error during resource addition' });
        }
    },


}

module.exports = notificationController;
