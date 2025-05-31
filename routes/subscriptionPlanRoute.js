const express = require("express");
const router = express.Router();
const subscriptionPlanController = require("../controllers/subscriptionPlanController.js");

// Create a new subscription plan
router.post("/", subscriptionPlanController.createPlan);

// Get all subscription plans
router.get("/", subscriptionPlanController.getAllPlans);

// Get a single subscription plan by ID
router.get("/:planId", subscriptionPlanController.getPlanById);

// Update a subscription plan
router.put("/:planId", subscriptionPlanController.updatePlan);

// Delete a subscription plan
router.delete("/:planId", subscriptionPlanController.deletePlan);

module.exports = router;