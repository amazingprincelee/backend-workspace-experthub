import passport from "passport";
import mongoose from "mongoose";
import passportLocalMongoose from "passport-local-mongoose";
import findOrCreate from 'mongoose-findorcreate';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';




const userSchema = new mongoose.Schema ({
    username: String,
    fullname: String,
    phone: Number,
    country: String,
    state: String,
    address: String,
    password: String,
    role: String,
    googleId: String,
    survey: {
      computerAccess: Boolean,
      internetAccess: Boolean,
      gender: String,
      employmentStatus: String,
      trainingHours: String,
      age: String,
      preferedCourse: String,
      yearsOfExperience: String,
      currentEducation: String,
      joiningAccomplishment: String,
    },

    aptitudeTest: {
      willDadicate6Hours: String,
      describeSelf: String,
      personality: String,
      doForFun: String,
    },
    
  });
  
  userSchema.plugin(passportLocalMongoose);
  userSchema.plugin(findOrCreate);
  
  const User = new mongoose.model("User", userSchema);
  
  passport.use(User.createStrategy());
  
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id)
      .exec()
      .then(user => {
        done(null, user);
      })
      .catch(err => {
        done(err, null);
      });
  });

  passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

  export default User;