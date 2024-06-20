const Transaction = require("../models/transactions.js");
const User = require("../models/user.js");

const transactionController = {
  getBalance: async (req, res) => {
    const { userId } = req.params;

    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).send('User not found');
      }

      const transactions = await Transaction.find({ userId: user._id }).populate('courseId');

      res.json({
        balance: user.balance,
        transactions,
      });
    } catch (error) {
      res.status(500).send('Internal Server Error');
    }
  }
}


module.exports = transactionController;
