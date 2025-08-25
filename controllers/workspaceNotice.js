const User = require("../models/user")
const upload = require("../config/cloudinary.js");
const WorkspaceNotice = require("../models/workspaceNotice.js");
const cloudinaryVidUpload = require("../config/cloudinary.js");

const noticeController = {
  addNotice: async (req, res) => {
    const { title, body, role, category, country, state, link, page, cancel, action, recipient } = req.body

    if (role === 'all') {
      users = await User.find()
    } else {
      users = await User.find({ role, assignedCourse: category, state, country })
    }

    if (recipient === undefined && users.length === 0) {
      return res.status(403).json({ message: 'No user falls into the description' });
    }

    try {
      let cloudFile
      if (req.body.asset.type === 'image') {
        const file = await upload(req.body.asset.url);
        cloudFile = file.url
      } else {
        try {
          const video = await upload.cloudinaryVidUpload(req.body.asset.url)
          cloudFile = video
        } catch (e) {
          console.log(e)
        }
      }

      const newNotice = {
        title,
        body,
        role,
        category,
        country,
        state,
        link,
        page,
        cancel,
        action,
        thumbnail: {
          type: req.body.asset.type,
          url: cloudFile
        },
        receivers: recipient ? recipient : users
      }

      const notice = await WorkspaceNotice.create(newNotice)

      return res.status(201).json({
        success: true,
        message: 'Notice created successfully',
        notice,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: 'Unexpected error!' });
    }
  },
  getAllNotice: async (req, res) => {
    try {
      const { adminId, category, role } = req.query;
      let query = {};
      
      // Admin verification
      if (adminId) {
        const admin = await User.findById(adminId);
        if (!admin || admin.role.toLowerCase() !== 'admin') {
          return res.status(403).json({ message: 'Only admins can access this endpoint' });
        }
      }
      
      // Apply filters
      if (category) {
        query.category = category;
      }
      if (role && role !== 'all') {
        query.role = role;
      }
      
      const notices = await WorkspaceNotice.find(query)
        .populate('receivers', 'fullname email role')
        .populate('viewed', 'fullname email')
        .sort({ createdAt: -1 });
        
      return res.status(200).json({ notice: notices });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: 'Unexpected error!' });
    }
  },

  getNoticesByWorkspace: async (req, res) => {
    try {
      const { category } = req.params;
      const { adminId, role } = req.query;
      
      // Admin verification
      if (adminId) {
        const admin = await User.findById(adminId);
        if (!admin || admin.role.toLowerCase() !== 'admin') {
          return res.status(403).json({ message: 'Only admins can access this endpoint' });
        }
      }
      
      let query = { category };
      
      // Apply role filter if specified
      if (role && role !== 'all') {
        query.role = role;
      }
      
      const notices = await WorkspaceNotice.find(query)
        .populate('receivers', 'fullname email role')
        .populate('viewed', 'fullname email')
        .sort({ createdAt: -1 });
        
      return res.status(200).json({ 
        success: true,
        notice: notices,
        category: category
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: 'Unexpected error!' });
    }
  },

  getAssignedNotice: async (req, res) => {
    const userId = req.params.userId;

    try {
      notice = await WorkspaceNotice.find({
        receivers: { _id: userId }, viewed: {
          $not: {
            $elemMatch: {
              $eq: userId
            }
          }
        }
      })
      return res.status(200).json({ notice })

    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: 'Unexpected error!' });
    }
  },
  markViewed: async (req, res) => {
    const noticeId = req.params.noticeId;

    const { id } = req.body

    try {

      const notice = await WorkspaceNotice.findById(noticeId);
      const user = await User.findById(id);

      if (!notice) {
        return res.status(404).json({ message: 'Notice not found' });
      }

      // Check if the student is already enrolled
      if (notice.viewed.includes(id)) {
        return res.status(400).json({ message: 'Student has already viewed this notice' });
      }

      // Enroll the student in the course
      notice.viewed.push(id);
      await notice.save();

      return res.status(200).json({ message: 'Viewed successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Unexpected error!' });
    }
  },
  
  updateNotice: async (req, res) => {
    const noticeId = req.params.noticeId;
    const { title, body, role, category, country, state, link, page, cancel, action, asset } = req.body;

    try {
      const notice = await WorkspaceNotice.findById(noticeId);
      if (!notice) {
        return res.status(404).json({ message: 'Notice not found' });
      }

      let cloudFile = notice.thumbnail?.url;
      
      // Handle file upload if new asset is provided
      if (asset && asset.url && asset.url !== notice.thumbnail?.url) {
        if (asset.type === 'image') {
          const file = await upload(asset.url);
          cloudFile = file.url;
        } else {
          try {
            const video = await upload.cloudinaryVidUpload(asset.url);
            cloudFile = video;
          } catch (e) {
            console.log(e);
          }
        }
      }

      const updateData = {
        title: title || notice.title,
        body: body || notice.body,
        role: role || notice.role,
        category: category || notice.category,
        country: country || notice.country,
        state: state || notice.state,
        link: link || notice.link,
        page: page || notice.page,
        cancel: cancel || notice.cancel,
        action: action || notice.action,
        thumbnail: {
          type: asset?.type || notice.thumbnail?.type || 'image',
          url: cloudFile
        }
      };

      const updatedNotice = await WorkspaceNotice.findByIdAndUpdate(
        noticeId,
        updateData,
        { new: true }
      );

      return res.status(200).json({
        success: true,
        message: 'Notice updated successfully',
        notice: updatedNotice,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: 'Unexpected error!' });
    }
  },

  deleteNotice: async (req, res) => {
    const noticeId = req.params.noticeId;

    try {
      const notice = await WorkspaceNotice.findById(noticeId);
      if (!notice) {
        return res.status(404).json({ message: 'Notice not found' });
      }

      await WorkspaceNotice.findByIdAndDelete(noticeId);

      return res.status(200).json({
        success: true,
        message: 'Notice deleted successfully',
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: 'Unexpected error!' });
    }
  }
}

module.exports = noticeController;
