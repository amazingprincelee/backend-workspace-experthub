import Notification from "../models/notifications.js";


const notificationController = {
  getUserNotificatins: async (req, res) => {

    try {
      const {id} = req.params;
      const notifications = await Notification.find({ userId:id });

      return res.status(201).json(notifications);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error during resource addition' });
    }
  },


}

export default notificationController;
