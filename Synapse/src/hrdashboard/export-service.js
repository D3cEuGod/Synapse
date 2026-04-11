

export function exportReportAsCSV(report){
    const rows = [
        ["HR Analytics Report"],
        ["Start Date",document.getElementById("start-date").value],
        ["End Date",document.getElementById("end-date").value],
        [],
        ["Metric","Value"],
        ["Total Self-Assessments", report.selfAssessmentStats.totalSelfAssessments],
        ["Average Assessment Score", report.selfAssessmentStats.averageScore],
        ["High Risk Count", report.selfAssessmentStats.highRiskCount],
        [],
        ["Total Mood Entries", report.moodStats.totalMoodEntries],
        ["Average Mood Level", report.moodStats.averageMood],
        ["Low Mood Count", report.moodStats.lowMoodCount],
        ["Neutral Mood Count", report.moodStats.neutralMoodCount],
        ["High Mood Count", report.moodStats.highMoodCount]
    ];

    const csvContent = rows.map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;

    const start = document.getElementById("start-date").value;
    const end = document.getElementById("end-date").value;

    link.download = `hr_analytics_${start}_to_${end}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

}