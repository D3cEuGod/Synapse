

export function exportReportAsCSV(){
    const rows = [
        ["HR Analytics Report"],
        ["Start Date",document.getElementById("start-date").value],
        ["End Date",document.getElementById("end-date").value],
        [],
        ["Metric","Value"],
        ["Total Self-Assessments", document.getElementById("total-self-assessments").innerText],
        ["Average Assessment Score", document.getElementById("avg-self-score").innerText],
        ["High Risk Count", document.getElementById("high-risk-count").innerText],
        [],
        ["Total Mood Entries", document.getElementById("total-mood-entries").innerText],
        ["Average Mood Level", document.getElementById("avg-mood").innerText],
        ["Low Mood Count", document.getElementById("low-mood-count").innerText]
        //["Neutral Mood Count", document.getElementById("neutralMoodCount").innerText],
        //["High Mood Count", document.getElementById("highMoodCount").innerText]
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