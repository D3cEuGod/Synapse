import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
// Author: Aristidis Maximilian Karidis 230507748

// Function to check if the user has the necessary access role (HR_Member or Administrator) to view the HR Dashboard
export async function userCanAccessHRDashboard(db, user){
    if (!user) return false;

    const userDocRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userDocRef);

    if (!docSnap.exists()) return false;

    const roles = docSnap.data().roles || [];
    return roles.includes("Administrator") || roles.includes("HR_Member");
}

// Fetches the self assessments data
async function getSelfAssessments(db, startDate, endDate) {
  const snapshot = await getDocs(collection(db, "selfAssessments"));
  const assessments = snapshot.docs.map(doc => doc.data());

  const filtered = assessments.filter(a => {
    return a.date >= startDate && a.date <= endDate;
  });

  const total = filtered.length;

  const averageScore = total > 0 ? filtered.reduce((sum, a) => sum + (a.totalScore || 0), 0) / total : 0;

  const riskCounts = filtered.reduce((counts, a) => {
    if (a.riskLevel === "low") counts.low++;
    else if (a.riskLevel === "medium") counts.medium++;
    else if (a.riskLevel === "high") counts.high++;
    else if (a.riskLevel === "very-high") counts.veryHigh++;
    return counts;
  }, { low: 0, medium: 0, high: 0, veryHigh: 0 });

  return {
    totalSelfAssessments: total,
    averageScore: Number(averageScore.toFixed(2)),
    riskCounts
  };
}

//Fetches the mood stats data
async function getMoodStats(db, startDate, endDate){
    const snapshot = await getDocs(collection(db, "moodEntries"));
    const moodEntries = snapshot.docs.map(doc => doc.data());

    const filtered = moodEntries.filter(entry => {
        return entry.date >= startDate && entry.date <= endDate;
    });
    
    const total = filtered.length;

    const averageMood = total > 0 ? filtered.reduce((sum, entry) => sum + (entry.moodLevel || 0), 0) / total : 0;

    const lowMoodCount = filtered.filter(entry => entry.moodLevel <= 2).length;
    const neutralMoodCount = filtered.filter(entry => entry.moodLevel === 3).length;
    const highMoodCount = filtered.filter(entry => entry.moodLevel >= 4).length;

    return{
        totalMoodEntries: total,
        averageMood: Number(averageMood.toFixed(2)),
        lowMoodCount,
        neutralMoodCount,
        highMoodCount
    };
}

//Fetches the gamification stats data
async function getPointsStats(db, startDate, endDate) {
  // Parse as local-time dates to avoid UTC-midnight off-by-one errors
  const [sy, sm, sd] = startDate.split("-").map(Number);
  const start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
  const [ey, em, ed] = endDate.split("-").map(Number);
  const end = new Date(ey, em - 1, ed, 23, 59, 59, 999);

  const transactionsSnap = await getDocs(collection(db, "pointsTransactions"));
  const redemptionsSnap = await getDocs(collection(db, "redemptions"));
  const accountsSnap = await getDocs(collection(db, "pointsAccount"));

  const transactions = transactionsSnap.docs.map(doc => doc.data());
  const redemptions = redemptionsSnap.docs.map(doc => doc.data());
  const accounts = accountsSnap.docs.map(doc => doc.data());

  const filteredTransactions = transactions.filter(t => {
    if (!t.timestamp) return false;
    const date = t.timestamp.toDate();
    return date >= start && date <= end;
  });

  const filteredRedemptions = redemptions.filter(r => {
    if (!r.redemptionDate) return false;
    const date = r.redemptionDate.toDate();
    return date >= start && date <= end;
  });

  const totalPointsEarned = filteredTransactions.reduce(
    (sum, t) => sum + (t.pointsChange || 0), 0
  );

  const totalPointsRedeemed = filteredRedemptions.reduce(
    (sum, r) => sum + (r.pointsSpent || 0), 0
  );

  const averagePointsBalance = accounts.length > 0
    ? accounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0) / accounts.length
    : 0;

  const redemptionRate = totalPointsEarned > 0
    ? (totalPointsRedeemed / totalPointsEarned) * 100
    : null;

  return {
    totalPointsEarned,
    totalPointsRedeemed,
    averagePointsBalance: Number(averagePointsBalance.toFixed(2)),
    redemptionRate: redemptionRate !== null ? Number(redemptionRate.toFixed(1)) : null
  };
}

export async function getHRDashboard(db, startDate, endDate){
    const [selfAssessmentStats, moodStats, pointsStats] = await Promise.all([
        getSelfAssessments(db, startDate, endDate),
        getMoodStats(db, startDate, endDate),
        getPointsStats(db, startDate, endDate)
    ]);

    return { selfAssessmentStats, moodStats, pointsStats };
}