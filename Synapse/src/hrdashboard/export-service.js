//Author: Aristidis Maximilian Karidis 230507748

//Function to export the whole report (including charts) as PDF using jsPDF, excludes N/A data and charts
export async function exportReportAsPDF(report) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    const start = document.getElementById("start-date").value;
    const end = document.getElementById("end-date").value;

    const checkPageBreak = (neededHeight) => {
        if (y + neededHeight > pageHeight - margin) {
            pdf.addPage();
            y = margin;
        }
    };

    // Title
    pdf.setFontSize(18);
    pdf.setTextColor(23, 122, 100);
    pdf.text("HR Analytics Report", margin, y);
    y += 24;

    // Date range
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Period: ${start} to ${end}`, margin, y);
    y += 30;

    // Section header helper
    const sectionHeader = (label) => {
        checkPageBreak(30);
        pdf.setFontSize(12);
        pdf.setTextColor(40, 40, 40);
        pdf.setFont(undefined, "bold");
        pdf.text(label, margin, y);
        pdf.setFont(undefined, "normal");
        y += 4;
        pdf.setDrawColor(23, 122, 100);
        pdf.line(margin, y, margin + contentWidth, y);
        y += 16;
    };

    // Stat row helper
    const statRow = (label, value) => {
        checkPageBreak(18);
        pdf.setFontSize(10);
        pdf.setTextColor(80, 80, 80);
        pdf.text(label, margin, y);
        pdf.setTextColor(20, 20, 20);
        pdf.setFont(undefined, "bold");
        pdf.text(String(value), pageWidth - margin, y, { align: "right" });
        pdf.setFont(undefined, "normal");
        y += 18;
    };

    // Self-assessment stats
    if (report.selfAssessmentStats) {
        const selfAssessmentCanvas = document.getElementById("self-assessment-chart");
        const selfAssessmentChartHeight = selfAssessmentCanvas ? (selfAssessmentCanvas.height / selfAssessmentCanvas.width) * contentWidth : 0;
        // 30 = section header, 2*18 = two stat rows, 12 = gap, 20 = gap before chart
        const selfAssessmentSectionHeight = 30 + (2 * 18) + 12 + 20 + selfAssessmentChartHeight;
        checkPageBreak(selfAssessmentSectionHeight);

        sectionHeader("Self-Assessment Statistics");
        statRow("Total Self-Assessments", report.selfAssessmentStats.totalSelfAssessments);
        statRow("Average Assessment Score", report.selfAssessmentStats.averageScore);
        y += 12;

        if (selfAssessmentCanvas) {
            y += 8;
            const canvasImage = await html2canvas(selfAssessmentCanvas, { backgroundColor: "#1f2937", scale: 2 });
            const imgData = canvasImage.toDataURL("image/png");
            pdf.addImage(imgData, "PNG", margin, y, contentWidth, selfAssessmentChartHeight);
            y += selfAssessmentChartHeight + 20;
        }
    }

    // Mood stats
    if (report.moodStats) {
        const moodChartCanvas = document.getElementById("mood-distribution-chart");
        const moodChartHeight = moodChartCanvas ? (moodChartCanvas.height / moodChartCanvas.width) * contentWidth : 0;
        // 30 = section header, 5*18 = five stat rows, 20 = gap before chart
        const moodSectionHeight = 30 + (5 * 18) + 20 + moodChartHeight;
        checkPageBreak(moodSectionHeight);

        sectionHeader("Mood Statistics");
        statRow("Total Mood Entries", report.moodStats.totalMoodEntries);
        statRow("Average Mood Level", report.moodStats.averageMood);
        statRow("Low Mood Count (<= 2)", report.moodStats.lowMoodCount);
        statRow("Neutral Mood Count (= 3)", report.moodStats.neutralMoodCount);
        statRow("High Mood Count (>= 4)", report.moodStats.highMoodCount);
        y += 20;

        // Mood distribution chart
        if (moodChartCanvas) {
            const canvasImage = await html2canvas(moodChartCanvas, { backgroundColor: "#1f2937", scale: 2 });
            const imgData = canvasImage.toDataURL("image/png");
            pdf.addImage(imgData, "PNG", margin, y, contentWidth, moodChartHeight);
            y += moodChartHeight + 20;
        }
    }

    // Gamification stats
    if (report.pointsStats) {
        const pointsCanvas = document.getElementById("points-activity-chart");
        const pointsChartHeight = pointsCanvas ? (pointsCanvas.height / pointsCanvas.width) * contentWidth : 0;
        // 30 = section header, 4*18 = four stat rows, 20 = gap before chart
        const gamificationSectionHeight = 30 + (4 * 18) + 20 + pointsChartHeight;
        checkPageBreak(gamificationSectionHeight);

        sectionHeader("Gamification Statistics");
        statRow("Total Points Earned", report.pointsStats.totalPointsEarned);
        statRow("Total Points Redeemed", report.pointsStats.totalPointsRedeemed);
        statRow("Average Points Balance", report.pointsStats.averagePointsBalance);
        statRow("Redemption Rate", report.pointsStats.redemptionRate !== null ? `${report.pointsStats.redemptionRate}%` : "N/A");
        y += 20;

        // Points activity chart
        if (pointsCanvas) {
            const canvasImage = await html2canvas(pointsCanvas, { backgroundColor: "#1f2937", scale: 2 });
            const imgData = canvasImage.toDataURL("image/png");
            pdf.addImage(imgData, "PNG", margin, y, contentWidth, pointsChartHeight);
        }
    }

    pdf.save(`hr_analytics_${start}_to_${end}.pdf`);
}

// Function to export all the data in the report as CSV excluding N/A data
export function exportReportAsCSV(report){
    const start = document.getElementById("start-date").value;
    const end = document.getElementById("end-date").value;

    const rows = [
        ["HR Analytics Report"],
        ["Start Date", start],
        ["End Date", end],
        [],
        ["Metric", "Value"],
        ...(report.selfAssessmentStats ? [
            ["Total Self-Assessments", report.selfAssessmentStats.totalSelfAssessments],
            ["Average Assessment Score", report.selfAssessmentStats.averageScore],
            ["Risk Level — Low", report.selfAssessmentStats.riskCounts.low],
            ["Risk Level — Medium", report.selfAssessmentStats.riskCounts.medium],
            ["Risk Level — High", report.selfAssessmentStats.riskCounts.high],
            ["Risk Level — Very High", report.selfAssessmentStats.riskCounts.veryHigh],
        ] : [
            ["Self-Assessment Data", "Insufficient data — hidden to protect employee privacy"]
        ]),
        [],
        ...(report.moodStats ? [
            ["Total Mood Entries", report.moodStats.totalMoodEntries],
            ["Average Mood Level", report.moodStats.averageMood],
            ["Low Mood Count", report.moodStats.lowMoodCount],
            ["Neutral Mood Count", report.moodStats.neutralMoodCount],
            ["High Mood Count", report.moodStats.highMoodCount]
        ] : [
            ["Mood Data", "Insufficient data — hidden to protect employee privacy"]
        ]),
        [],
        ["Gamification Statistics"],
        ["Total Points Earned", report.pointsStats.totalPointsEarned],
        ["Total Points Redeemed", report.pointsStats.totalPointsRedeemed],
        ["Average Points Balance", report.pointsStats.averagePointsBalance],
        ["Redemption Rate", report.pointsStats.redemptionRate !== null ? `${report.pointsStats.redemptionRate}%` : "N/A"]
    ];

    const csvContent = rows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `hr_analytics_${start}_to_${end}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

}