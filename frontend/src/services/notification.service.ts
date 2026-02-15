
import api from '../api/client';

export interface Notification {
    _id: string;
    title: string;
    message: string;
    type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
    read: boolean;
    createdAt: string;
    relatedId?: string;
}

export const getNotifications = async (): Promise<Notification[]> => {
    const response = await api.get('/notifications');
    return response.data;
};

export const markAsRead = async (id: string): Promise<Notification> => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
};

export const deleteNotification = async (id: string): Promise<void> => {
    await api.delete(`/notifications/${id}`);
};
