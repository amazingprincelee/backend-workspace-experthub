
const mongoose = require('mongoose');
const WorkSpace = require("../models/workspace.js");
const User = require("../models/user.js");
const Location = require("../models/location.js");
const axios = require("axios");
const WorkspaceCategory = require("../models/workspaceCategory.js");
const WorkspaceType = require("../models/workspaceType.js");
const { upload } = require("../config/cloudinary.js");
const Notification = require("../models/workspaceNotification.js");
const Transaction = require("../models/transactions.js");
const dayjs = require("dayjs");
const isBetween = require("dayjs/plugin/isBetween.js");
const isSameOrAfter = require("dayjs/plugin/isSameOrAfter.js");

dayjs.extend(isBetween);
dayjs.extend(isSameOrAfter);

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// const categories = ["Virtual Assistant", "Product Management", "Cybersecurity", "Software Development", "AI / Machine Learning", "Data Analysis & Visualisation", "Story Telling", "Animation", "Cloud Computing", "Dev Ops", "UI/UX Design", "Journalism", "Game development", "Data Science", "Digital Marketing", "Advocacy"]

const workspaceController = {

  getMyProviders: async (req, res) => {
    try {
      // Get client ID from route parameters
      const clientId = req.params.clientId;

      // Validate clientId
      if (!clientId || !mongoose.Types.ObjectId.isValid(clientId)) {
        return res.status(400).json({ message: "Valid client ID is required" });
      }

      // Verify the requesting user matches the clientId (from JWT)
      if (req.user._id !== clientId) {
        return res.status(403).json({ message: "Unauthorized: You can only access your own providers" });
      }

      // Verify the user exists and is a client
      const client = await User.findById(clientId);
      if (!client) {
        return res.status(404).json({ message: "Client account not found" });
      }
      if (client.role.toLowerCase() !== "client") {
        return res.status(403).json({ message: "Only clients can access this endpoint" });
      }

      // Find workspaces where the client is enrolled
      const workspaces = await WorkSpace.find({
        registeredClients: clientId,
        approved: true, // Only include approved workspaces
      })
        .select("providerId title") // Select only necessary fields
        .populate({
          path: "providerId",
          select: "fullname email phone companyName profilePicture _id",
        })
        .lean();

      if (!workspaces || workspaces.length === 0) {
        return res.status(200).json({
          message: "No enrolled workspaces found",
          providers: [],
        });
      }

      // Extract unique providers
      const providerMap = new Map();
      workspaces.forEach((workspace) => {
        if (workspace.providerId) {
          providerMap.set(workspace.providerId._id.toString(), {
            id: workspace.providerId._id,
            fullname: workspace.providerId.fullname || "N/A",
            email: workspace.providerId.email || "N/A",
            phone: workspace.providerId.phone || "N/A",
            companyName: workspace.providerId.companyName || "N/A",
            profilePicture: workspace.providerId.profilePicture || "",
            workspaces: [
              ...(providerMap.get(workspace.providerId._id.toString())?.workspaces || []),
              { workspaceId: workspace._id, title: workspace.title },
            ],
          });
        }
      });

      const providers = Array.from(providerMap.values());

      return res.status(200).json({
        message: "Providers retrieved successfully",
        providers,
      });
    } catch (error) {
      console.error("Error fetching providers:", error);
      return res.status(500).json({
        message: "Unexpected error while fetching providers",
      });
    }
  },


  getAllCategory: async (req, res) => {
    try {
      const categories = await WorkspaceCategory.find({ isActive: true })
        .populate('workspaceType', 'name')
        .lean();
      if (!categories || categories.length === 0) {
        return res.status(200).json({ categories: [] });
      }
  
      return res.status(200).json({
        categories: categories.map(cat => ({
          _id: cat._id,
          name: cat.name,
          workspaceType: cat.workspaceType,
        })),
      });
    } catch (error) {
      console.error("Error fetching categories:", error);
      return res.status(500).json({
        message: "Unexpected error while fetching categories",
      });
    }
  },

  // Get categories by workspace type
  getCategoriesByWorkspaceType: async (req, res) => {
    try {
      const { workspaceTypeId } = req.params;
      
      if (!mongoose.Types.ObjectId.isValid(workspaceTypeId)) {
        return res.status(400).json({ message: "Invalid workspace type ID" });
      }

      const categories = await WorkspaceCategory.find({ 
        workspaceType: workspaceTypeId, 
        isActive: true 
      })
        .populate('workspaceType', 'name')
        .lean();

      return res.status(200).json({
        categories: categories.map(cat => ({
          _id: cat._id,
          name: cat.name,
          workspaceType: cat.workspaceType,
        })),
      });
    } catch (error) {
      console.error("Error fetching categories by workspace type:", error);
      return res.status(500).json({
        message: "Unexpected error while fetching categories",
      });
    }
  },

  // Workspace Type Controllers
  getAllWorkspaceTypes: async (req, res) => {
    try {
      const workspaceTypes = await WorkspaceType.find({ isActive: true }).lean();
      if (!workspaceTypes || workspaceTypes.length === 0) {
        return res.status(200).json({ workspaceTypes: [] });
      }
  
      return res.status(200).json({
        workspaceTypes: workspaceTypes.map(type => ({
          _id: type._id,
          name: type.name,
          description: type.description,
        })),
      });
    } catch (error) {
      console.error("Error fetching workspace types:", error);
      return res.status(500).json({
        message: "Unexpected error while fetching workspace types",
      });
    }
  },

  addWorkspaceType: async (req, res) => {
    try {
      const { name, description } = req.body;
  
      if (!name || name.trim() === "") {
        return res.status(400).json({
          message: "Workspace type name is required",
        });
      }
  
      // Check if workspace type already exists
      const existingType = await WorkspaceType.findOne({ 
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
      });
  
      if (existingType) {
        return res.status(400).json({
          message: "Workspace type already exists",
        });
      }
  
      const newWorkspaceType = new WorkspaceType({
        name: name.trim(),
        description: description?.trim() || ""
      });
  
      await newWorkspaceType.save();
  
      return res.status(201).json({
        message: "Workspace type added successfully",
        workspaceType: {
          _id: newWorkspaceType._id,
          name: newWorkspaceType.name,
          description: newWorkspaceType.description
        }
      });
    } catch (error) {
      console.error("Error adding workspace type:", error);
      return res.status(500).json({
        message: "Unexpected error while adding workspace type",
      });
    }
  },

  updateWorkspaceType: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;
  
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          message: "Invalid workspace type ID",
        });
      }
  
      if (!name || name.trim() === "") {
        return res.status(400).json({
          message: "Workspace type name is required",
        });
      }
  
      // Check if another workspace type with the same name exists
      const existingType = await WorkspaceType.findOne({ 
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        _id: { $ne: id }
      });
  
      if (existingType) {
        return res.status(400).json({
          message: "Workspace type with this name already exists",
        });
      }
  
      const updatedType = await WorkspaceType.findByIdAndUpdate(
        id,
        { 
          name: name.trim(),
          description: description?.trim() || ""
        },
        { new: true }
      );
  
      if (!updatedType) {
        return res.status(404).json({
          message: "Workspace type not found",
        });
      }
  
      return res.status(200).json({
        message: "Workspace type updated successfully",
        workspaceType: {
          _id: updatedType._id,
          name: updatedType.name,
          description: updatedType.description
        }
      });
    } catch (error) {
      console.error("Error updating workspace type:", error);
      return res.status(500).json({
        message: "Unexpected error while updating workspace type",
      });
    }
  },

  deleteWorkspaceType: async (req, res) => {
    try {
      const { id } = req.params;
  
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          message: "Invalid workspace type ID",
        });
      }
  
      const deletedType = await WorkspaceType.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
      );
  
      if (!deletedType) {
        return res.status(404).json({
          message: "Workspace type not found",
        });
      }
  
      return res.status(200).json({
        message: "Workspace type deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting workspace type:", error);
      return res.status(500).json({
        message: "Unexpected error while deleting workspace type",
      });
    }
  },

  getDashAdminStats: async (req, res) => {
    try {
      const { adminId } = req.query;
  
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
  
      // Total number of workspaces
      const totalWorkspaces = await WorkSpace.countDocuments();
      // Number of running workspaces (approved)
      const runningWorkspaces = await WorkSpace.countDocuments({ approved: true });
      // Number of workspaces pending approval
      const pendingWorkspaces = await WorkSpace.countDocuments({ approved: false });
      // Total number of clients
      const totalClients = await User.countDocuments({ role: "client" });
      // Total number of subscriptions (total enrollments across all workspaces)
      const workspaces = await WorkSpace.find({}).lean();
      const totalSubscriptions = workspaces.reduce((acc, workspace) => {
        return acc + (workspace.registeredClients?.length || 0);
      }, 0);
      // Total number of workspace providers
      const totalProviders = await User.countDocuments({ role: "provider" });
  
      return res.status(200).json({
        message: "Dashboard stats retrieved successfully",
        data: {
          totalWorkspaces,
          runningWorkspaces,
          pendingWorkspaces,
          totalClients,
          totalSubscriptions,
          totalProviders,
        },
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      return res.status(500).json({ message: "Server error" });
    }
  },



  getDashProviderStats: async (req, res) => {
    try {
        const { providerId } = req.query;

     
        

        if (!providerId) {
            return res.status(400).json({ message: "Provider ID is required" });
        }

        // Verify the provider exists
        const provider = await User.findById(providerId);
        if (!provider) {
            return res.status(404).json({ message: "Provider account not found" });
        }

        if (provider.role.toLowerCase() !== "provider") {
            return res.status(403).json({ message: "Only providers can access this endpoint" });
        }

        // Get total number of workspaces created by the provider
        const totalWorkspaces = await WorkSpace.countDocuments({ providerId });

        
        

        // Get total number of clients across all workspaces owned by the provider
        const workspaces = await WorkSpace.find({ providerId }).select("registeredClients enrollments assignedSpaceProvider");

        const totalClients = workspaces.reduce((sum, workspace) => sum + workspace.registeredClients.length, 0);

        // Get total number of subscriptions (enrollments across all workspaces)
        const totalSubscriptions = workspaces.reduce((sum, workspace) => sum + workspace.enrollments.length, 0);

        // Get total number of workspaces this provider has been assigned to
        const totalNumbersOfWorkspaceAssignedTo = await WorkSpace.countDocuments({ assignedSpaceProvider: providerId });

        

        return res.status(200).json({
            message: "Dashboard stats retrieved successfully",
            data: {
                totalWorkspaces,
                totalClients,
                totalSubscriptions,
                totalNumbersOfWorkspaceAssignedTo,
            },
        });
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return res.status(500).json({ message: "Server error" });
    }
},

// In workspaceController.js
getWorkspacesByProviderId: async (req, res) => {
  try {
    const userId = req.params.userId;

    console.log("Fetching workspaces for userId:", userId); // Debug log
    console.log("Request user:", req.user); // Debug log

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Verify the requesting user matches the userId (from JWT)
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized: You can only access your own workspaces" });
    }

    // Verify the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User account not found" });
    }
    console.log("User role:", user.role); // Debug log

    // Fetch workspaces where the user is the provider OR assigned as a space provider
    const workspaces = await WorkSpace.find({
      $or: [
        { providerId: userId },
        { assignedSpaceProvider: userId },
      ],
    })
      .select("_id title")
      .lean();

    console.log("Found workspaces:", workspaces); // Debug log

    if (!workspaces || workspaces.length === 0) {
      return res.status(200).json({
        message: "No workspaces found for this user",
        workspaces: [],
      });
    }

    return res.status(200).json({
      message: "Workspaces retrieved successfully",
      workspaces,
    });
  } catch (error) {
    console.error("Error fetching workspaces by provider ID:", error);
    return res.status(500).json({ message: "Unexpected error while fetching workspaces" });
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
      const categoryId = req.params.categoryId;
      const adminId = req.params.userId;
      const user = await User.findById(adminId);

      if (!user || user.role.toLowerCase() !== "admin") {
        return res.status(403).json({ message: "Only admins can delete categories" });
      }

      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }

      // Soft delete by setting isActive to false
      const category = await WorkspaceCategory.findByIdAndUpdate(
        categoryId,
        { isActive: false },
        { new: true }
      );
      
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
      const categoryId = req.params.categoryId;
      const adminId = req.params.userId; 
      const user = await User.findById(adminId);

      if (!user || user.role.toLowerCase() !== "admin") {
        return res.status(403).json({ message: "Only admins can update categories" });
      }

      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }

      const { name, workspaceType } = req.body;
      if (!name) {
        return res.status(400).json({ message: "Category name is required" });
      }

      const category = await WorkspaceCategory.findById(categoryId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      // If workspaceType is being updated, validate it exists
      if (workspaceType && workspaceType !== category.workspaceType.toString()) {
        if (!mongoose.Types.ObjectId.isValid(workspaceType)) {
          return res.status(400).json({ message: "Invalid workspace type ID" });
        }
        
        const workspaceTypeExists = await WorkspaceType.findById(workspaceType);
        if (!workspaceTypeExists) {
          return res.status(400).json({ message: "Workspace type not found" });
        }
      }

      const newWorkspaceType = workspaceType || category.workspaceType;
      
      // Check if the new name already exists within the same workspace type (excluding current category)
      const existingCategory = await WorkspaceCategory.findOne({ 
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        workspaceType: newWorkspaceType,
        _id: { $ne: categoryId }
      });
      if (existingCategory) {
        return res.status(400).json({ message: "Category name already exists in this workspace type" });
      }

      category.name = name.trim();
      if (workspaceType) {
        category.workspaceType = workspaceType;
      }
      
      const updatedCategory = await category.save();
      await updatedCategory.populate('workspaceType', 'name');

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
    const userId = req.params.userId;
  
    try {
      // Fetch user to determine their role
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      const userRole = user.role?.toLowerCase();
  
      if (userRole === "client") {
        // Clients see only approved workspaces
        const approvedWorkspaces = await WorkSpace.find({ approved: true })
          .populate({
            path: "registeredClients",
            select: "profilePicture fullname _id",
          })
          .lean();
  
        return res.status(200).json({ workspaces: approvedWorkspaces });
      } else if (userRole === "provider") {
        // Providers see only their own workspaces (both approved and pending)
        const [approvedWorkspaces, unapprovedWorkspaces] = await Promise.all([
          WorkSpace.find({ 
            approved: true,
            $or: [
              { providerId: userId },
              { assignedSpaceProvider: userId }
            ]
          })
            .populate({
              path: "registeredClients",
              select: "profilePicture fullname _id",
            })
            .lean(),
          WorkSpace.find({ 
            approved: false,
            $or: [
              { providerId: userId },
              { assignedSpaceProvider: userId }
            ]
          })
            .populate({
              path: "registeredClients",
              select: "profilePicture fullname _id",
            })
            .lean(),
        ]);
  
        return res.status(200).json({
          approvedWorkspaces,
          unapprovedWorkspaces,
        });
      } else if (userRole === "admin") {
        // Admins see all workspaces (both approved and unapproved)
        const [approvedWorkspaces, unapprovedWorkspaces] = await Promise.all([
          WorkSpace.find({ approved: true })
            .populate({
              path: "registeredClients",
              select: "profilePicture fullname _id",
            })
            .lean(),
          WorkSpace.find({ approved: false })
            .populate({
              path: "registeredClients",
              select: "profilePicture fullname _id",
            })
            .lean(),
        ]);
  
        return res.status(200).json({
          approvedWorkspaces,
          unapprovedWorkspaces,
        });
      } else {
        return res.status(403).json({ message: "Unauthorized access" });
      }
    } catch (error) {
      console.error("Error fetching workspaces:", error);
      return res.status(500).json({ message: "Unexpected error while fetching workspaces" });
    }
  },


  
  getWorkSpaceById: async (req, res) => {
  const workspaceId = req.params.workspaceId;
  const adminId = req.query.adminId;

  console.log("I got hit o");

  try {
    let isAdmin = false;

    if (adminId) {
      const user = await User.findById(adminId);
      if (user && user.role.toLowerCase() === "admin") {
        isAdmin = true;
      }
    }

    const query = { _id: workspaceId };
    if (!isAdmin) {
      query.approved = true;
    }

    const workspace = await WorkSpace.findOne(query)
      .populate({
        path: "registeredClients",
        select: "profilePicture fullname _id",
      })
      .lean();

    // If category is an ObjectId, populate it to get the category name
    if (workspace && workspace.category && mongoose.Types.ObjectId.isValid(workspace.category)) {
      const categoryDoc = await WorkspaceCategory.findById(workspace.category).select('name').lean();
      if (categoryDoc) {
        workspace.category = categoryDoc.name;
      }
    }

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
      const userId = req.params.userId;
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
        providerName,
        address,
        state,
        city,
        country,
        persons,
      } = req.body;

      

      console.log({
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
  address,
  state,
  city,
  country,
  persons,
});
      
  
      // Validate required fields
      if (!title || !address || !persons) {
        return res.status(400).json({ message: "Title, address, and persons are required" });
      }
  
      const file = req.files?.thumbnail;
      if (!file) {
        return res.status(400).json({ message: "Thumbnail image is required" });
      }
  
      const uploadedImage = await upload(file.tempFilePath);
  
      
      const isAdmin = user.role.toLowerCase() === "admin";
      const approved = isAdmin;
      
      // Determine the correct providerId
      let providerId = userId; // Default to the user creating the workspace
      
      // If admin is creating workspace for a specific provider, find that provider's ID
      if (isAdmin && providerName) {
        const assignedProvider = await User.findOne({ fullname: providerName, role: "provider" });
        if (assignedProvider) {
          providerId = assignedProvider._id;
        } else {
          return res.status(400).json({ message: "Specified provider not found" });
        }
      };

      // Get provider details for workspace
      let workspaceProviderName = user.fullname;
      let workspaceProviderImage = user.profilePicture || "";
      
      if (isAdmin && providerName) {
        const assignedProvider = await User.findById(providerId);
        if (assignedProvider) {
          workspaceProviderName = assignedProvider.fullname;
          workspaceProviderImage = assignedProvider.profilePicture || "";
        }
      }
      
      const newWorkspace = new WorkSpace({
        title,
        providerName: workspaceProviderName,
        providerImage: workspaceProviderImage,
        thumbnail: {
          type: uploadedImage.resource_type,
          url: uploadedImage.secure_url,
        },
        category,
        privacy,
        about,
        state,
        address,
        city,
        country,
        providerId: providerId,
        duration,
        type,
        startDate,
        endDate,
        startTime,
        endTime,
        workDuration,
        fee,
        strikedFee,
        approved,
        persons: parseInt(persons),
      });
  
      const savedWorkspace = await newWorkspace.save();

      const workspaceId = savedWorkspace._id
  
      // Geocode the location to get coordinates and create a Location document
      let locationDoc;
      if (address && address.trim() !== "") {
        try {
          const geocodeResponse = await axios.get("https://maps.googleapis.com/maps/api/geocode/json", {
            params: {
              address: `${address}, ${state || country || "Nigeria"}`,
              key: GOOGLE_MAPS_API_KEY,
            },
          });
  
          if (geocodeResponse.data.status === "OK") {
            const { lat, lng } = geocodeResponse.data.results[0].geometry.location;
            const coordinates = [lng, lat];
  
            let stateFromGeocode = user.state || "";
            let city = "";
            for (const component of geocodeResponse.data.results[0].address_components) {
              if (component.types.includes("administrative_area_level_1")) {
                stateFromGeocode = component.long_name;
              }
              if (component.types.includes("locality")) {
                city = component.long_name;
              }
            }
  
            const fullAddress = geocodeResponse.data.results[0].formatted_address;


  
            // Create or update the Location document
            const newLocation = await Location.findOneAndUpdate(
              { workspaceId: workspaceId },
              {
                workspaceId: workspaceId,
                location: {
                  type: "Point",
                  coordinates,
                },
                selectedLocation: {
                  fullAddress,
                  state: stateFromGeocode,
                  city,
                },
              },
              { upsert: true, new: true }
            );

            // Update the workspace with the Location reference and geocoded data
            savedWorkspace.location = newLocation._id;
            savedWorkspace.state = stateFromGeocode || state;
            savedWorkspace.city = city || savedWorkspace.city;
            savedWorkspace.address = fullAddress; // Update address with the standardized format

            await savedWorkspace.save();
            
            locationDoc = newLocation;

            console.log(savedWorkspace);
            
  

          } else {
            console.warn(`Geocoding failed for address "${address}" for workspace by user ${userId}`);
            return res.status(400).json({ message: "Failed to geocode address" });
          }
          
        } catch (error) {
          console.error(`Error geocoding address for workspace by user ${userId}:`, error.message);
          return res.status(500).json({ message: "Error processing address", error: error.message });
        }
      } else {
        return res.status(400).json({ message: "Address is required and cannot be empty" });
      }
  
      
  
      
      const notifications = [];
  
      
      notifications.push({
        title: "Workspace Created",
        content: `You have successfully created the workspace "${savedWorkspace.title}".`,
        contentId: savedWorkspace._id,
        userId: user._id,
        read: false,
      });
  
      // If the user is an admin and specified a providerName, notify the provider
      if (isAdmin && providerName) {
        const provider = await User.findOne({ fullname: providerName, role: "provider" });
        if (provider) {
          notifications.push({
            title: "New Workspace Assigned",
            content: `A new workspace "${savedWorkspace.title}" has been created for you by ${user.fullname}.`,
            contentId: savedWorkspace._id,
            userId: provider._id,
            read: false,
          });
        }
      }
  
      // If the user is a provider (not an admin), notify all admins
      if (!isAdmin) {
        const admins = await User.find({ role: "admin" }).lean();
        if (admins && admins.length > 0) {
          const adminNotifications = admins.map((admin) => ({
            title: "New Workspace Created",
            content: `A new workspace "${savedWorkspace.title}" has been created by ${user.fullname} and is awaiting approval.`,
            contentId: savedWorkspace._id,
            userId: admin._id,
            read: false,
          }));
          notifications.push(...adminNotifications);
        }
      }
  
      // Create all notifications
      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
  
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
        const adminId = req.params.userId;
        const user = await User.findById(adminId);
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        if (user.role.toLowerCase() !== "admin") {
            return res.status(403).json({ message: "Only admins can add categories" });
        }

        const { name, workspaceType } = req.body;

        if (!name || !workspaceType) {
            return res.status(400).json({ message: "Category name and workspace type are required" });
        }

        // Validate workspace type exists
        if (!mongoose.Types.ObjectId.isValid(workspaceType)) {
            return res.status(400).json({ message: "Invalid workspace type ID" });
        }

        const workspaceTypeExists = await WorkspaceType.findById(workspaceType);
        if (!workspaceTypeExists) {
            return res.status(400).json({ message: "Workspace type not found" });
        }

        const categoryName = name.trim();
        
        // Check if category already exists within the same workspace type
        const existingCategory = await WorkspaceCategory.findOne({ 
            name: { $regex: new RegExp(`^${categoryName}$`, 'i') },
            workspaceType: workspaceType 
        });
        if (existingCategory) {
            return res.status(400).json({ message: "Category already exists in this workspace type" });
        }

        const newCategory = new WorkspaceCategory({
            name: categoryName,
            workspaceType: workspaceType,
        });

        const savedCategory = await newCategory.save();
        await savedCategory.populate('workspaceType', 'name');

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
    
      if (workspace.registeredClients.includes(id)) {
        return res
          .status(400)
          .json({ message: "Client is already enrolled in the course" });
      }

      
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
    console.log("Request received:", req.params, req.body); // Debug log
    const workspaceId = req.params.workspaceId;
    const { id } = req.body;
  
    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
      return res.status(400).json({ message: "Invalid workspace ID" });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid provider ID" });
    }
  
    try {
      const workspace = await WorkSpace.findById(workspaceId);
      const user = await User.findById(id);
  
      console.log("User:", user);
      console.log("Workspace:", workspace);
  
      if (!workspace) {
        return res.status(404).json({ message: "Workspace not found" });
      }
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      if (workspace.assignedSpaceProvider.includes(id)) {
        await workspace.updateOne(
          { _id: workspace._id },
          { $pull: { assignedSpaceProvider: id } }
        );
        return res
          .status(200)
          .json({ message: "Space Provider is unassigned from this workspace" });
      } else {
        workspace.assignedSpaceProvider.push(id);
        workspace.contact = false;
        await workspace.save();
  
        await Notification.create({
          title: "Provider Assigned",
          content: `${user.fullName} was assigned to your workspace ${workspace.title}`,
          contentId: workspace._id,
          userId: workspace.providerId,
        });
  
        return res.status(200).json({ message: "Assigned successfully" });
      }
    } catch (error) {
      console.error("Error in assignedSpaceProvider:", error);
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


  getRecommendedWorkspace: async (req, res) => {
    try {
      const userId = req.params.userId;
  
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
  
      
      const userLocation = await Location.findOne({ userId });
      if (!userLocation || userLocation.location.coordinates.every(coord => coord === 0)) {
        return res.status(404).json({ message: "User location not set. Please update your location." });
      }
  
      const clientCoordinates = userLocation.location.coordinates;
  
      // Step 2: Count total approved workspaces
      const totalWorkspaces = await WorkSpace.countDocuments({ approved: true });
      if (totalWorkspaces === 0) {
        return res.status(404).json({ message: "No approved workspaces available" });
      }
  
      // Step 3: Get query parameters for flexibility
      const maxDistance = parseInt(req.query.maxDistance) || 50000; // Default to 50km in meters
      const limit = parseInt(req.query.limit) || 5; // Default to 5 workspaces
  
      // Validate maxDistance and limit
      if (maxDistance < 1000 || maxDistance > 100000) {
        return res.status(400).json({ message: "maxDistance must be between 1km and 100km" });
      }
      if (limit < 1 || limit > 10) {
        return res.status(400).json({ message: "limit must be between 1 and 10" });
      }
  
      // Step 4: Fetch workspaces near the client's location, sorted by distance
      const workspaces = await WorkSpace.aggregate([
        {
          $match: { approved: true },
        },
        {
          $lookup: {
            from: "locations", 
            localField: "location",
            foreignField: "_id",
            as: "workspaceLocation",
          },
        },
        {
          $unwind: "$workspaceLocation",
        },
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: clientCoordinates,
            },
            distanceField: "distance", // Adds distance in meters to each document
            maxDistance: maxDistance, // Flexible distance range
            spherical: true,
            key: "workspaceLocation.location",
          },
        },
        {
          $project: {
            title: 1,
            providerName: 1,
            category: 1,
            fee: 1,
            distance: { $divide: ["$distance", 1000] }, // Convert distance from meters to kilometers
            
          },
        },
        {
          $limit: limit, 
        },
      ]);
  
     
      if (!workspaces || workspaces.length === 0) {
        return res.status(404).json({ message: `No approved workspaces found within ${maxDistance / 1000}km` });
      }
  
      // Step 6: Return the recommended workspaces with distances in kilometers
      res.status(200).json({
        workspace: workspaces,
        totalNearby: workspaces.length,
        maxDistanceApplied: maxDistance / 1000, 
      });
    } catch (error) {
      console.error("Error in getRecommendedWorkspace:", error);
      res.status(500).json({
        message: "Unexpected error while fetching recommended workspaces",
        details: error.message,
      });
    }
  },

  // getRecommendedWorkspace: async (req, res) => {
  //   try {
  //     // Step 1: Count total workspaces
  //     const totalWorkspaces = await WorkSpace.countDocuments();
  //     if (totalWorkspaces === 0) {
  //       return res.status(404).json({ message: "No workspaces available" });
  //     }
  
  //     // Step 2: Fetch all approved workspaces
  //     const query = { approved: true };
  //     const workspaces = await WorkSpace.find(query);
  
  //     // Step 3: Check if there are any approved workspaces
  //     if (!workspaces || workspaces.length === 0) {
  //       return res.status(404).json({ message: "No approved workspaces available" });
  //     }
  
  //     // Step 4: Select multiple random workspaces (e.g., up to 3)
  //     const numberOfRecommendations = Math.min(workspaces.length, 3); // Limit to 3 or available workspaces
  //     const shuffledWorkspaces = workspaces.sort(() => 0.5 - Math.random()); // Shuffle array
  //     const recommendedWorkspaces = shuffledWorkspaces.slice(0, numberOfRecommendations);
  
  //     // Step 5: Return the recommended workspaces as an array
  //     return res.status(200).json({
  //       workspace: recommendedWorkspaces, // Return array instead of single object
  //     });
  //   } catch (error) {
  //     console.error("Error in getRecommendedWorkspace:", error);
  //     return res.status(500).json({
  //       message: "Unexpected error while fetching recommended workspaces",
  //     });
  //   }
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

  //team members functions

  assignTeamMember: async (req, res) => {
        const workspaceId = req.params.workspaceId;
        const { userId, role } = req.body;

        console.log("user id is", userId);

        res.status(200).json({message: "Successfully Assigned Team member"})
        

    },

    updateTeamMemberRole: async (req, res) => {
        const workspaceId = req.params.workspaceId;
        const { userId, role } = req.body;

        try {
            if (!mongoose.Types.ObjectId.isValid(workspaceId) || !mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({ message: "Invalid workspace ID or user ID" });
            }

            const workspace = await WorkSpace.findById(workspaceId);

            if (!workspace) {
                return res.status(404).json({ message: "Workspace not found" });
            }

            if (workspace.providerId.toString() !== req.user._id) {
                return res.status(403).json({ message: "Only the workspace provider can update team member roles" });
            }

            const teamMember = workspace.teamMembers.find(member => member.userId.toString() === userId);
            if (!teamMember) {
                return res.status(404).json({ message: "Team member not found" });
            }

            // Update role and privileges
            teamMember.role = role;
            if (role === 'Admin') {
                teamMember.privileges = { canCreate: true, canEdit: true, canDelete: true };
            } else if (role === 'Editor') {
                teamMember.privileges = { canCreate: true, canEdit: true, canDelete: false };
            } else if (role === 'Viewer') {
                teamMember.privileges = { canCreate: false, canEdit: false, canDelete: false };
            } else {
                return res.status(400).json({ message: "Invalid role specified" });
            }

            await workspace.save();

            await Notification.create({
                title: "Team Member Role Updated",
                content: `Your role has been updated to ${role} for the workspace "${workspace.title}"`,
                contentId: workspace._id,
                userId: userId,
            });

            return res.status(200).json({ message: "Team member role updated successfully", workspace });
        } catch (error) {
            console.error("Error updating team member role:", error);
            return res.status(500).json({ message: "Unexpected error while updating team member role" });
        }
    },

    removeTeamMember: async (req, res) => {
        const workspaceId = req.params.workspaceId;
        const userId = req.params.userId;

        try {
            if (!mongoose.Types.ObjectId.isValid(workspaceId) || !mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({ message: "Invalid workspace ID or user ID" });
            }

            const workspace = await WorkSpace.findById(workspaceId);

            if (!workspace) {
                return res.status(404).json({ message: "Workspace not found" });
            }

            if (workspace.providerId.toString() !== req.user._id) {
                return res.status(403).json({ message: "Only the workspace provider can remove team members" });
            }

            const teamMemberIndex = workspace.teamMembers.findIndex(member => member.userId.toString() === userId);
            if (teamMemberIndex === -1) {
                return res.status(404).json({ message: "Team member not found" });
            }

            workspace.teamMembers.splice(teamMemberIndex, 1);
            await workspace.save();

            await Notification.create({
                title: "Team Member Removed",
                content: `You have been removed from the workspace "${workspace.title}"`,
                contentId: workspace._id,
                userId: userId,
            });

            return res.status(200).json({ message: "Team member removed successfully", workspace });
        } catch (error) {
            console.error("Error removing team member:", error);
            return res.status(500).json({ message: "Unexpected error while removing team member" });
        }
    },

    // In workspaceController.js
searchUsersByEmail: async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Search for users with matching email (case-insensitive)
    const users = await User.find({ email: { $regex: new RegExp(email, 'i') } })
      .select("_id fullname email")
      .lean();

    if (!users || users.length === 0) {
      return res.status(200).json({ message: "No users found", users: [] });
    }

    return res.status(200).json({ message: "Users retrieved successfully", users });
  } catch (error) {
    console.error("Error searching users by email:", error);
    return res.status(500).json({ message: "Unexpected error while searching users" });
  }
},

};

module.exports = workspaceController;