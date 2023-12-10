import passport from "passport";
import mongoose from "mongoose";
import passportLocalMongoose from "passport-local-mongoose";
import findOrCreate from 'mongoose-findorcreate';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';




const applicantSchema = new mongoose.Schema ({
    username: String,
    fullname: String,
    phone: Number,
    country: String,
    state: String,
    address: String,
    password: String,
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
    
  });
  
  applicantSchema.plugin(passportLocalMongoose);
  applicantSchema.plugin(findOrCreate);
  
  const Applicant = new mongoose.model("Applicant", applicantSchema);
  
  passport.use(Applicant.createStrategy());
  
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    Applicant.findById(id)
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

    Applicant.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

  export default Applicant;