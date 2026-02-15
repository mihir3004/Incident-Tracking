import AuditLog from '../models/AuditLog.model';

export const logAction = async (action: string, userId?: string, details?: string, ipAddress?: string) => {
    try {
        await AuditLog.create({
            action,
            userId,
            details,
            ipAddress,
        });
    } catch (error) {
        console.error('Failed to create audit log:', error);
    }
};
