import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import User from '../models/User.model';
import AuditLog from '../models/AuditLog.model';
import { logAction } from '../utils/logger';

export const getUsers = async (req: AuthRequest, res: Response) => {
    try {
        const users = await User.find({ isActive: true }, 'id email name role isBlocked createdAt');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const { role, isBlocked, name } = req.body;
        const adminId = req.user!.userId;

        const updatedUser = await User.findByIdAndUpdate(
            id,
            { role, isBlocked, name },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        await logAction('UPDATE_USER', adminId, `User updated: ${id} - Role: ${role}, Blocked: ${isBlocked}`, req.ip);

        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const adminId = req.user!.userId;

        await User.findByIdAndUpdate(id, { isActive: false });
        await logAction('DELETE_USER', adminId, `User soft deleted: ${id}`, req.ip);

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const getAuditLogs = async (req: AuthRequest, res: Response) => {
    try {
        const logs = await AuditLog.find().populate('userId', 'name email').sort({ timestamp: -1 });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
};
export const getAssignees = async (req: AuthRequest, res: Response) => {
    try {
        const admins = await User.find({ role: { $in: ['ADMIN', 'SUPER_ADMIN'] }, isActive: true }, 'id name email role');
        res.json(admins);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
};
