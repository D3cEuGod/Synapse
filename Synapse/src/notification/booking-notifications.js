import { createNotification } from "./notification-service.js";

export async function notifyBookingRequestMade({
  employeeId,
  employeeName,
  ambassadorId,
  ambassadorName,
  date,
  startTime,
  endTime
}) {
  await Promise.all([
    createNotification({
      userId: employeeId,
      title: "Booking Request Submitted",
      message: `Your support request with ${ambassadorName} on ${date} from ${startTime} to ${endTime} has been submitted.`,
      type: "BOOKING_REQUEST_MADE"
    }),
    createNotification({
      userId: ambassadorId,
      title: "New Booking Request",
      message: `${employeeName} has requested a support session on ${date} from ${startTime} to ${endTime}.`,
      type: "BOOKING_REQUEST_RECEIVED"
    })
  ]);
}

export async function notifySessionScheduled({
  employeeId,
  ambassadorId,
  ambassadorName,
  date,
  startTime,
  endTime
}) {
  await Promise.all([
    createNotification({
      userId: employeeId,
      title: "Session Scheduled",
      message: `Your session with ${ambassadorName} on ${date} from ${startTime} to ${endTime} has been accepted and scheduled.`,
      type: "SESSION_SCHEDULED"
    }),
    createNotification({
      userId: ambassadorId,
      title: "Session Confirmed",
      message: `You accepted a support session on ${date} from ${startTime} to ${endTime}.`,
      type: "SESSION_CONFIRMED"
    })
  ]);
}

export async function notifyBookingDeclined({
  employeeId,
  ambassadorId,
  ambassadorName,
  date,
  startTime,
  endTime
}) {
  await Promise.all([
    createNotification({
      userId: employeeId,
      title: "Booking Declined",
      message: `Your request with ${ambassadorName} on ${date} from ${startTime} to ${endTime} was declined. Please choose another slot.`,
      type: "BOOKING_DECLINED"
    }),
    createNotification({
      userId: ambassadorId,
      title: "Request Declined",
      message: `You declined a support request on ${date} from ${startTime} to ${endTime}.`,
      type: "REQUEST_DECLINED"
    })
  ]);
}