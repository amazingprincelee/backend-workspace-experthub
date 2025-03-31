//wo

const WorkSpace = require("../models/workspace.js");
const User = require("../models/user.js");
const WorkspaceCategory = require("../models/workspaceCategory.js");
const { upload } = require("../config/cloudinary.js");
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

  // controllers/workspaceController.js
  getWorkspacesByProvider: async (req, res) => {
    try {
      const { adminId } = req.query;
  
      console.log('Received adminId:', adminId); // Debug
  
      if (!adminId) {
        return res.status(400).json({ message: "Admin ID is required" });
      }
  
      // Verify the requesting user is an admin
      const admin = await User.findById(adminId);
      if (!admin) {
        return res.status(404).json({ message: "Admin account not found" });
      }
  
      if (admin.role.toLowerCase() !== "admin") {
        return res.status(403).json({ message: "Only admins can access this endpoint" });
      }
  
      // Fetch all providers (users with role "provider")
      const providers = await User.find({ role: "provider" })
        .select("fullname email phone companyName profilePicture role isVerified blocked _id")
        .lean();
  
      console.log('Fetched providers:', providers); // Debug
  
      if (!providers || providers.length === 0) {
        return res.status(200).json({
          message: "No providers found",
          data: { providers: [] },
        });
      }
  
      // Fetch all workspaces
      let query = { providerId: { $exists: true, $ne: null } };
      // Optionally, admins can see all workspaces (approved or not). If you want to change this, uncomment the following:
      // query.approved = true;
  
      const workspaces = await WorkSpace.find(query)
        .populate({
          path: "registeredClients assignedSpaceProvider",
          select: "profilePicture fullname _id",
        })
        .lean();
  
      console.log('Fetched workspaces:', workspaces); // Debug
  
      // Count the number of workspaces per provider
      const providerWorkspaceCounts = workspaces.reduce((acc, workspace) => {
        const providerId = workspace.providerId?.toString();
        if (providerId) {
          acc[providerId] = (acc[providerId] || 0) + 1;
        }
        return acc;
      }, {});
  
      console.log('Provider workspace counts:', providerWorkspaceCounts); // Debug
  
      // Map providers to the required format, including those with 0 workspaces
      const providersWithDetails = providers.map(provider => {
        const providerIdStr = provider._id.toString();
        return {
          id: provider._id,
          fullName: provider.fullname || "N/A",
          companyName: provider.companyName || "N/A",
          email: provider.email || "N/A",
          phone: provider.phone || "N/A",
          role: provider.role || "provider",
          profilePicture: provider.profilePicture || "",
          workspacesCreated: providerWorkspaceCounts[providerIdStr] || 0, // Default to 0 if no workspaces
          isVerified: provider.isVerified || false,
          blocked: provider.blocked || false,
        };
      });
  
      console.log('Providers with details:', providersWithDetails); // Debug
  
      return res.status(200).json({
        message: "Providers retrieved successfully",
        data: { providers: providersWithDetails },
      });
    } catch (error) {
      console.error("Error fetching workspaces by provider:", error);
      return res.status(500).json({ message: "Server error" });
    }
  },

  getWorkspacesByClient: async (req, res) => {
    try {
      const { adminId } = req.query;
  
      console.log('Received adminId:', adminId); // Debug
  
      if (!adminId) {
        return res.status(400).json({ message: "Admin ID is required" });
      }
  
      // Verify the requesting user is an admin
      const admin = await User.findById(adminId);
      if (!admin) {
        return res.status(404).json({ message: "Admin account not found" });
      }
  
      if (admin.role.toLowerCase() !== "admin") {
        return res.status(403).json({ message: "Only admins can access this endpoint" });
      }
  
      // Fetch all clients (users with role "client")
      const clients = await User.find({ role: "client" })
        .select("fullname email phone profilePicture role isVerified blocked _id")
        .lean();
  
      console.log('Fetched clients:', clients); // Debug
  
      if (!clients || clients.length === 0) {
        return res.status(200).json({
          message: "No clients found",
          data: { clients: [] },
        });
      }
  
      // Fetch all workspaces
      const workspaces = await WorkSpace.find({})
        .populate({
          path: "registeredClients",
          select: "profilePicture fullname _id",
        })
        .lean();
  
      console.log('Fetched workspaces:', workspaces); // Debug
  
      // Count the number of workspaces each client is enrolled in
      const clientWorkspaceCounts = workspaces.reduce((acc, workspace) => {
        workspace.registeredClients.forEach((client) => {
          const clientId = client._id.toString();
          acc[clientId] = (acc[clientId] || 0) + 1;
        });
        return acc;
      }, {});
  
      console.log('Client workspace counts:', clientWorkspaceCounts); // Debug
  
      // Map clients to the required format, including those with 0 enrolled workspaces
      const clientsWithDetails = clients.map(client => {
        const clientIdStr = client._id.toString();
        return {
          id: client._id,
          fullName: client.fullname || "N/A",
          email: client.email || "N/A",
          phone: client.phone || "N/A",
          role: client.role || "client",
          profilePicture: client.profilePicture || "",
          workspacesEnrolled: clientWorkspaceCounts[clientIdStr] || 0, // Default to 0 if no workspaces
          isVerified: client.isVerified || false,
          blocked: client.blocked || false,
        };
      });
  
      console.log('Clients with details:', clientsWithDetails); // Debug
  
      return res.status(200).json({
        message: "Clients retrieved successfully",
        data: { clients: clientsWithDetails },
      });
    } catch (error) {
      console.error("Error fetching workspaces by client:", error);
      return res.status(500).json({ message: "Server error" });
    }
  },
  
  

  deleteCategory: async (req, res) => {
    try {
      const categoryName = req.params.categoryName;
      const adminId = req.params.adminId; // Optional: if you want to check user role
      const user = await User.findById(adminId);

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
      const categoryName = req.params.categoryName.toLowerCase();
      const adminId = req.params.adminId; 
      const user = await User.findById(adminId);

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
      const existingCategory = await WorkspaceCategory.findOne({ name: name.toLowerCase(), _id: { $ne: category._id } });
      if (existingCategory) {
        return res.status(400).json({ message: "Category name already exists" });
      }

      category.name = name.toLowerCase();
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
    try {
        const adminId = req.body.adminId || req.query.adminId;
        const user = await User.findById(adminId);
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        let { category, date, timeFrom, timeUntil, numberOfPeople, location } = req.body;

        const query = {};
        if (user.role.toLowerCase() !== "admin") {
            query.approved = true; // Non-admins only see approved workspaces
        }

        if (category) {
            category = category.trim().toLowerCase().replace(/\s+/g, "-"); // Normalize category
            query.category = category;
        }

        if (date) {
            query.startDate = { $lte: date };
            query.endDate = { $gte: date };
        }

        if (timeFrom && timeUntil) {
            query.startTime = { $lte: timeUntil };
            query.endTime = { $gte: timeFrom };
        }

        if (numberOfPeople) {
            query.persons = { $gte: parseInt(numberOfPeople) };
        }

        if (location) {
            query.location = { $regex: location, $options: "i" };
        }

        const workspaces = await WorkSpace.find(query)
            .populate({
                path: "registeredClients",
                select: "profilePicture fullname _id",
            })
            .lean();

        return res.status(200).json({ workspaces });
    } catch (error) {
        console.error("Error fetching workspaces by category:", error);
        return res.status(500).json({
            message: "Unexpected error while fetching workspaces by category",
        });
    }
},
  

getDefaultWorkspaces: async (req, res) => {
  try {
    const query = { providerName: "ExpertHub", approved: true };

    const workspaces = await WorkSpace.find(query)
      .sort({ createdAt: -1 })
      .limit(2)
      .populate({
        path: "registeredClients",
        select: "profilePicture fullname _id",
      })
      .lean();

    return res.status(200).json({ workspaces });
  } catch (error) {
    console.error("Error fetching default workspaces:", error);
    return res.status(500).json({
      message: "Unexpected error while fetching default workspaces",
    });
  }
},


  getSpaceProviderSpaces: async (req, res) => {
    const category = req.body.category;
    const adminId = req.body.id;

    try {
      const workspace = await WorkSpace.find({
        $or: [
          { assignedSpaceProvider: { $in: adminId }, approved: true },
          { category: category, approved: true, providerId: adminId },
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
    const providerId = req.params.adminId;

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
    const adminId = req.query.adminId;
  
    try {
      const user = await User.findById(adminId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
  
      const query = { _id: workspaceId };
      if (user.role.toLowerCase() !== "admin") {
        query.approved = true;
      }
  
      const workspace = await WorkSpace.findOne(query)
        .populate({
          path: "registeredClients",
          select: "profilePicture fullname _id",
        })
        .lean();
  
      if (!workspace) {
        return res.status(404).json({ message: "Workspace not found" });
      }
  
      return res.status(200).json({ workspace });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message: "Unexpected error while fetching the workspace",
      });
    }
  },

  getAllWorkspaces: async (req, res) => {
    try {
      const adminId = req.params.adminId || req.query.adminId;
      const user = await User.findById(adminId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
  
      const query = {};
      if (user.role.toLowerCase() !== "admin") {
        query.approved = true; // Non-admins only see approved workspaces
      }
  
      const workspaces = await WorkSpace.find(query)
        .populate({
          path: "registeredClients assignedSpaceProvider",
          select: "profilePicture fullname _id",
        })
        .lean();
  
      // Group workspaces by category
      const groupedWorkspaces = workspaces.reduce((acc, workspace) => {
        const category = workspace.category || "Uncategorized";
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(workspace);
        return acc;
      }, {});
  
      return res.status(200).json({
        message: "Workspaces fetched successfully",
        workspaces: groupedWorkspaces,
      });
    } catch (error) {
      console.error("Error fetching all workspaces:", error);
      return res.status(500).json({
        message: "Unexpected error while fetching all workspaces",
      });
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
      const adminId = req.params.adminId; // Authenticated user ID from params
      const user = await User.findById(adminId);
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
        location, 
      persons, 
      } = req.body;
  
      const file = req.files?.thumbnail;
      if (!file) {
        return res.status(400).json({ message: "Thumbnail image is required" });
      }
  
      const uploadedImage = await upload(file.tempFilePath);
  
      // Role-based logic
      const isAdmin = user.role.toLowerCase() === "admin";
      const approved = isAdmin; // true if admin, false otherwise (e.g., provider)
      const providerId = isAdmin ? null : adminId; // Providers use their own ID, admins leave it optional
  
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
        location, // Add location field
      persons: parseInt(persons), // Add persons field
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
        const adminId = req.params.adminId;
        const user = await User.findById(adminId);
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

        const categoryName = name.trim().toLowerCase().replace(/\s+/g, "-"); // Normalize category
        const existingCategory = await WorkspaceCategory.findOne({ name: categoryName });
        if (existingCategory) {
            return res.status(400).json({ message: "Category already exists" });
        }

        const newCategory = new WorkspaceCategory({
            name: categoryName,
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

  getUnapproved: async (req, res) => {
  try {
    const adminId = req.query.adminId;
    const user = await User.findById(adminId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    if (user.role.toLowerCase() !== "admin") {
      return res.status(403).json({ message: "Only admins can access this route" });
    }

    const workspaces = await WorkSpace.find({ approved: false })
      .populate({
        path: "registeredClients",
        select: "profilePicture fullname _id",
      })
      .lean();

    return res.status(200).json({ workspaces });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Unexpected error while fetching unapproved workspaces",
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

  disapproveWorkspace: async (req, res) => {
    const workspaceId = req.params.workspaceId;
    try {
      const workspace = await WorkSpace.findById(workspaceId);
  
      if (!workspace) {
        return res.status(404).json({ message: "Workspace not found" });
      }
  
      workspace.approved = false;
      await workspace.save();
  
      return res.status(200).json({ message: "Disapproved successfully" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Unexpected error during disapproval" });
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
        adminId: workspace.providerId,
      });

      if (workspace.fee > 0) {
        await Transaction.create({
          adminId: creator._id,
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
          adminId: workspace.providerId,
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
    const adminId = req.params.adminId;
  
    try {
      const user = await User.findById(adminId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
  
      const query = {
        $or: [{ registeredClients: adminId }, { "enrollments.user": adminId }],
      };
      if (user.role.toLowerCase() !== "admin") {
        query.approved = true;
      }
  
      const enrolledWorkspaces = await WorkSpace.find(query)
        .populate({
          path: "registeredClients",
          select: "profilePicture fullname _id",
        })
        .sort({ startDate: -1 })
        .lean();
  
      if (!enrolledWorkspaces || enrolledWorkspaces.length === 0) {
        return res.status(404).json({
          message: "No enrolled workspaces found for this user",
        });
      }
  
      return res.status(200).json({
        message: "Enrolled workspaces retrieved successfully",
        enrolledWorkspaces,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
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
      const adminId = req.params.adminId;
  
      const user = await User.findById(adminId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
  
      const category = [user.assignedWorkspace, ...user.otherWorkspace];
      const count = await WorkSpace.countDocuments();
  
      if (count === 0) {
        return res.status(404).json({ message: "No workspaces available" });
      }
  
      const query = { category: { $in: category } };
      if (user.role.toLowerCase() !== "admin") {
        query.approved = true;
      }
  
      const workspace = await WorkSpace.find(query).sort({ _id: -1 });
  
      const recommendedWorkspaces = await workspace
        .map((workspace) => {
          if (workspace.registeredClients.includes(adminId)) {
            return null;
          } else if (
            workspace.enrollments?.find(
              (client) => client.user?.toString() === adminId
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
  
      return res.status(200).json({
        workspaces: recommendedWorkspaces.filter(
          (workspace) =>
            workspace.audience.length === 0 || workspace.audience.includes(adminId)
        ),
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
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
        providerName,
        location,
        persons,
      } = req.body;
  
      let workspace = await WorkSpace.findById(id);
      if (!workspace) {
        return res.status(404).json({ message: "Workspace not found" });
      }
  
      if (req.files?.thumbnail) {
        const file = req.files.thumbnail;
        const uploadedImage = await upload(file.tempFilePath);
        workspace.thumbnail = {
          type: uploadedImage.resource_type,
          url: uploadedImage.secure_url,
        };
      }
  
      // Update fields (fix workSpaceTitle to title)
      workspace.title = title || workspace.title;
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
      workspace.providerName = providerName || workspace.providerName;
      workspace.location = location || workspace.location;
      workspace.persons = persons || workspace.persons;
  
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
          adminId: workspace.instructorId,
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
        adminId: workspace.providerId,
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
