const WorkSpace = require("../models/workspace.js");
const Event = require("../models/event.js");
const User = require("../models/user.js");
const WorkspaceCategory = require("../models/workspaceCategory.js");
const { upload } = require("../config/cloudinary.js");
const KJUR = require("jsrsasign");
const Notification = require("../models/notifications.js");
const Transaction = require("../models/transactions.js");
const dayjs = require("dayjs");
const isBetween = require("dayjs/plugin/isBetween.js");
const isSameOrAfter = require("dayjs/plugin/isSameOrAfter.js");

dayjs.extend(isBetween);
dayjs.extend(isSameOrAfter);

// const categories = ["Virtual Assistant", "Product Management", "Cybersecurity", "Software Development", "AI / Machine Learning", "Data Analysis & Visualisation", "Story Telling", "Animation", "Cloud Computing", "Dev Ops", "UI/UX Design", "Journalism", "Game development", "Data Science", "Digital Marketing", "Advocacy"]

const workspaceController = {
  getAllCategory: async (req, res) => {
    try {
      const categories = await WorkspaceCategory.find().lean();
      if (!categories || categories.length === 0) {
        return res.status(200).json({ categories: [] });
      }
  
      return res.status(200).json({
        categories: categories.map(cat => ({
          name: cat.name,
          subCategory: cat.subCategory,
        })),
      });
    } catch (error) {
      console.error("Error fetching categories:", error);
      return res.status(500).json({
        message: "Unexpected error while fetching categories",
      });
    }
  },

  deleteCategory: async (req, res) => {
    try {
      const categoryName = req.params.categoryName;
      const userId = req.params.userId; // Optional: if you want to check user role
      const user = await User.findById(userId);

      if (!user || user.role.toLowerCase() !== "admin") {
        return res.status(403).json({ message: "Only admins can delete categories" });
      }

      const category = await WorkspaceCategory.findOneAndDelete({ name: categoryName });
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      return res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("Error deleting category:", error);
      return res.status(500).json({
        message: "Unexpected error while deleting category",
        error: error.message,
      });
    }
  },

  // Update a category
  updateCategory: async (req, res) => {
    try {
      const categoryName = req.params.categoryName;
      const userId = req.params.userId; // Optional: if you want to check user role
      const user = await User.findById(userId);

      if (!user || user.role.toLowerCase() !== "admin") {
        return res.status(403).json({ message: "Only admins can update categories" });
      }

      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ message: "Category name is required" });
      }

      const category = await WorkspaceCategory.findOne({ name: categoryName });
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      // Check if the new name already exists (excluding the current category)
      const existingCategory = await WorkspaceCategory.findOne({ name, _id: { $ne: category._id } });
      if (existingCategory) {
        return res.status(400).json({ message: "Category name already exists" });
      }

      category.name = name;
      const updatedCategory = await category.save();

      return res.status(200).json({
        message: "Category updated successfully",
        category: updatedCategory,
      });
    } catch (error) {
      console.error("Error updating category:", error);
      return res.status(500).json({
        message: "Unexpected error while updating category",
        error: error.message,
      });
    }
  },

  getWorkspaceByCategory: async (req, res) => {
    const category = req.body.category;

    try {
      const workspaces = await WorkSpace.find({ category, approved: true })
        .populate({
          path: "registeredClients",
          select: "profilePicture fullname _id",
        })
        .lean();

      return res.status(200).json({ workspaces });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({
          message: "Unexpected error while fetching workspace by category",
        });
    }
  },

  getSpaceProviderSpaces: async (req, res) => {
    const category = req.body.category;
    const userId = req.body.id;

    try {
      const workspace = await WorkSpace.find({
        $or: [
          { assignedSpaceProvider: { $in: userId }, approved: true },
          { category: category, approved: true, providerId: userId },
        ],
      })
        .populate({
          path: "registeredClients",
          select: "profilePicture fullname _id",
        })
        .lean();

      return res.status(200).json({ workspace });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Unexpected error while fetching workspaces" });
    }
  },

  getPlatformWorkspaces: async (req, res) => {
    const providerId = req.params.userId;

    try {
      const workspaces = await WorkSpace.find({
        providerId,
      })
        .populate({
          path: "registeredClients",
          select: "profilePicture fullname _id",
        })
        .lean();

      return res.status(200).json({ workspaces });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Unexpected error while fetching workspaces" });
    }
  },

  getWorkSpaceById: async (req, res) => {
    const workspaceId = req.params.workspaceId;

    try {
      const workspace = await WorkSpace.findById(workspaceId);

      if (!workspace) {
        return res.status(404).json({ message: "Workspace not found" });
      }

      return res.status(200).json({ workspace });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Unexpected error while fetching the workspace" });
    }
  },

  getAllWorkspaces: async (req, res) => {
    try {
      console.log("hmm na ehere");

      const workspaces = await WorkSpace.find({
        approved: false,
      })
        .populate({
          path: "registeredClients assignedSpaceProvider",
          select: "profilePicture fullname _id",
        })
        .lean();

      return res.status(200).json({ workspaces: workspaces });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Unexpected error while fetching all workspaces" });
    }
  },

  getApprovedProviders:  async (req, res) => {
    try {
      const providers = await User.find({ role: "provider" })
        .select("fullname profilePicture _id") // Only fetch necessary fields
        .lean();
  
      if (!providers || providers.length === 0) {
        return res.status(404).json({ message: "No approved providers found" });
      }
  
      return res.status(200).json({ providers });
    } catch (error) {
      console.error("Error fetching approved providers:", error);
      return res.status(500).json({
        message: "Unexpected error while fetching approved providers",
      });
    }
  },

  addWorkSpace: async (req, res) => {
    try {
      const userId = req.params.userId; // Authenticated user ID from params
      const user = await User.findById(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
  
      const {
        title,
        about,
        duration,
        type,
        startDate,
        endDate,
        startTime,
        endTime,
        category,
        privacy,
        workDuration,
        fee,
        strikedFee,
        providerName, // Selected from frontend autocomplete for admins
      } = req.body;
  
      const file = req.files?.thumbnail;
      if (!file) {
        return res.status(400).json({ message: "Thumbnail image is required" });
      }
  
      const uploadedImage = await upload(file.tempFilePath);
  
      // Role-based logic
      const isAdmin = user.role.toLowerCase() === "admin";
      const approved = isAdmin; // true if admin, false otherwise (e.g., provider)
      const providerId = isAdmin ? null : userId; // Providers use their own ID, admins leave it optional
  
      const newWorkspace = new WorkSpace({
        title,
        providerName: isAdmin ? providerName : user.fullname, // Admin selects, provider uses own name
        providerImage: user.profilePicture || "", // Use authenticated user's picture
        thumbnail: {
          type: uploadedImage.resource_type,
          url: uploadedImage.secure_url,
        },
        category,
        privacy,
        about,
        providerId: providerId || undefined, // Set only for providers
        duration,
        type,
        startDate,
        endDate,
        startTime,
        endTime,
        workDuration,
        fee,
        strikedFee,
        approved, // true for admin, false for provider
      });
  
      const savedWorkspace = await newWorkspace.save();
  
      return res.status(201).json({
        message: "Workspace created successfully",
        workspace: savedWorkspace,
      });
    } catch (error) {
      console.error("Error creating workspace:", error);
      return res.status(500).json({
        message: "An error occurred while creating the workspace",
        error: error.message,
      });
    }
  },

  addCategory: async (req, res) => {
    try {
      const userId = req.params.userId;
      const user = await User.findById(userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
  
      if (user.role.toLowerCase() !== "admin") {
        return res.status(403).json({ message: "Only admins can add categories" });
      }
  
      const { name, subCategory } = req.body;
  
      if (!name) {
        return res.status(400).json({ message: "Category name is required" });
      }
  
      const existingCategory = await WorkspaceCategory.findOne({ name });
      if (existingCategory) {
        return res.status(400).json({ message: "Category already exists" });
      }
  
      const newCategory = new WorkspaceCategory({
        name,
        subCategory: subCategory || [],
      });
  
      const savedCategory = await newCategory.save();
  
      return res.status(201).json({
        message: "Category added successfully",
        category: savedCategory,
      });
    } catch (error) {
      console.error("Error adding category:", error);
      return res.status(500).json({
        message: "An error occurred while adding the category",
        error: error.message,
      });
    }
  },

  getUnaproved: async (req, res) => {
    try {
      const workspaces = await WorkSpace.find({ approved: false });

      return res.status(200).json({ workspaces });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({
          message: "Unexpected error while fetching workspace by category",
        });
    }
  },

  approveWorkspace: async (req, res) => {
    const workspaceId = req.params.workspaceId;
    try {
      const workspace = await WorkSpace.findById(workspaceId);

      if (!workspace) {
        return res.status(404).json({ message: "workspace not found" });
      }

      // Approve the course
      workspace.approved = true;
      await workspace.save();

      return res.status(200).json({ message: "Approved successfully" });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Unexpected error during enrollment" });
    }
  },

  // workspace admission
  enrollWorkspace: async (req, res) => {
    const workspaceId = req.params.workspaceId;

    const { id } = req.body;

    try {
      const workspace = await WorkSpace.findById(workspaceId);
      const user = await User.findById(id);
      const creator = await User.findById(workspace.providerId);

      console.log(user);
      if (!workspace) {
        return res.status(404).json({ message: "workspace not found" });
      }
      // console.log(course);
      // Check if the student is already enrolled
      if (workspace.registeredClients.includes(id)) {
        return res
          .status(400)
          .json({ message: "Client is already enrolled in the course" });
      }

      // const student = course.enrollments.find(student => student.user.toString() === id);

      // if (student) {
      //     return res.status(400).json({ message: 'Student is already enrolled in the course' });
      // }
      // Enroll the student in the course
      workspace.registeredClients.push(id);
      workspace.enrollments.push({
        user: id,
        staus: "active",
        enrolledOn: new Date(),
      });
      await workspace.save();
      user.contact = false;
      await user.save();

      await Notification.create({
        title: "Workspace enrolled",
        content: `${user.fullname} Just enrolled for your workspace ${workspace.workSpaceTitle}`,
        contentId: workspace._id,
        userId: workspace.providerId,
      });

      if (workspace.fee > 0) {
        await Transaction.create({
          userId: creator._id,
          amount: workspace.fee,
          type: "credit",
        });
        const amountToAdd = workspace.fee * 0.95;
        creator.balance += amountToAdd;
        await creator.save();
      }

      return res.status(200).json({ message: "Enrolled successfully" });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Unexpected error during enrollment" });
    }
  },

  assignedSpaceProvider: async (req, res) => {
    const workspaceId = req.params.workspaceId;

    const { id } = req.body;

    try {
      const workspace = await WorkSpace.findById(workspaceId);
      const user = await User.findById(id);

      console.log(user);
      if (!course) {
        return res.status(404).json({ message: "workspace not found" });
      }
      console.log(workspace);
      // Check if the student is already enrolled
      if (workspace.assignedSpaceProvider.includes(id)) {
        await workspace.updateOne(
          { _id: workspace._id },
          { $pull: { assignedSpaceProvider: id } }
        );
        return res
          .status(200)
          .json({ message: "Space Provider is Unassigned to this workspace" });
      } else {
        workspace.assignedSpaceProvider.push(id);
        workspace.contact = false;
        await workspace.save();

        await Notification.create({
          title: "Tutor Assigned",
          content: `${user.fullname} was assigned to your Course ${workspace.workSpaceTitle}`,
          contentId: workspace._id,
          userId: workspace.providerId,
        });
      }

      return res.status(200).json({ message: "Assigned successfully" });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Unexpected error during assignment" });
    }
  },

  getEnrolledWorkspaces: async (req, res) => {
    const userId = req.params.userId;

    try {
      // Find the user by ID
      // const user = await User.findById(userId);

      // if (!user) {
      //     return res.status(404).json({ message: 'User not found' });
      // }

      // Get the enrolled courses using the user's enrolledCourses array
      const enrolledWorkspaces = await WorkSpace.find({
        $or: [{ registeredClients: userId }, { "enrollments.user": userId }],
      })
        .populate({
          path: "registeredClients",
          select: "profilePicture fullname _id",
        })
        .sort({ startDate: -1 })
        .lean();
      // console.log(enrolledCourses)

      if (!enrolledWorkspaces || enrolledWorkspaces.length === 0) {
        return res
          .status(404)
          .json({ message: "No enrolled workspaces found for this user" });
      }

      return res
        .status(200)
        .json({
          message: "Enrolled workspaces retrieved successfully",
          enrolledWorkspaces,
        });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({
          message: "Unexpected error during enrolled workspace retrieval",
        });
    }
  },

  getEnrolledClients: async (req, res) => {
    const workspaceId = req.params.workspaceId;

    try {
      const workspace = await WorkSpace.findById(workspaceId);

      if (!workspace) {
        return res.status(404).json({ message: "workspace not found" });
      }

      // Fetch details of enrolled students
      const registeredClients = await User.find({
        _id: { $in: workspace.registeredClients },
      });

      if (!registeredClients || registeredClients.length === 0) {
        return res
          .status(404)
          .json({ message: "No enrolled clients found for this course" });
      }

      // Extract relevant student information
      const registeredClientsProfiles = registeredClients.map((client) => ({
        fullname: client.fullname,
        email: client.email,
        phone: client.phone,
        gender: client.gender,
        age: client.age,
        skillLevel: client.skillLevel,
        country: client.country,
        state: client.state,
        address: client.address,
      }));

      return res
        .status(200)
        .json({
          message: "Enrolled clients retrieved successfully",
          registeredClients: registeredClientsProfiles,
        });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Unexpected error during enrolled client retrieval" });
    }
  },

  // fetch roundom workspace
  getRecommendedWorkspace: async (req, res) => {
    try {
      const userId = req.params.userId;

      const user = await User.findOne({ _id: userId });
      const category = [user.assignedWorkspace, ...user.otherWorkspace];
      // const numberOfCourses = 4; // Set the number of recommended courses you want
      const count = await WorkSpace.countDocuments();

      if (count === 0) {
        return res.status(404).json({ message: "No workspaces available" });
      }

      const workspace = await WorkSpace.find({
        category: { $in: category },
        approved: true,
      }).sort({ _id: -1 });

      const recommendedWorkspaces = await workspace
        .map((workspace) => {
          if (workspace.registeredClients.includes(userId)) {
            return null;
          } else if (
            workspace.enrollments?.find(
              (client) => client.user?.toString() === userId
            )
          ) {
            return null;
          } else {
            return workspace;
          }
        })
        .filter((item) => item !== null);

      if (!recommendedWorkspaces || recommendedWorkspaces.length === 0) {
        return res.status(404).json({ message: "No workspace available" });
      }

      return res
        .status(200)
        .json({
          workspaces: recommendedWorkspaces.filter(
            (workspace) =>
              workspace.audience.length === 0 ||
              workspace.audience.includes(userId)
          ),
        });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({
          message: "Unexpected error while fetching recommended workspace",
        });
    }
  },

  // editWorkspace: async (req, res) => {
  //     try {
  //         const workspace = await WorkSpace.updateOne({
  //             _id: req.params.id
  //         }, {
  //             ...req.body
  //         }, {
  //             new: true
  //         })
  //         res.json(workspace);
  //     } catch (error) {
  //         console.error(error);
  //         res.status(400).json(error);
  //     }
  // },

  editWorkSpace: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        workSpaceTitle,
        about,
        duration,
        type,
        startDate,
        endDate,
        startTime,
        endTime,
        category,
        privacy,
        workDuration,
        fee,
        strikedFee,
      } = req.body;

      // Find the workspace by ID
      let workspace = await WorkSpace.findById(id);
      if (!workspace) {
        return res.status(404).json({ message: "Workspace not found" });
      }

      // Check if a new thumbnail is provided
      if (req.files?.thumbnail) {
        const file = req.files.thumbnail;
        const uploadedImage = await upload(file.tempFilePath);
        workspace.thumbnail = {
          type: uploadedImage.resource_type,
          url: uploadedImage.secure_url,
        };
      }

      // Update other fields
      workspace.workSpaceTitle = workSpaceTitle || workspace.workSpaceTitle;
      workspace.about = about || workspace.about;
      workspace.duration = duration || workspace.duration;
      workspace.type = type || workspace.type;
      workspace.startDate = startDate || workspace.startDate;
      workspace.endDate = endDate || workspace.endDate;
      workspace.startTime = startTime || workspace.startTime;
      workspace.endTime = endTime || workspace.endTime;
      workspace.category = category || workspace.category;
      workspace.privacy = privacy || workspace.privacy;
      workspace.workDuration = workDuration || workspace.workDuration;
      workspace.fee = fee || workspace.fee;
      workspace.strikedFee = strikedFee || workspace.strikedFee;

      // Save the updated workspace
      const updatedWorkspace = await workspace.save();

      return res.status(200).json({
        message: "Workspace updated successfully",
        workspace: updatedWorkspace,
      });
    } catch (error) {
      console.error("Error updating workspace:", error);
      return res.status(500).json({
        message: "An error occurred while updating the workspace",
        error: error.message,
      });
    }
  },

  deleteWorkspace: async (req, res) => {
    try {
      const workspace = await WorkSpace.deleteOne({
        _id: req.params.id,
      });
      res.json(workspace);
    } catch (error) {
      console.error(error);
      res.status(400).json(error);
    }
  },

  updateStatus: async (req, res) => {
    const workspaceId = req.params.workspaceId;
    const { id } = req.body;

    try {
      const workspace = await WorkSpace.findById(workspaceId);

      if (!workspace) {
        return res.status(404).json({ message: "Workspace not found" });
      }

      // Find the student in the enrolledStudents array
      const client = workspace.enrollments.find(
        (client) => client.user.toString() === id
      );

      if (client) {
        // Update status and updatedAt fields
        client.status = "expired";
        client.updatedAt = new Date();

        // Save the course with the updated student details
        await client.save();

        return res.status(200).json({ message: "Status updated successfully" });
      } else {
        return res
          .status(404)
          .json({ message: "Client not found in enrolled Clients" });
      }
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Unexpected error during client status update" });
    }
  },

  renewWorkspace: async (req, res) => {
    const workspaceId = req.params.workspaceId;
    const id = req.params.id;

    try {
      const workspace = await WorkSpace.findById(workspaceId);
      const user = await User.findById(id);

      const client = workspace.enrollments.find(
        (client) => client.user.toString() === id
      );
      if (!client) {
        return res
          .status(400)
          .json({ message: "Client is not enrolled in this workspace" });
      }

      client.status = "active";
      client.enrolledOn = new Date();
      await workspace.save();

      if (workspace.fee > 0) {
        await Transaction.create({
          userId: workspace.instructorId,
          amount: workspace.fee,
          type: "credit",
        });
        const amountToAdd = workspace.fee * 0.95;
        author.balance += amountToAdd;
        await author.save();
      }
      await Notification.create({
        title: "Workspace enrollment renewal",
        content: `${user.fullname} Just renewed enrollment for your workspace ${workspace.workSpaceTitle}`,
        contentId: workspace._id,
        userId: workspace.providerId,
      });
      return res.status(200).json({ message: "Renewed successfully" });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Unexpected error during renewal" });
    }
  },
};

module.exports = workspaceController;
