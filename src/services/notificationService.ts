import { mockNotifications, Notification } from '@/data/mockData';

// Local state for mock data
let notifications = [...mockNotifications];

export const notificationService = {
  async getAll(): Promise<Notification[]> {
    return [...notifications].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  async getById(id: string): Promise<Notification | null> {
    return notifications.find(n => n.id === id) || null;
  },

  async getUnread(): Promise<Notification[]> {
    return notifications
      .filter(n => !n.is_read)
      .sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  },

  async create(data: Partial<Notification>): Promise<Notification> {
    const newNotification: Notification = {
      id: `notif-${Date.now()}`,
      title: data.title || '',
      message: data.message || '',
      type: data.type || 'info',
      is_read: false,
      reference_id: data.reference_id,
      reference_type: data.reference_type,
      created_at: new Date().toISOString(),
    };
    notifications.push(newNotification);
    return newNotification;
  },

  async markAsRead(id: string): Promise<Notification> {
    const index = notifications.findIndex(n => n.id === id);
    if (index === -1) throw new Error('Notification not found');
    
    notifications[index] = {
      ...notifications[index],
      is_read: true,
    };
    return notifications[index];
  },

  async markAllAsRead(): Promise<void> {
    notifications = notifications.map(n => ({ ...n, is_read: true }));
  },

  async delete(id: string): Promise<void> {
    notifications = notifications.filter(n => n.id !== id);
  },
};

export default notificationService;
