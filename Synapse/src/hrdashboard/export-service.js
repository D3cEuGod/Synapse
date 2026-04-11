

export async function exportReportAsPDF(report) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    const start = document.getElementById("start-date").value;
    const end = document.getElementById("end-date").value;

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
    sectionHeader("Self-Assessment Statistics");
    statRow("Total Self-Assessments", report.selfAssessmentStats.totalSelfAssessments);
    statRow("Average Assessment Score", report.selfAssessmentStats.averageScore);
    //statRow("High Risk Count", report.selfAssessmentStats.highRiskCount);
    y += 12;

    // Mood stats
    sectionHeader("Mood Statistics");
    statRow("Total Mood Entries", report.moodStats.totalMoodEntries);
    statRow("Average Mood Level", report.moodStats.averageMood);
    statRow("Low Mood Count (<= 2)", report.moodStats.lowMoodCount);
    statRow("Neutral Mood Count (= 3)", report.moodStats.neutralMoodCount);
    statRow("High Mood Count (>= 4)", report.moodStats.highMoodCount);
    y += 20;

    // Mood distribution chart
    const chartCanvas = document.getElementById("mood-distribution-chart");
    if (chartCanvas) {
        const canvasImage = await html2canvas(chartCanvas, { backgroundColor: "#1f2937", scale: 2 });
        const imgData = canvasImage.toDataURL("image/png");
        const imgHeight = (canvasImage.height / canvasImage.width) * contentWidth;
        pdf.addImage(imgData, "PNG", margin, y, contentWidth, imgHeight);
    }

    pdf.save(`hr_analytics_${start}_to_${end}.pdf`);
}

export function exportReportAsCSV(report){
    const start = document.getElementById("start-date").value;
    const end = document.getElementById("end-date").value;

    const rows = [
        ["HR Analytics Report"],
        ["Start Date", start],
        ["End Date", end],
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
    link.download = `hr_analytics_${start}_to_${end}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

}