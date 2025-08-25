const express = require('express');
const noticeController = require('../controllers/workspaceNotice');


const noticeRouter = express.Router();

noticeRouter.get('/all', noticeController.getAllNotice)
noticeRouter.get('/workspace/:category', noticeController.getNoticesByWorkspace)
noticeRouter.post('/new', noticeController.addNotice)
noticeRouter.get('/:userId', noticeController.getAssignedNotice)
noticeRouter.put('/enroll/:noticeId', noticeController.markViewed)
noticeRouter.put('/:noticeId', noticeController.updateNotice)
noticeRouter.delete('/:noticeId', noticeController.deleteNotice)

module.exports = noticeRouter;
