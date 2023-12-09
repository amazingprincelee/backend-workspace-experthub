import passport from "passport";
import mongoose from "mongoose";
import passportLocalMongoose from "passport-local-mongoose";
import findOrCreate from 'mongoose-findorcreate';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

const trainingProviderSchema = new mongoose.Schema ({
    fullName: String,
    email: String,
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
      },
});

trainingProviderSchema.plugin(passportLocalMongoose);
trainingProviderSchema.plugin(findOrCreate);

// Update model name from "Applicant" to "TrainingProvider"
const TrainingProvider = new mongoose.model("TrainingProvider", trainingProviderSchema);

passport.use(TrainingProvider.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    TrainingProvider.findById(id)
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

        TrainingProvider.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

export default TrainingProvider;
