import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

export async function userCanAccessHRDashboard(db, user){
    if (!user) return false;

    const userDocRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(userDocRef);

    if (!docSnap.exists()) return false;

    const roles = docSnap.data().roles || [];
    return roles.includes("Administrator") || roles.includes("HR_Member");
}

export async function getSelfAssessments(db, startDate, endDate) {
  const snapshot = await getDocs(collection(db, "selfAssessments"));
  const assessments = snapshot.docs.map(doc => doc.data());

  const filtered = assessments.filter(a => {
    return a.date >= startDate && a.date <= endDate;
  });

  const total = filtered.length;

  const averageScore = total > 0 ? filtered.reduce((sum, a) => sum + (a.totalScore || 0), 0) / total : 0;

  const highRiskCount = filtered.filter(a => a.riskLevel==="high").length;

  return {
    totalSelfAssessments: total,
    averageScore: Number(averageScore.toFixed(2)),
    highRiskCount
  };
}

export async function getMoodStats(db, startDate, endDate){
    const snapshot = await getDocs(collection(db, "moodEntries"));
    const moodEntries = snapshot.docs.map(doc => doc.data());

    const filtered = moodEntries.filter(entry => {
        return entry.date >= startDate && entry.date <= endDate;
    });
    
    const total = filtered.length;

    const averageMood = total > 0 ? filtered.reduce((sum, entry) => sum + (entry.moodLevel || 0), 0) / total : 0;

    const lowMoodCount = filtered.filter(entry => entry.moodLevel <= 2).length;
    //const neutralMoodCount = filtered.filter(entry => entry.moodLevel === 3).length;
    //const highMoodCount = filtered.filter(entry => entry.moodLevel >= 4).length;

    return{
        totalMoodEntries: total,
        averageMood: Number(averageMood.toFixed(2)),
        lowMoodCount
        //neutralMoodCount,
        //highMoodCount
    };
}

export async function getHRDashboard(db, startDate, endDate){
    const selfAssessmentStats = await getSelfAssessments(db, startDate, endDate);
    const moodStats = await getMoodStats(db, startDate, endDate);

    return{
        selfAssessmentStats,
        moodStats
    };
}