const express = require('express');
const noticeController = require('../controllers/NoticeController');


const noticeRouter = express.Router();

noticeRouter.get('/', noticeController.getAllNotice)
noticeRouter.post('/new', noticeController.addNotice)
noticeRouter.get('/:userId', noticeController.getAssignedNotice)
noticeRouter.put('/enroll/:noticeId', noticeController.markViewed)

module.exports = noticeRouter;
