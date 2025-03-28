const express = require('express');
const workspaceController = require('../controllers/workspaceController');

const WorkspaceRoute = express.Router();

WorkspaceRoute.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to ExpertHub Workspace route" });
});

// Workspace routes (specific routes first)
WorkspaceRoute.get("/workspaces-by-provider", workspaceController.getWorkspacesByProvider); // Moved up
WorkspaceRoute.post("/category", workspaceController.getWorkspaceByCategory);
WorkspaceRoute.get("/category/creator", workspaceController.getSpaceProviderSpaces);
WorkspaceRoute.get("/approved-providers", workspaceController.getApprovedProviders);
WorkspaceRoute.get("/creator/:userId", workspaceController.getPlatformWorkspaces);
WorkspaceRoute.get("/default-workspaces", workspaceController.getDefaultWorkspaces);
WorkspaceRoute.get("/all", workspaceController.getAllWorkspaces);

// Workspace routes with dynamic parameters (after specific routes)
WorkspaceRoute.get("/:workspaceId", workspaceController.getWorkSpaceById); // Moved down

WorkspaceRoute.post("/add-workspace/:userId", workspaceController.addWorkSpace); // Removed duplicate

// Category routes
WorkspaceRoute.post("/category/:userId", workspaceController.addCategory);
WorkspaceRoute.delete("/delete/:categoryName/:userId", workspaceController.deleteCategory);
WorkspaceRoute.put("/update/:categoryName/:userId", workspaceController.updateCategory);

// Workspace enroll routes
WorkspaceRoute.get("/admissions/:workspaceId", workspaceController.getEnrolledClients);
WorkspaceRoute.post("/enroll/:workspaceId", workspaceController.enrollWorkspace);
WorkspaceRoute.post("/assign/:workspaceId", workspaceController.assignedSpaceProvider);

WorkspaceRoute.get("/enrolled-workspaces/:userId", workspaceController.getEnrolledWorkspaces);
// Get random courses
WorkspaceRoute.get("/recommended-workspaces/:userId", workspaceController.getRecommendedWorkspace);

// Get all workspaces with category
WorkspaceRoute.get("/all/category", workspaceController.getAllCategory);
WorkspaceRoute.delete("/delete/:id", workspaceController.deleteWorkspace);
WorkspaceRoute.put("/edit/:id", workspaceController.editWorkSpace);

WorkspaceRoute.get("/unapproved", workspaceController.getUnapproved);
WorkspaceRoute.put("/approve/:workspaceId", workspaceController.approveWorkspace);

// Upload video
WorkspaceRoute.put('/update-status/:workspaceId', workspaceController.updateStatus);
WorkspaceRoute.get('/renew/:workspaceId/:id', workspaceController.renewWorkspace);

module.exports = WorkspaceRoute;