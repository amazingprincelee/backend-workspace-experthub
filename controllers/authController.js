const bcrypt = require("bcryptjs");
const User = require("../models/user.js");
const Location = require("../models/location.js");
const axios = require("axios");
const {
  generateVerificationCode,
} = require("../utils/verficationCodeGenerator.js");
const { sendVerificationEmail } = require("../utils/nodeMailer.js");
const determineRole = require("../utils/determinUserType.js");
// const { default: axios } = require("axios");
const jwt = require('jsonwebtoken');
require("dotenv").config();

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

const verificationCode = generateVerificationCode();

const authControllers = {
  register: async (req, res) => {
    try {
      const {
        userType,
        fullname,
        companyName,
        email,
        phone,
        country,
        state,
        address,
        contact,
        password,
      } = req.body;
  
      const lowercasedUserType = userType.toLowerCase();
      const role = determineRole(lowercasedUserType);
  
      const alreadyExistingUser = await User.findOne({
        email: email.toLowerCase(),
      });
  
      if (alreadyExistingUser) {
        return res.status(400).json({ message: "User already registered" });
      }
  
      const hashPassword = bcrypt.hashSync(password, 10);
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit code
  
      const newUser = new User({
        username: email.toLowerCase(),
        email: email.toLowerCase(),
        fullname,
        companyName: companyName || "",
        phone,
        country,
        state,
        address,
        role,
        verificationCode,
        contact,
        password: hashPassword,
      });
  
      await newUser.save();
  
      // Geocode the address and create a Location document if address is provided
      if (address && address.trim() !== "") {
        try {
          const geocodeResponse = await axios.get("https://maps.googleapis.com/maps/api/geocode/json", {
            params: {
              address: address,
              key: GOOGLE_MAPS_API_KEY,
            },
          });
  
          if (geocodeResponse.data.status === "OK") {
            const { lat, lng } = geocodeResponse.data.results[0].geometry.location;
            const coordinates = [lng, lat];
  
            let stateFromGeocode = state || "";
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
              { userId: newUser._id },
              {
                userId: newUser._id,
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
  
            // Update the User with the Location reference and geocoded state
            newUser.location = newLocation._id;
            newUser.state = stateFromGeocode;
            newUser.address = fullAddress; // Update address with the standardized format
            await newUser.save();
          } else {
            console.warn(`Geocoding failed for address "${address}" during registration for user ${newUser._id}`);
          }
        } catch (error) {
          console.error(`Error geocoding address during registration for user ${newUser._id}:`, error.message);
        }
      }
  
      console.log("Registered user:", newUser);
  
      // Uncomment if you need to sync with an external API
      // await axios.post(`${process.env.PEOPLES_POWER_API}/api/v5/auth/sync`, {
      //   email,
      //   name: fullname,
      //   country,
      //   state,
      //   userType,
      //   password: hashPassword,
      // });
  
      await sendVerificationEmail(newUser.email, verificationCode);
      res.status(200).json({ message: "Verification code sent to email", id: newUser._id });
    } catch (error) {
      console.error("Error during registration:", error);
      return res.status(500).json({ message: "Unexpected error during registration" });
    }
  },

  sync: async (req, res) => {
    try {
      const {
        email,
        fullname,
        country,
        state,
        userType,
        password,
        companyName,
        address, // Add address to destructured fields
      } = req.body;
  
      const lowercasedUserType = userType.toLowerCase();
      const role = determineRole(lowercasedUserType);
  
      // Update user with provided fields
      const updateData = {
        fullname,
        country,
        state,
        role,
      };
  
      // Only update password if provided
      if (password) {
        updateData.password = bcrypt.hashSync(password, 10);
      }
  
      // Only update companyName if provided
      if (companyName !== undefined) {
        updateData.companyName = companyName;
      }
  
      // Only update address if provided
      if (address !== undefined) {
        updateData.address = address;
      }
  
      const user = await User.findOneAndUpdate(
        { email: email.toLowerCase() },
        updateData,
        { new: true }
      );
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Geocode the address and update the Location document if address is provided
      if (address && address.trim() !== "") {
        try {
          const geocodeResponse = await axios.get("https://maps.googleapis.com/maps/api/geocode/json", {
            params: {
              address: address,
              key: GOOGLE_MAPS_API_KEY,
            },
          });
  
          if (geocodeResponse.data.status === "OK") {
            const { lat, lng } = geocodeResponse.data.results[0].geometry.location;
            const coordinates = [lng, lat];
  
            let stateFromGeocode = state || "";
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
  
            // Update the Location document
            await Location.findOneAndUpdate(
              { userId: user._id },
              {
                userId: user._id,
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
  
            // Update the User with the geocoded state and standardized address
            await User.findByIdAndUpdate(user._id, {
              state: stateFromGeocode,
              address: fullAddress,
            });
          } else {
            console.warn(`Geocoding failed for address "${address}" during sync for user ${user._id}`);
          }
        } catch (error) {
          console.error(`Error geocoding address during sync for user ${user._id}:`, error.message);
        }
      }
  
      console.log(`User synced: ${email}`);
      res.status(200).json({ message: "User synced successfully" });
    } catch (error) {
      console.error("Error during user sync:", error);
      return res.status(500).json({ message: "Unexpected error during sync" });
    }
  },

  login: async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }
    console.log(email);

    const user = await User.findOne({ email: email.toLowerCase() });
    // console.log(user);

    if (!user) {
      return res.status(401).json({ message: "Incorrect Email or Password!" });
    }

    if (user.blocked) {
      return res.status(401).json({ message: "User Blocked!" });
    }

    // Password matching
    const isMatch = bcrypt.compareSync(password, user.password ?? "");

    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect Email or Password" });
    }

    // generate jwt
    const payload = {
      fullName: user.fullname,
      id: user._id, // Use tutorId for team_member
      email: user.email,
      role: user.role,
      emailVerification: user.isVerified,
      profilePicture: user.profilePicture,
    };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });


    res.status(201).json({
      message: "Successfully logged in",
      accessToken,
      user: {
        fullName: user.fullname,
        id: user._id,
        email: user.email,
        role: user.role,
        emailVerification: user.isVerified,
        assignedCourse: user.assignedCourse,
        profilePicture: user.image,
        otherCourse: user.otherCourse,
      },
    });

  },

  loginWithToken: async (req, res) => {
    const { accessToken } = req.body;

    jwt.verify(accessToken, process.env.JWT_SECRET, async (err, user) => {
      if (err) {
        return res.sendStatus(403); // Forbidden
      }
      const theUser = await User.findOne({ email: user.email.toLowerCase() });
      if (!theUser) {
        return res.sendStatus(403);
      }
      return res.status(201).json({
        message: "Successfully logged in",
        accessToken,
        user: {
          fullName: theUser.fullname,
          id: theUser._id,
          email: theUser.email,
          role: theUser.role,
          emailVerification: theUser.isVerified,
          assignedCourse: theUser.assignedCourse,
          profilePicture: theUser.image,
          otherCourse: user.otherCourse,
        },
      });
    });

  },

  logout: (req, res) => {
    res.status(200).json({ message: "successfully signed out" });
  },

  // Verify
  verify: async (req, res) => {
    try {
      const { verifyCode } = req.body;

      const userId = req.params.userId;

      // Query the user database to get the user's role
      const user = await User.findById(userId);
      // Check if the user is authenticated
      // if (!req.isAuthenticated()) {
      //   return res.status(401).json({ message: 'Unauthorized' });
      // }

      // Check if the verification code matches the one in the database
      if (user.verificationCode !== verifyCode) {
        return res.status(400).json({ message: "Invalid verification code" });
      }

      // Update user's verification status
      user.isVerified = true;
      user.verificationCode = null; //clear the code after successful verification
      await user.save();

      // Return information to populate dashboard
      return res.status(201).json({
        message: "Successfully Registered a Student",
        user: {
          fullName: user.fullname,
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Unexpected error during verification" });
    }
  },

  forgotPassword: async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).send({
        message: "An account with " + req.body.email + " does not exist!",
      });

    try {
      await sendVerificationEmail(user.email, verificationCode);
      // console.log(verificationCode)
      user.verificationCode = verificationCode;
      await user.save();

      res.json({
        message: "Code sent to " + email,
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Unexpected error during verification" });
    }
  },

  resetPassword: async (req, res) => {
    const { password, verificationCode } = req.body;
    const user = await User.findOne({
      verificationCode,
    });

    if (!user) {
      return res.status(400).send({
        message: "Invalid OTP code ",
      });
    }

    try {
      const newHash = bcrypt.hashSync(password);
      user.password = newHash;
      user.verificationCode = null;
      await user.save();

      res.json({
        message: "Password reset successfully",
      });
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ message: "Unexpected error during verification" });
    }
  },

  addTeamMember: async (req, res) => {
    try {
      const { ownerId, tutorId, privileges } = req.body;

      // Check if owner exists and is a tutor
      const owner = await User.findById(ownerId);
      if (!owner) {
        return res.status(404).json({ message: "Owner not found or invalid role" });
      }

      // Check if the tutor exists
      const tutor = await User.findById(tutorId);
      if (!tutor) {
        return res.status(400).json({ message: "Tutor not found" });
      }

      // Ensure teamMembers array exists
      owner.teamMembers = owner.teamMembers || [];
      tutor.teamMembers = tutor.teamMembers || [];

      // Check if the tutor is already added by this owner
      const isAlreadyAdded = owner.teamMembers.some(
        (member) => member?.tutorId?.toString() === tutorId.toString()
      );

      if (isAlreadyAdded) {
        return res.status(400).json({ message: "Tutor has already been added by this owner" });
      }

      // Add the team member to both the tutor's and owner's records
      const newMember = { privileges, ownerId, tutorId };

      owner.teamMembers.push(newMember);
      tutor.teamMembers.push(newMember);

      await owner.save();
      await tutor.save();

      res.status(201).json({
        success: true,
        message: "Team member added successfully",
      });
    } catch (error) {
      console.error("Error adding team member:", error);
      res.status(500).json({ message: "Unexpected error during team member addition" });
    }
  },

  editPrivileges: async (req, res) => {
    try {
      const { ownerId, tutorId, newPrivileges } = req.body;

      // Check if the owner exists and is a tutor
      const owner = await User.findById(ownerId);
      if (!owner || owner.role !== 'tutor') {
        return res.status(404).json({ message: "Owner not found or invalid role" });
      }

      // Check if the tutor exists
      const tutor = await User.findById(tutorId);
      if (!tutor) {
        return res.status(400).json({ message: "Tutor not found" });
      }

      // Check if the tutor is a team member of the owner
      const tutorMember = tutor.teamMembers.find(
        (member) => member.ownerId.toString() === ownerId.toString()
      );
      const ownerMember = owner.teamMembers.find(
        (member) => member.tutorId.toString() === tutorId.toString()
      );

      if (!tutorMember || !ownerMember) {
        return res.status(404).json({ message: "Team member relationship not found" });
      }

      // Update privileges for both owner and tutor
      tutorMember.privileges = newPrivileges;
      ownerMember.privileges = newPrivileges;

      await tutor.save();
      await owner.save();

      res.status(200).json({
        success: true,
        message: "Privileges updated successfully",
      });
    } catch (error) {
      console.error("Error editing privileges:", error);
      res.status(500).json({ message: "Unexpected error during privilege update" });
    }
  },
};

module.exports = authControllers;
