import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './src/config/db.js';
import User from './src/models/User.js';
import Workspace from './src/models/Workspace.js';
import Board from './src/models/Board.js';

dotenv.config();

const seedData = async () => {
    try {
        await connectDB();
        console.log('Clearing database...');
        
        // Add seeding logic here
        
        console.log('Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedData();
