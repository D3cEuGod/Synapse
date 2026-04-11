import {
  subscribeToNotifications,
  markNotificationAsRead
} from "./notification-service.js";

function createNotificationItem(notification) {
  return `
    <div class="bg-gray-800 border ${notification.isRead ? "border-gray-700" : "border-[#177a64]"} rounded-xl p-4">
      <div class="flex justify-between items-start gap-4">
        <div>
          <h3 class="text-white font-semibold">${notification.title}</h3>
          <p class="text-sm text-gray-400 mt-1">${notification.message}</p>
          <p class="text-xs text-gray-500 mt-2">${notification.type}</p>
        </div>
        ${
          notification.isRead
            ? `<span class="text-xs text-gray-500">Read</span>`
            : `<button
                 class="mark-read-btn text-xs px-3 py-1 rounded-md bg-[#177a64] hover:bg-[#0b4533] text-white"
                 data-id="${notification.id}"
               >
                 Mark as read
               </button>`
        }
      </div>
    </div>
  `;
}

function attachMarkReadEvents() {
  const buttons = document.querySelectorAll(".mark-read-btn");

  buttons.forEach(button => {
    button.addEventListener("click", async () => {
      const notificationId = button.dataset.id;
      await markNotificationAsRead(notificationId);
    });
  });
}

export function renderNotificationsPanel(userId, containerId = "notifications-panel") {
  const container = document.getElementById(containerId);
  if (!container) return;

  return subscribeToNotifications(userId, (notifications) => {
    const unreadCount = notifications.filter(item => !item.isRead).length;

    container.innerHTML = `
      <section class="space-y-4">
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-bold text-white">Notifications</h2>
          <span class="text-sm px-3 py-1 rounded-full bg-gray-800 border border-gray-700 text-gray-300">
            Unread: ${unreadCount}
          </span>
        </div>

        <div class="space-y-3 max-h-96 overflow-y-auto">
          ${
            notifications.length
              ? notifications.map(createNotificationItem).join("")
              : `<div class="bg-gray-800 border border-gray-700 rounded-xl p-4 text-gray-400">
                   No notifications available.
                 </div>`
          }
        </div>
      </section>
    `;

    attachMarkReadEvents();
  });
}