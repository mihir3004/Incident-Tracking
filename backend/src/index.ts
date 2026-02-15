import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { initSocket } from './utils/socket';
import connectDB from './config/db';
import authRoutes from './routes/auth.routes';
import incidentRoutes from './routes/incident.routes';
import userRoutes from './routes/user.routes';
import notificationRoutes from './routes/notification.routes';

const app = express();
const httpServer = createServer(app);

const io = initSocket(httpServer);

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

import jwt from 'jsonwebtoken';

io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authentication error'));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
        socket.data.user = decoded;
        next();
    } catch (err) {
        next(new Error('Authentication error'));
    }
});

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id, socket.data.user?.userId);

    if (socket.data.user) {
        const { userId, role } = socket.data.user;

        // Join user-specific room
        socket.join(`room:user:${userId}`);

        // Join admin room if applicable
        if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
            socket.join('room:admins');
        }
    }

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

connectDB();

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export { app };
