import dotenv from 'dotenv';
import http from 'http';
import app from './app.js';
import connectDB from './src/config/db.js';
import { initSocket } from './src/config/socket.js';

dotenv.config();

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Connect to Database and start server
connectDB()
    .then(() => {
        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Failed to connect to MongoDB', err);
        process.exit(1);
    });
