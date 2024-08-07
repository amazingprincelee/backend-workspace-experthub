const express = require('express');
const appointmentControllers = require('../controllers/appointmentController')
const appointmentRouter = express.Router();

appointmentRouter.post('/new',  appointmentControllers.bookAppointment)
appointmentRouter.get('/:id', appointmentControllers.getAppointments)
appointmentRouter.put('/edit-appointment/:id', appointmentControllers.editAppointmet)
appointmentRouter.delete('/delete/:id', appointmentControllers.deleteAppointment)

module.exports = appointmentRouter;
