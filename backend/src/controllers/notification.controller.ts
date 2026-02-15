
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Notification from '../models/Notification.model';

export const getNotifications = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const notifications = await Notification.find({ recipient: userId }).sort({ createdAt: -1 }).limit(20);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id;
        const userId = req.user!.userId;

        const notification = await Notification.findOneAndUpdate(
            { _id: id, recipient: userId },
            { read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const deleteNotification = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id;
        const userId = req.user!.userId;

        await Notification.findOneAndDelete({ _id: id, recipient: userId });
        res.json({ message: 'Notification deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
};
