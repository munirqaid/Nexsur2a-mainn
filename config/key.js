const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  key: process.env.JWT_SECRET 
};
