require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const helmet = require('helmet');
const passportJWT = require('./config/passport-jwt');
const userRouter = require('./routes/user.router');
const medicineRouter = require('./routes/medicine.router');
const stockRouter = require('./routes/stock.router');
const inventoryRouter = require('./routes/inventory.router');
const authMiddleware = require('./middlewares/auth.middleware');
const errorMiddleware = require('./middlewares/error.middleware');

const app = express();

// Security with Helmet
app.use(helmet());

// Enable CORS
app.use(cors());

// Middleware for parsing JSON bodies
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// Enable File Uploads
app.use(fileUpload());

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
}));

// Passport Initialization
app.use(passport.initialize());
app.use(passport.session());

// Configure Passport JWT
passportJWT(passport);

// Load environment variables
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

// Database connection
mongoose.connect(MONGO_URI,)
  .then(() => {
    console.log('MongoDB connected');
    // Start the server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(err => console.log('MongoDB connection error:', err));

// Mount the user router on /users path
app.use('/users', userRouter);

// Mount the medicine router on /medicines path
app.use('/medicines', authMiddleware.verifyToken, medicineRouter);


app.use('/stocks', authMiddleware.verifyToken, stockRouter);

// app.use('/inventories', authMiddleware.verifyToken, inventoryRouter);
app.use('/inventories', inventoryRouter);

// Error handling middleware
app.use(errorMiddleware);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

module.exports = app;
