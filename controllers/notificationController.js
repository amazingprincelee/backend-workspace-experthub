import Assessment from "../models/assessment.js";
import Course from "../models/courses.js";
import LearningEvent from "../models/event.js";
import Notification from "../models/notifications.js";


const notificationController = {
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

export default notificationController;
