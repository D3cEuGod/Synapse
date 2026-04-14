Each notification document in Firestore should look like this:

{
userId: "firebase-user-uid",
title: "Booking Confirmed",
message: "Your wellbeing support session has been successfully booked.",
type: "BOOKING_CONFIRMATION",
isRead: false,
createdAt: new Date().toISOString()
}