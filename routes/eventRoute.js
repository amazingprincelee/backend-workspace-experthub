const express = require('express');
const eventsController = require('../controllers/eventsController.js');

const eventRouter = express.Router();

eventRouter.post("/add-event/:userId", eventsController.createEvent);

eventRouter.get("/my-events/:userId", eventsController.getEnrolledEvents);

eventRouter.get("/category/:userId", eventsController.getEventByCategory)
eventRouter.get("/author/:userId", eventsController.getAuthorEvent)

eventRouter.get("/all", eventsController.getAllEvents)

eventRouter.put("/enroll/:eventId", eventsController.enrollEvent)

eventRouter.put("/edit/:id", eventsController.editEvent)

eventRouter.put("/recommend/:id", eventsController.recommend)

eventRouter.get("/notify-live/:id", eventsController.notifyLive)

eventRouter.get("/enrolled/:courseId", eventsController.getEnrolledStudents);

eventRouter.get("/:eventId", eventsController.getEventById)

eventRouter.post('/reminder', eventsController.eventReminder)

eventRouter.delete("/delete/:id", eventsController.deleteEvent)

module.exports = eventRouter;
