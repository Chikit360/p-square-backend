require('dotenv').config(); // Load environment variables from .env file
const mongoose = require('mongoose');
const User = require('./models/userModel');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI,)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Function to seed the first user
const seedFirstUser = async () => {
    try {
        // Check if a user already exists
        const existingUser = await User.findOne();
        if (existingUser) {
            console.log('First user already exists.');
            return;
        }

        // Create the first user
        const firstUser = new User({
            username: 'admin',
            email: 'admin@example.com',
            password: 'adminPassword', // Plain text password (will be hashed by pre-save middleware)
            role: 'pharmacy_manager'
        });

        // Save the first user
        await firstUser.save();

        console.log('First user created successfully.');
    } catch (error) {
        console.error('Error seeding first user:', error);
    } finally {
        // Close the database connection
        mongoose.disconnect();
    }
};

// Seed the first user
seedFirstUser();
