const express = require('express');
const workspaceController = require('../controllers/workspaceController');

const WorkspaceRoute = express.Router();

WorkspaceRoute.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to ExpertHub Workspace route" });
 
  console.log(req.location);
  

});

// Workspace routes (specific routes first)
WorkspaceRoute.get("/workspaces-by-provider", workspaceController.getWorkspacesByProvider); 
WorkspaceRoute.get("/workspaces-by-client", workspaceController.getWorkspacesByClient);
WorkspaceRoute.post("/category", workspaceController.getWorkspaceByCategory);
WorkspaceRoute.get("/category/creator", workspaceController.getSpaceProviderSpaces);
WorkspaceRoute.get("/approved-providers", workspaceController.getApprovedProviders);
WorkspaceRoute.get("/creator/:userId", workspaceController.getPlatformWorkspaces);
WorkspaceRoute.get("/default-workspaces", workspaceController.getDefaultWorkspaces);
WorkspaceRoute.get("/all", workspaceController.getAllWorkspaces);

//workspace dashboard
WorkspaceRoute.get("/dashboard-stats", workspaceController.getDashAdminStats);
WorkspaceRoute.get("/provider-stats", workspaceController.getDashProviderStats);
WorkspaceRoute.get("/recommended", workspaceController.getRecommendedWorkspace);
WorkspaceRoute.get("/workspaces-by-provider-id/:providerId", workspaceController.getWorkspacesByProviderId);

WorkspaceRoute.get('/search-users-by-email', workspaceController.searchUsersByEmail);

// Workspace routes with dynamic parameters (after specific routes)
WorkspaceRoute.get("/:workspaceId", workspaceController.getWorkSpaceById); 

WorkspaceRoute.post("/add-workspace/:userId", workspaceController.addWorkSpace);

// Category routes
WorkspaceRoute.post("/category/:userId", workspaceController.addCategory);
WorkspaceRoute.delete("/delete/:categoryName/:userId", workspaceController.deleteCategory);
WorkspaceRoute.put("/update/:categoryName/:userId", workspaceController.updateCategory);

// Workspace enroll routes
WorkspaceRoute.get("/admissions/:workspaceId", workspaceController.getEnrolledClients);
WorkspaceRoute.post("/enroll/:workspaceId", workspaceController.enrollWorkspace);
WorkspaceRoute.post("/assign/:workspaceId", workspaceController.assignedSpaceProvider);

WorkspaceRoute.get("/enrolled-workspaces/:userId", workspaceController.getEnrolledWorkspaces);
// Get recommended workspace by locations
WorkspaceRoute.get("/recommendedworkspaces/:userId", workspaceController.getRecommendedWorkspace);


// Get all workspaces with category
WorkspaceRoute.get("/all/category", workspaceController.getAllCategory);
WorkspaceRoute.delete("/delete/:id", workspaceController.deleteWorkspace);
WorkspaceRoute.put("/edit/:id", workspaceController.editWorkSpace);

// New routes for team member management
// In workspaceRoutes.js

WorkspaceRoute.post('/assign-team-member/:workspaceId', workspaceController.assignTeamMember);
WorkspaceRoute.put('/update-team-member/:workspaceId', workspaceController.updateTeamMemberRole);
WorkspaceRoute.delete('/remove-team-member/:workspaceId/:userId', workspaceController.removeTeamMember);


WorkspaceRoute.get("/unapproved", workspaceController.getUnapproved);
WorkspaceRoute.put("/approve/:workspaceId", workspaceController.approveWorkspace);
WorkspaceRoute.put("/disapprove/:workspaceId", workspaceController.disapproveWorkspace);

// Upload video
WorkspaceRoute.put('/update-status/:workspaceId', workspaceController.updateStatus);
WorkspaceRoute.get('/renew/:workspaceId/:id', workspaceController.renewWorkspace);

//Client use to get the provider details of the work they enrolled into
WorkspaceRoute.get('/myproviders/:clientId', workspaceController.getMyProviders);

module.exports = WorkspaceRoute;