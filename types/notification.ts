export type NotificationType =
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED"
  | "ANNOUNCEMENT"
  | "SYSTEM";

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: Date;
  relatedId?: string; // For linking to payment, announcement, etc
}

export interface NotificationResponse {
  notifications: Notification[];
  unreadCount: number;
}
