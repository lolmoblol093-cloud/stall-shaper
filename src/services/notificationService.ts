import { directus, Notification } from '@/integrations/directus/client';
import { readItems, readItem, createItem, updateItem, deleteItem } from '@directus/sdk';

export const notificationService = {
  async getAll(): Promise<Notification[]> {
    const notifications = await directus.request(
      readItems('notifications', {
        sort: ['-created_at'],
      })
    );
    return notifications as Notification[];
  },

  async getById(id: string): Promise<Notification | null> {
    try {
      const notification = await directus.request(readItem('notifications', id));
      return notification as Notification;
    } catch {
      return null;
    }
  },

  async getUnread(): Promise<Notification[]> {
    const notifications = await directus.request(
      readItems('notifications', {
        filter: { is_read: { _eq: false } },
        sort: ['-created_at'],
      })
    );
    return notifications as Notification[];
  },

  async create(data: Partial<Notification>): Promise<Notification> {
    const notification = await directus.request(
      createItem('notifications', {
        ...data,
        is_read: false,
        created_at: new Date().toISOString(),
      })
    );
    return notification as Notification;
  },

  async markAsRead(id: string): Promise<Notification> {
    const notification = await directus.request(
      updateItem('notifications', id, { is_read: true })
    );
    return notification as Notification;
  },

  async markAllAsRead(): Promise<void> {
    const unread = await this.getUnread();
    await Promise.all(unread.map((n) => this.markAsRead(n.id)));
  },

  async delete(id: string): Promise<void> {
    await directus.request(deleteItem('notifications', id));
  },
};

export default notificationService;
