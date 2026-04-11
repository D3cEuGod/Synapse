export function createMockNotifications(userId) {
  return [
    {
      id: "noti-001",
      userId: userId,
      title: "Booking Confirmed",
      message: "Your wellbeing support session has been successfully booked.",
      type: "BOOKING_CONFIRMATION",
      isRead: false,
      createdAt: new Date().toISOString()
    },
    {
      id: "noti-002",
      userId: userId,
      title: "Session Reminder",
      message: "Your wellbeing session starts in 24 hours.",
      type: "SESSION_REMINDER_24H",
      isRead: false,
      createdAt: new Date().toISOString()
    },
    {
      id: "noti-003",
      userId: userId,
      title: "Request Declined",
      message: "Your requested session was declined. Please choose another slot.",
      type: "SESSION_DECLINED",
      isRead: true,
      createdAt: new Date().toISOString()
    }
  ];
}