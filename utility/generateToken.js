const jwt = require('jsonwebtoken');
const tokenModel = require('../models/tokenModel');

const createAndStoreToken = async (userId, type = 'access') => {
  // Delete old tokens of this type for the user
  await tokenModel. updateMany({ user:userId, type },{ blacklisted: true });

  // Generate token payload
  const iat = Math.floor(Date.now() / 1000); // current time in seconds
  const exp = iat + 60 * 60 * 24; // expires in 1 day (adjust as needed)

  const payload = { sub: userId, iat, exp };
  const token = jwt.sign(payload, process.env.JWT_SECRET);

  // Store in DB
  const tokenDoc = await tokenModel.create({
    user:userId,
    token,
    iat,
    exp,
    type
  });

  return tokenDoc.token;
};

module.exports=createAndStoreToken;