import dotenv from 'dotenv';
import http from 'http';
import app from './app.js';
import connectDB from './src/config/db.js';
import { initSocket } from './src/config/socket.js';
import { startDueChecker } from './src/utils/dueChecker.js';

dotenv.config();

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

initSocket(server);

connectDB()
    .then(() => {
        server.listen(PORT, () => {
            startDueChecker();
        });
    })
    .catch((err) => {
        console.error('Failed to connect to MongoDB', err);
        process.exit(1);
    });
