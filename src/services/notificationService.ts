import {
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db, notificationsCol } from '@/firebase/firestore';
import { AppNotification, NotificationType } from '@/types/notification';

/**
 * Creates an in-app notification for a user
 */
export async function createNotification(
  userId: string,
  type: NotificationType | string,
  title: string,
  message: string,
  taskId?: string
): Promise<string> {
  if (!userId) return '';
  try {
    const docRef = await addDoc(notificationsCol, {
      userId,
      type,
      title,
      message,
      taskId: taskId || null,
      read: false,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (err) {
    console.warn('Failed to create notification:', err);
    return '';
  }
}

/**
 * Subscribes to real-time notifications for the active user (client-side sorted to avoid requiring composite indexes)
 */
export function subscribeUserNotifications(
  userId: string,
  callback: (notifications: AppNotification[]) => void,
  maxItems: number = 30
) {
  if (!userId) return () => {};

  const q = query(
    notificationsCol,
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snap) => {
      const items: AppNotification[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<AppNotification, 'id'>),
      }));

      // Sort client-side by createdAt descending
      items.sort((a, b) => {
        const aTime = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
        const bTime = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
        return bTime - aTime;
      });

      callback(items.slice(0, maxItems));
    },
    (err) => {
      console.error('Error subscribing to notifications:', err);
    }
  );
}

/**
 * Marks a specific notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  if (!notificationId) return;
  const notifRef = doc(db, 'notifications', notificationId);
  await updateDoc(notifRef, { read: true });
}

/**
 * Marks all notifications for a user as read
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  if (!userId) return;
  const q = query(
    notificationsCol,
    where('userId', '==', userId),
    where('read', '==', false)
  );
  const snap = await getDocs(q);
  if (snap.empty) return;

  const batch = writeBatch(db);
  snap.docs.forEach((docItem) => {
    batch.update(docItem.ref, { read: true });
  });
  await batch.commit();
}
