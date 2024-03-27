import express from 'express';
import eventsController from '../controllers/eventsController.js';

const eventRouter = express.Router();

eventRouter.post("/add-event/:userId", eventsController.createEvent);

eventRouter.put("/category", eventsController.getEventByCategory)

eventRouter.get("/all", eventsController.getAllEvents)

eventRouter.put("/enroll/:eventId", eventsController.enrollEvent)

eventRouter.put("/edit/:id", eventsController.editEvent)

eventRouter.get("/enrolled/:courseId", eventsController.getEnrolledStudents);

eventRouter.get("/:eventId", eventsController.getEventById)


eventRouter.delete("/delete/:id", eventsController.deleteEvent)

export default eventRouter;
