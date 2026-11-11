
const API_URL = "http://127.0.0.1:8000";

document.addEventListener("DOMContentLoaded", () => {
    const token = sessionStorage.getItem("access_token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const logoutBtn = document.getElementById("logoutBtn");

    logoutBtn?.addEventListener("click", () => {
        sessionStorage.clear();
        window.location.href = "login.html";
    });

    async function loadDashboard() {
        const recentScans = document.getElementById("recentScans");

        try {
            const response = await fetch(`${API_URL}/history`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error("Unable to load dashboard data.");
            }

            const data = await response.json();
            const scans = Array.isArray(data) ? data : (data.records || []);

            const getClass = scan =>
                scan.predicted_class || scan.prediction || scan.predicted_label || scan.result || "";

            const total = scans.length;

            const covid = scans.filter(scan =>
                getClass(scan).toLowerCase().includes("covid")
            ).length;

            const normal = scans.filter(scan =>
                getClass(scan).toLowerCase().includes("normal")
            ).length;

            document.getElementById("totalScans").textContent = total;
            document.getElementById("covidCount").textContent = covid;
            document.getElementById("normalCount").textContent = normal;
            document.getElementById("otherCount").textContent =
                total - covid - normal;

            if (total === 0) {
                recentScans.textContent = "No scans available yet. Start your first scan!";
                return;
            }

            recentScans.innerHTML = "";

            scans.slice(0, 5).forEach(scan => {
                const card = document.createElement("div");
                card.className = "recent-scan-card";

                const heading = document.createElement("h3");
                heading.textContent = getClass(scan) || "Scan Result";

                const filename = document.createElement("p");
                filename.textContent = "File: " + (scan.filename || "X-Ray Image");

                const confidence = document.createElement("p");
                const score = Number(scan.confidence || 0);
                confidence.textContent = "Confidence: " +
                    (score <= 1 ? (score * 100).toFixed(2) : score.toFixed(2)) + "%";

                const date = document.createElement("p");
                date.textContent = "Date: " +
                    (scan.created_at ? new Date(scan.created_at).toLocaleString() : "N/A");

                card.append(heading, filename, confidence, date);
                recentScans.appendChild(card);
            });

        } catch (error) {
            recentScans.textContent = error.message;
        }
    }

    loadDashboard();
});
