import User from "../models/user.js"
import upload from "../config/cloudinary.js";
import createZoomMeeting from "../utils/createZoomMeeting.js";
import LearningEvent from "../models/event.js";

const eventsController = {
  createEvent: async (req, res) => {
    const { title, about, duration, type, startDate, endDate, startTime, endTime, category, mode, fee, strikedFee, scholarship, meetingPassword } = req.body;

    const userId = req.params.userId;
    // Query the user database to get the user's role
    const user = await User.findById(userId);
    // Check if the user has the necessary role to add a course
    const allowedRoles = ['tutor', 'admin', 'super admin'];
    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({ message: 'Permission denied. Only tutors and admins can add events' });
    }

    try {
      const cloudFile = await upload(req.body.image);
      const newEvent = {
        author: userId,
        title,
        about,
        duration,
        type, //online, pdf, offline, video
        startDate,
        endDate,
        startTime,
        endTime,
        category,
        mode,
        fee,
        strikedFee,
        enrolledStudents: scholarship,
        thumbnail: cloudFile.url,  // Set the thumbnail field with the Cloudinary URL
      };

      const event = await LearningEvent.create(newEvent);

      if (newEvent.type === "offline") {
        event.room = req.body.room
        event.location = req.body.location
        await event.save()
    }

      if (newEvent.type === "online") {
        //....Args -- course topic, course duration, scheduled date of the course, zoom password for course,
        const meetingData = await createZoomMeeting(event.title, parseInt(event.duration), new Date(startDate), meetingPassword)
        if (meetingData.success) {
          event.meetingId = meetingData.meetingId
          event.meetingPassword = meetingData.meetingPassword
          event.zakToken = meetingData.zakToken
          await event.save()
        }
      }
      return res.status(201).json({
        success: true,
        message: 'Event added successfully',
        course,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: 'Unexpected error during event creation' });
    }
  },

  getEventByCategory: async (req, res) => {
    const category = req.params.category;

    try {
      const events = await LearningEvent.find({ category })

      return res.status(200).json({ events });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error while fetching events by category' });
    }
  },

  getAllEvents: async (req, res) => {
    try {
      const events = await LearningEvent.find();

      return res.status(200).json({ events });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error while fetching all events' });
    }
  },

  enrollEvent: async (req, res) => {
    const eventId = req.params.eventId;
    const studentId = req.body.id;
    try {

      const event = await LearningEvent.findById(eventId);


      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }

      // Check if the student is already enrolled
      if (event.enrolledStudents.includes(studentId)) {
        return res.status(400).json({ message: 'Student is already enrolled in the course' });
      }

      // Enroll the student in the course
      event.enrolledStudents.push(studentId);
      await event.save();

      return res.status(200).json({ message: 'Enrolled successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error during enrollment' });
    }
  },

  getAuthorEvent: async (req, res) => {
    const author = req.params.id;

    try {
      const events = await LearningEvent.find({ author })

      return res.status(200).json({ events });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error while fetching author events' });
    }
  },

  editEvent: async (req, res) => {
    try {
      const event = await LearningEvent.updateOne({
        _id: req.params.id
      }, {
        ...req.body
      }, {
        new: true
      })
      res.json(event);
    } catch (error) {
      console.error(error);
      res.status(400).json(error);
    }
  },

  deleteEvent: async (req, res) => {
    try {
      const event = await LearningEvent.deleteOne({
        _id: req.params.id
      })
      res.json(event);
    } catch (error) {
      console.error(error);
      res.status(400).json(error);
    }
  },

}

export default eventsController;
