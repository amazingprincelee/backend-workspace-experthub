const { log } = require("handlebars");
const Transaction = require("../models/transactions.js");
const User = require("../models/user.js");
const axios = require("axios");

const flutterwaveSecretKey = process.env.FLUTTERWAVE_SECRET;
const flutterwaveBaseURL = 'https://api.flutterwave.com/v3/';

const transactionController = {
  getBalance: async (req, res) => {
    const { userId } = req.params;

    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).send('User not found');
      }

      const transactions = await Transaction.find({ userId: user._id });

      res.json({
        balance: user.balance,
        transactions,
        user: {
          bankCode: user.bankCode,
          accountNumber: user.accountNumber
        }
      });
    } catch (error) {
      res.status(500).send('Internal Server Error');
    }
  },

  getBanks: async (req, res) => {
    try {
      const response = await axios.get(`${flutterwaveBaseURL}banks/NG`, {
        headers: {
          Authorization: `Bearer ${flutterwaveSecretKey}`,
        },
      });
      // console.log(response)
      res.status(200).json({
        message: response.data.message,
        data: response.data.data
      });

    } catch (error) {
      console.error('Error during verification:', error.response ? error.response.data : error.message);
      res.status(500).send('Internal Server Error');
    }
  },

  verifyAccount: async (req, res) => {
    const { accountNumber, bankCode } = req.body
    try {
      const response = await axios.post(`${flutterwaveBaseURL}accounts/resolve`, {
        account_number: accountNumber,
        account_bank: bankCode,
      }, {
        headers: {
          Authorization: `Bearer ${flutterwaveSecretKey}`,
        },
      });
      // console.log(response.data.data)

      res.status(200).json({
        message: response.data.message,
        data: response.data.data.account_name
      });
      //   });

    } catch (error) {
      console.error('Error during verification:', error.response ? error.response.data : error.message);
      res.status(500).send('Internal Server Error');
    }
  },

  createRecipient: async (req, res) => {
    const { userId, bankCode, accountNumber } = req.body;
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).send('User not found');
      }

      const response = await axios.post(`${flutterwaveBaseURL}beneficiaries`, {
        account_bank: bankCode,
        account_number: accountNumber,
        currency: 'NGN',
        beneficiary_name: user.fullname,
      }, {
        headers: {
          Authorization: `Bearer ${flutterwaveSecretKey}`,
        },
      });

      // console.log(response.data.data)

      user.bankCode = bankCode;
      user.accountNumber = accountNumber
      await user.save();

      res.status(200).json({ message: 'Recipient created', recipientCode: user.flutterwaveRecipientCode });
    } catch (error) {
      console.error('Error creating recipient:', error.response ? error.response.data : error.message);
      res.status(500).send('Internal Server Error');
    }
  },

  withdraw: async (req, res) => {
    const { userId, amount } = req.body;

    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).send('User not found');
      }

      if (user.balance < amount) {
        return res.status(400).send('Insufficient balance');
      }

      const response = await axios.post(`${flutterwaveBaseURL}transfers`, {
        account_bank: user.bankCode,
        account_number: user.accountNumber, // You should store the user's account number
        amount,
        narration: 'Withdrawal',
        currency: 'NGN',
        reference: `tx-${Date.now()}`
      }, {
        headers: {
          Authorization: `Bearer ${flutterwaveSecretKey}`,
        },
      });

      // Deduct amount from user balance
      user.balance -= amount;
      await user.save();

      await Transaction.create({
        userId: user._id,
        soldBy: "",
        courseId: courseId,
        amount: amount,
        type: 'debit'
      })

      res.status(200).json({ message: 'Withdrawal successful' });
    } catch (error) {
      console.error('Error during withdrawal:', error.response ? error.response.data : error.message);
      res.status(500).send('Internal Server Error');
    }
  }
}


module.exports = transactionController;
