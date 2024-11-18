const express = require('express');
const appointmentControllers = require('../controllers/appointmentController')
const appointmentRouter = express.Router();

appointmentRouter.post('/new',  appointmentControllers.bookAppointment)
appointmentRouter.get('/:id', appointmentControllers.getAppointments)
appointmentRouter.put('/edit-appointment/:id', appointmentControllers.editAppointmet)
appointmentRouter.delete('/delete/:id', appointmentControllers.deleteAppointment)

appointmentRouter.put('/availability/:id', appointmentControllers.updateUserAvailability)
appointmentRouter.get('/availability/:id', appointmentControllers.getAvailability)
appointmentRouter.get('/single/:id', appointmentControllers.getAppointment)



module.exports = appointmentRouter;
