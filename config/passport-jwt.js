const passportJWT = require('passport-jwt');
const JwtStrategy = passportJWT.Strategy;
const ExtractJwt = passportJWT.ExtractJwt;
const dotenv = require('dotenv');
const User = require('../models/userModel');
const tokenModel = require('../models/tokenModel');
dotenv.config();

const options = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
};

module.exports = (passport) => {
  passport.use(
    new JwtStrategy(options, (jwtPayload, done) => {
      try {
       console.log("jwtPayload",jwtPayload)
        if (jwtPayload.sub) {
          return done(null, jwtPayload.sub);
        }
        return done(null, false);
      } catch (error) {
        return done(error, false);
      }
    })
  );
};
