const SubscriptionPlan = require("../models/subscriptionPlan.js");

const subscriptionPlanController = {
  // Create a new subscription plan
  createPlan: async (req, res) => {
    try {
      const { name, description, monthlyFee, yearlyFee, features } = req.body;
      if (!name) {
        return res.status(400).json({ message: "Plan name is required" });
      }
      const existing = await SubscriptionPlan.findOne({ name });
      if (existing) {
        return res.status(400).json({ message: "Plan name already exists" });
      }
      const plan = new SubscriptionPlan({ name, description, monthlyFee, yearlyFee, features });
      await plan.save();
      return res.status(201).json({ message: "Subscription plan created", plan });
    } catch (error) {
      console.error("Error creating plan:", error);
      return res.status(500).json({ message: "Unexpected error while creating plan" });
    }
  },

  // Get all subscription plans
  getAllPlans: async (req, res) => {
    try {
      const plans = await SubscriptionPlan.find().lean();
      return res.status(200).json({ plans });
    } catch (error) {
      console.error("Error fetching plans:", error);
      return res.status(500).json({ message: "Unexpected error while fetching plans" });
    }
  },

  // Get a single plan by ID
  getPlanById: async (req, res) => {
    try {
      const { planId } = req.params;
      const plan = await SubscriptionPlan.findById(planId);
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }
      return res.status(200).json({ plan });
    } catch (error) {
      console.error("Error fetching plan:", error);
      return res.status(500).json({ message: "Unexpected error while fetching plan" });
    }
  },

  // Update a plan
  updatePlan: async (req, res) => {
    try {
      const { planId } = req.params;
      const { name, description, monthlyFee, yearlyFee, features } = req.body;
      const plan = await SubscriptionPlan.findById(planId);
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }
      if (name) plan.name = name;
      if (description) plan.description = description;
      if (monthlyFee !== undefined) plan.monthlyFee = monthlyFee;
      if (yearlyFee !== undefined) plan.yearlyFee = yearlyFee;
      if (features) plan.features = features;
      plan.updatedAt = Date.now();
      await plan.save();
      return res.status(200).json({ message: "Plan updated", plan });
    } catch (error) {
      console.error("Error updating plan:", error);
      return res.status(500).json({ message: "Unexpected error while updating plan" });
    }
  },

  // Delete a plan
  deletePlan: async (req, res) => {
    try {
      const { planId } = req.params;
      const plan = await SubscriptionPlan.findByIdAndDelete(planId);
      if (!plan) {
        return res.status(404).json({ message: "Plan not found" });
      }
      return res.status(200).json({ message: "Plan deleted" });
    } catch (error) {
      console.error("Error deleting plan:", error);
      return res.status(500).json({ message: "Unexpected error while deleting plan" });
    }
  }
};

module.exports = subscriptionPlanController;