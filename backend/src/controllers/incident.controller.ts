import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Incident from '../models/Incident.model';
import Notification from '../models/Notification.model';
import { logAction } from '../utils/logger';
import { getIO } from '../utils/socket';

export const createIncident = async (req: AuthRequest, res: Response) => {
    try {
        const { title, description, category, priority } = req.body;
        const userId = req.user!.userId;

        let evidenceUrl = req.body.evidenceUrl;
        if ((req as any).file) {
            evidenceUrl = `/uploads/${(req as any).file.filename}`;
        }

        const incident = await Incident.create({
            title,
            description,
            category,
            priority,
            evidenceUrl,
            userId,
        });

        await logAction('CREATE_INCIDENT', userId, `Incident created: ${incident._id}`, req.ip);


        await Notification.create({
            recipient: userId,
            title: 'Incident Reported',
            message: `Your incident "${title}" has been reported successfully.`,
            type: 'SUCCESS',
            relatedId: incident._id
        });

        getIO().to('room:admins').emit('incidentUpdate', { type: 'NEW_INCIDENT', incident });

        res.status(201).json(incident);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const getIncidents = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.userId;
        const role = req.user!.role;

        let incidents;
        if (role === 'USER') {
            incidents = await Incident.find({ userId, isActive: true }).populate('userId', 'name email');
        } else {
            incidents = await Incident.find({ isActive: true }).populate('userId', 'name email');
        }

        res.json(incidents);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const updateIncident = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const { status, priority, assignedTo } = req.body;
        const userId = req.user!.userId;
        const role = req.user!.role;

        if (role === 'USER') {
            return res.status(403).json({ message: 'Users cannot update incident status' });
        }


        const updateData: any = { status, priority, assignedTo };
        if (status === 'RESOLVED') {
            updateData.resolvedAt = new Date();
        }

        const updatedIncident = await Incident.findOneAndUpdate(
            { _id: id, isActive: true },
            updateData,
            { new: true, runValidators: true }
        ).populate('userId', 'name email');

        if (!updatedIncident) {
            return res.status(404).json({ message: 'Incident not found' });
        }

        await logAction('UPDATE_INCIDENT', userId, `Incident updated: ${id}`, req.ip);

        if (assignedTo && assignedTo !== updatedIncident.userId.toString()) {
            await Notification.create({
                recipient: assignedTo,
                title: 'New Assignment',
                message: `You have been assigned to incident "${updatedIncident.title}".`,
                type: 'INFO',
                relatedId: updatedIncident._id
            });
            getIO().to(`room:user:${assignedTo}`).emit('incidentUpdate', { ...updatedIncident.toObject(), type: 'ASSIGNMENT' });
        }

        await Notification.create({
            recipient: updatedIncident.userId,
            title: 'Incident Updated',
            message: `Your incident "${updatedIncident.title}" status has been updated to ${status}.`,
            type: 'INFO',
            relatedId: updatedIncident._id
        });

        getIO().to(`room:user:${updatedIncident.userId}`).emit('incidentUpdate', updatedIncident);
        getIO().to('room:admins').emit('incidentUpdate', { type: 'UPDATE', incident: updatedIncident });

        res.json(updatedIncident);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const deleteIncident = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const userId = req.user!.userId;
        const role = req.user!.role;

        if (role !== 'SUPER_ADMIN') {
            return res.status(403).json({ message: 'Only Super Admin can delete incidents' });
        }

        await Incident.findByIdAndUpdate(id, { isActive: false });
        await logAction('DELETE_INCIDENT', userId, `Incident soft deleted: ${id}`, req.ip);
        getIO().to('room:admins').emit('incidentUpdate', { type: 'DELETE', incidentId: id });

        res.json({ message: 'Incident deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
};
export const bulkAction = async (req: AuthRequest, res: Response) => {
    try {
        const { ids, action, payload } = req.body;
        const userId = req.user!.userId;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'No incidents selected' });
        }

        if (action === 'RESOLVE') {
            await Incident.updateMany(
                { _id: { $in: ids }, isActive: true },
                { status: 'RESOLVED', resolvedAt: new Date() }
            );

            await logAction('BULK_RESOLVE', userId, `Bulk resolved ${ids.length} incidents`, req.ip);

            ids.forEach(id => {
                getIO().to(`room:user:${userId}`).emit('incidentUpdate', { status: 'RESOLVED', _id: id });
            });
            getIO().to('room:admins').emit('incidentUpdate', { type: 'BULK_UPDATE', ids, status: 'RESOLVED' });

        } else if (action === 'ASSIGN') {
            if (!payload?.assignedTo) {
                return res.status(400).json({ message: 'Assignee required for assignment' });
            }

            await Incident.updateMany(
                { _id: { $in: ids }, isActive: true },
                { assignedTo: payload.assignedTo, status: 'IN_PROGRESS' }
            );

            await logAction('BULK_ASSIGN', userId, `Bulk assigned ${ids.length} incidents to ${payload.assignedTo}`, req.ip);
            const notifications = ids.map(id => ({
                recipient: payload.assignedTo,
                title: 'New Assignment',
                message: `You have been assigned to an incident via bulk action.`,
                type: 'INFO',
                relatedId: id
            }));
            await Notification.insertMany(notifications);

            getIO().to(`room:user:${payload.assignedTo}`).emit('incidentUpdate', { type: 'BULK_ASSIGNMENT', count: ids.length });
            getIO().to('room:admins').emit('incidentUpdate', { type: 'BULK_UPDATE', ids, assignedTo: payload.assignedTo });
        }

        res.json({ message: 'Bulk action completed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
};

export const getAnalytics = async (req: AuthRequest, res: Response) => {
    try {
        const totalIncidents = await Incident.countDocuments({ isActive: true });
        const openIncidents = await Incident.countDocuments({ status: 'OPEN', isActive: true });
        const resolvedIncidents = await Incident.countDocuments({ status: 'RESOLVED', isActive: true });

        const categoryStats = await Incident.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);

        const priorityStats = await Incident.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$priority', count: { $sum: 1 } } }
        ]);

        const resolutionStats = await Incident.aggregate([
            { $match: { status: 'RESOLVED', resolvedAt: { $exists: true }, isActive: true } },
            {
                $project: {
                    duration: { $subtract: ['$resolvedAt', '$createdAt'] }
                }
            },
            {
                $group: {
                    _id: null,
                    avgDuration: { $avg: '$duration' }
                }
            }
        ]);

        let avgResolutionTime = 'N/A';
        if (resolutionStats.length > 0 && resolutionStats[0].avgDuration) {
            const avgMs = resolutionStats[0].avgDuration;
            const hours = Math.floor(avgMs / (1000 * 60 * 60));
            const minutes = Math.floor((avgMs % (1000 * 60 * 60)) / (1000 * 60));
            avgResolutionTime = `${hours}h ${minutes}m`;
        }

        res.json({
            totalIncidents,
            openIncidents,
            resolvedIncidents,
            categoryStats,
            priorityStats,
            avgResolutionTime
        });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
};
