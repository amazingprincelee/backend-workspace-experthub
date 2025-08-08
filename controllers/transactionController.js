const { log } = require("handlebars");
const Transaction = require("../models/transactions.js");
const User = require("../models/user.js");
const WorkSpace = require("../models/workspace.js");
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

      user.bankCode = bankCode;
      user.accountNumber = accountNumber
      await user.save();
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

      if (response.data.status === 'success') {
        // Deduct amount from user balance

        user.balance -= amount;
        await user.save();

        await Transaction.create({
          userId: user._id,
          amount: amount,
          type: 'debit'
        })

        return res.status(200).json({ message: 'Withdrawal successful' });
      }

      res.status(200).json({ message: response.data.message });
    } catch (error) {
      console.error('Error during withdrawal:', error.response ? error.response.data : error.message);
      res.status(500).send(error.response.data.message);
    }
  },

  addFunds: async (req, res) => {
    const { userId, amount } = req.body;
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).send('User not found');
      }

      user.balance += amount;
      await user.save();

      await Transaction.create({
        userId: user._id,
        amount: amount,
        type: 'credit'
      })

      return res.status(200).json({ message: 'Funds Added successfully' });
    } catch (error) {
      // console.error('Error during withdrawal:', error.response ? error.response.data : error.message);
      res.status(500).send(error.response.data.message);
    }
  },

  payWith: async (req, res) => {
    const { userId, amount } = req.body;
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).send('User not found');
      }
      if (user.balance < amount) {
        return res.status(400).send('Insufficient balance');
      }

      user.balance -= amount;
      await user.save();

      await Transaction.create({
        userId: user._id,
        amount: amount,
        type: 'debit'
      })
      
      return res.status(200).json({ message: 'Payment Made successfully' });

    } catch (error) {
      res.status(500).send(error.response.data.message);
    }
  },

  // Secure payment initialization endpoint
  initializePayment: async (req, res) => {
    const { userId, amount, currency = 'NGN' } = req.body;
    
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }

      const tx_ref = `tx-${Date.now()}-${userId}`;
      
      const paymentData = {
        tx_ref,
        amount,
        currency,
        redirect_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/wallet/payment-callback`,
        payment_options: 'card,mobilemoney,ussd',
        customer: {
          email: user.email,
          name: user.fullName || user.fullname,
          phone_number: user.phone || ''
        },
        customizations: {
          title: 'ExpertHub Wallet Funding',
          description: 'Add funds to your wallet',
          logo: ''
        }
      };

      const response = await axios.post(`${flutterwaveBaseURL}payments`, paymentData, {
        headers: {
          Authorization: `Bearer ${flutterwaveSecretKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status === 'success') {
        return res.status(200).json({
          status: 'success',
          data: {
            link: response.data.data.link,
            tx_ref
          }
        });
      } else {
        return res.status(400).json({ error: 'Payment initialization failed' });
      }

    } catch (error) {
      console.error('Payment initialization error:', error.response ? error.response.data : error.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Verify payment and add funds
  verifyPayment: async (req, res) => {
    const { tx_ref, transaction_id } = req.body;
    
    try {
      const response = await axios.get(`${flutterwaveBaseURL}transactions/${transaction_id}/verify`, {
        headers: {
          Authorization: `Bearer ${flutterwaveSecretKey}`
        }
      });

      if (response.data.status === 'success' && response.data.data.status === 'successful') {
        const { amount, customer, tx_ref: verifiedTxRef } = response.data.data;
        
        // Extract userId from tx_ref
        const userId = verifiedTxRef.split('-')[2];
        
        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        // Check if transaction already processed
        const existingTransaction = await Transaction.findOne({ 
          reference: verifiedTxRef,
          type: 'credit'
        });
        
        if (existingTransaction) {
          return res.status(400).json({ error: 'Transaction already processed' });
        }

        // Add funds to user balance
        user.balance += amount;
        await user.save();

        // Create transaction record
        await Transaction.create({
          userId: user._id,
          amount: amount,
          type: 'credit',
          reference: verifiedTxRef,
          status: 'successful'
        });

        return res.status(200).json({ 
          message: 'Payment verified and funds added successfully',
          balance: user.balance
        });
      } else {
        return res.status(400).json({ error: 'Payment verification failed' });
      }

    } catch (error) {
      console.error('Payment verification error:', error.response ? error.response.data : error.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Initialize payment for course enrollment
  initializeCoursePayment: async (req, res) => {
    const { userId, courseId, amount, currency = 'NGN' } = req.body;
    
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }

      const tx_ref = `course-${Date.now()}-${userId}-${courseId}`;
      
      const paymentData = {
        tx_ref,
        amount,
        currency,
        redirect_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/courses/payment-callback`,
        payment_options: 'card,mobilemoney,ussd',
        customer: {
          email: user.email,
          name: user.fullName || user.fullname,
          phone_number: user.phone || ''
        },
        customizations: {
          title: 'ExpertHub Course Enrollment',
          description: 'Course enrollment payment',
          logo: ''
        }
      };

      const response = await axios.post(`${flutterwaveBaseURL}payments`, paymentData, {
        headers: {
          Authorization: `Bearer ${flutterwaveSecretKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status === 'success') {
        return res.status(200).json({
          status: 'success',
          data: {
            link: response.data.data.link,
            tx_ref
          }
        });
      } else {
        return res.status(400).json({ error: 'Payment initialization failed' });
      }

    } catch (error) {
      console.error('Course payment initialization error:', error.response ? error.response.data : error.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Verify course payment and process enrollment
  verifyCoursePayment: async (req, res) => {
    const { tx_ref, transaction_id } = req.body;
    
    try {
      const response = await axios.get(`${flutterwaveBaseURL}transactions/${transaction_id}/verify`, {
        headers: {
          Authorization: `Bearer ${flutterwaveSecretKey}`
        }
      });

      if (response.data.status === 'success' && response.data.data.status === 'successful') {
        const { amount, customer, tx_ref: verifiedTxRef } = response.data.data;
        
        // Extract userId and courseId from tx_ref
        const txParts = verifiedTxRef.split('-');
        const userId = txParts[2];
        const courseId = txParts[3];
        
        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        // Check if transaction already processed
        const existingTransaction = await Transaction.findOne({ 
          reference: verifiedTxRef,
          type: 'debit'
        });
        
        if (existingTransaction) {
          return res.status(400).json({ error: 'Transaction already processed' });
        }

        // Create transaction record for course payment
        await Transaction.create({
          userId: user._id,
          courseId: courseId,
          amount: amount,
          type: 'debit',
          reference: verifiedTxRef,
          status: 'successful'
        });

        return res.status(200).json({ 
          message: 'Course payment verified successfully',
          courseId: courseId
        });
      } else {
        return res.status(400).json({ error: 'Payment verification failed' });
      }

    } catch (error) {
      console.error('Course payment verification error:', error.response ? error.response.data : error.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Initialize payment for workspace booking
  initializeWorkspacePayment: async (req, res) => {
    const { userId, workspaceId, amount, currency = 'NGN' } = req.body;
    
    try {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }

      const tx_ref = `workspace-${Date.now()}-${userId}-${workspaceId}`;
      
      const paymentData = {
        tx_ref,
        amount,
        currency,
        redirect_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reservation/payment-callback`,
        payment_options: 'card,mobilemoney,ussd',
        customer: {
          email: user.email,
          name: user.fullName || user.fullname,
          phone_number: user.phone || ''
        },
        customizations: {
          title: 'ExpertHub Workspace Booking',
          description: 'Workspace reservation payment',
          logo: ''
        }
      };

      const response = await axios.post(`${flutterwaveBaseURL}payments`, paymentData, {
        headers: {
          Authorization: `Bearer ${flutterwaveSecretKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status === 'success') {
        return res.status(200).json({
          status: 'success',
          data: {
            link: response.data.data.link,
            tx_ref
          }
        });
      } else {
        return res.status(400).json({ error: 'Payment initialization failed' });
      }

    } catch (error) {
      console.error('Workspace payment initialization error:', error.response ? error.response.data : error.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Verify workspace payment and process booking
  verifyWorkspacePayment: async (req, res) => {
    const { tx_ref, transaction_id } = req.body;
    
    try {
      const response = await axios.get(`${flutterwaveBaseURL}transactions/${transaction_id}/verify`, {
        headers: {
          Authorization: `Bearer ${flutterwaveSecretKey}`
        }
      });

      if (response.data.status === 'success' && response.data.data.status === 'successful') {
        const { amount, customer, tx_ref: verifiedTxRef } = response.data.data;
        
        // Extract userId and workspaceId from tx_ref
        const txParts = verifiedTxRef.split('-');
        const userId = txParts[2];
        const workspaceId = txParts[3];
        
        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        // Check if transaction already processed
        const existingTransaction = await Transaction.findOne({ 
          reference: verifiedTxRef,
          type: 'debit'
        });
        
        if (existingTransaction) {
          return res.status(400).json({ error: 'Transaction already processed' });
        }

        // Find the workspace
        const workspace = await WorkSpace.findById(workspaceId);
        if (!workspace) {
          return res.status(404).json({ error: 'Workspace not found' });
        }

        // Check if user is already enrolled
        if (!workspace.registeredClients.includes(userId)) {
          // Enroll user in workspace
          workspace.registeredClients.push(userId);
          workspace.enrollments.push({
            user: userId,
            status: "active",
            enrolledOn: new Date()
          });
          await workspace.save();
        }

        // Create transaction record for workspace payment
        await Transaction.create({
          userId: user._id,
          workspaceId: workspaceId,
          amount: amount,
          type: 'debit',
          reference: verifiedTxRef,
          status: 'successful'
        });

        return res.status(200).json({ 
          message: 'Workspace payment verified and booking confirmed successfully',
          workspaceId: workspaceId,
          enrolled: true
        });
      } else {
        return res.status(400).json({ error: 'Payment verification failed' });
      }

    } catch (error) {
      console.error('Workspace payment verification error:', error.response ? error.response.data : error.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}


module.exports = transactionController;
