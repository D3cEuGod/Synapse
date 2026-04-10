import { subscribeToNotifications } from "./notification-service.js";
import { renderNotificationsPanel } from "./notifications-panel.js";

export function renderNotificationBell(userId, containerId = "notification-bell-container") {
  const container = document.getElementById(containerId);
  if (!container) return;

  let unsubscribePanel = null;

  container.innerHTML = `
    <div class="relative">
      <button
        id="notification-bell-btn"
        class="relative p-2 rounded-full bg-gray-800 border border-gray-700 hover:bg-gray-700 transition-colors"
        aria-label="Notifications"
      >
        <i data-lucide="bell" class="w-5 h-5 text-gray-200"></i>
        <span
          id="notification-badge"
          class="hidden absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold"
        ></span>
      </button>

      <div
        id="notification-dropdown"
        class="hidden absolute right-0 mt-3 w-96 max-w-[90vw] z-50"
      >
        <div class="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-4">
          <div id="notifications-panel"></div>
        </div>
      </div>
    </div>
  `;

  lucide.createIcons();

  const bellBtn = document.getElementById("notification-bell-btn");
  const dropdown = document.getElementById("notification-dropdown");
  const badge = document.getElementById("notification-badge");

  if (!bellBtn || !dropdown || !badge) return;

  bellBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    dropdown.classList.toggle("hidden");
  });

  document.addEventListener("click", (event) => {
    if (!container.contains(event.target)) {
      dropdown.classList.add("hidden");
    }
  });

  unsubscribePanel = renderNotificationsPanel(userId, "notifications-panel");

  const unsubscribeBell = subscribeToNotifications(userId, (notifications) => {
    const unreadCount = notifications.filter(item => !item.isRead).length;

    if (unreadCount > 0) {
      badge.textContent = unreadCount;
      badge.classList.remove("hidden");
    } else {
      badge.textContent = "";
      badge.classList.add("hidden");
    }
  });

  return () => {
    unsubscribeBell();
    if (unsubscribePanel) unsubscribePanel();
  };
}