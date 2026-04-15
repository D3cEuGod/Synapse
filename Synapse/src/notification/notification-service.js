import { db } from "../shared/firebase-config.js";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

function getNotificationsCollection() {
  return collection(db, "notifications");
}

export async function getNotificationsForUser(userId) {
  const notificationsRef = getNotificationsCollection();

  const q = query(
    notificationsRef,
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map(document => ({
    id: document.id,
    ...document.data()
  }));
}

export function subscribeToNotifications(userId, callback) {
  const notificationsRef = getNotificationsCollection();

  const q = query(
    notificationsRef,
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(document => ({
      id: document.id,
      ...document.data()
    }));

    callback(notifications);
  });
}

export async function createNotification({
  userId,
  title,
  message,
  type
}) {
  const notificationsRef = getNotificationsCollection();

  const newNotification = {
    userId,
    title,
    message,
    type,
    isRead: false,
    createdAt: new Date().toISOString()
  };

  const docRef = await addDoc(notificationsRef, newNotification);

  return {
    id: docRef.id,
    ...newNotification
  };
}

export async function markNotificationAsRead(notificationId) {
  try {
    console.log("Trying to mark as read:", notificationId);

    const notificationRef = doc(db, "notifications", notificationId);
    await updateDoc(notificationRef, { isRead: true });

    console.log("Marked as read successfully:", notificationId);
    return true;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
}