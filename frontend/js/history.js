
const API_URL = "http://127.0.0.1:8000";

document.addEventListener("DOMContentLoaded", () => {
    const token = sessionStorage.getItem("access_token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const historyList = document.getElementById("historyList");
    const historyCount = document.getElementById("historyCount");
    const detailsPanel = document.getElementById("historyDetails");

    const headers = {
        "Authorization": `Bearer ${token}`
    };

    document.getElementById("logoutBtn").addEventListener("click", () => {
        sessionStorage.clear();
        window.location.href = "login.html";
    });

    async function loadScanHistory() {
        historyList.textContent = "Loading scan history...";
        historyCount.textContent = "Loading...";

        try {
            const response = await fetch(`${API_URL}/history`, {
                headers
            });

            if (!response.ok) {
                throw new Error("Unable to load scan history.");
            }

            const records = await response.json();

            historyCount.textContent = `${records.length} scans found`;
            historyList.replaceChildren();

            if (records.length === 0) {
                historyList.textContent = "No previous scans found.";
                return;
            }

            records.forEach(record => {
                const card = document.createElement("article");
                card.className = "history-card";

                const title = document.createElement("h3");
                title.textContent = record.display_name || record.predicted_class;

                const filename = document.createElement("p");
                filename.textContent = `File: ${record.filename}`;

                const date = document.createElement("p");
                date.textContent = `Date: ${new Date(record.created_at).toLocaleString()}`;

                const confidence = document.createElement("p");
                confidence.textContent = `Confidence: ${Number(record.confidence).toFixed(2)}%`;

                const viewButton = document.createElement("button");
                viewButton.textContent = "View Details";
                viewButton.addEventListener("click", () => viewDetails(record.id));

                const deleteButton = document.createElement("button");
                deleteButton.textContent = "Delete Scan";
                deleteButton.addEventListener("click", () => deleteScan(record.id));

                card.append(
                    title, filename, date, confidence,
                    viewButton, deleteButton
                );

                historyList.appendChild(card);
            });

        } catch (error) {
            historyCount.textContent = "History unavailable";
            historyList.textContent = error.message;
        }
    }

    async function viewDetails(scanId) {
        try {
            const response = await fetch(`${API_URL}/history/${scanId}`, {
                headers
            });

            const record = await response.json();

            if (!response.ok) {
                throw new Error(record.detail || "Could not load scan details.");
            }

            document.getElementById("detailClass").textContent =
                `Prediction: ${record.display_name || record.predicted_class}`;

            document.getElementById("detailFilename").textContent =
                `Filename: ${record.filename}`;

            document.getElementById("detailConfidence").textContent =
                `Confidence: ${Number(record.confidence).toFixed(2)}%`;

            document.getElementById("detailDate").textContent =
                `Date: ${new Date(record.created_at).toLocaleString()}`;

            const scores = document.getElementById("detailScores");
            scores.replaceChildren();

            for (const [name, value] of Object.entries(record.predictions || {})) {
                const row = document.createElement("p");
                row.textContent = `${name}: ${value}%`;
                scores.appendChild(row);
            }

            detailsPanel.hidden = false;
            detailsPanel.scrollIntoView({ behavior: "smooth" });

        } catch (error) {
            alert(error.message);
        }
    }

    async function deleteScan(scanId) {
        if (!confirm("Are you sure you want to delete this scan?")) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/history/${scanId}`, {
                method: "DELETE",
                headers
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Could not delete scan.");
            }

            detailsPanel.hidden = true;
            alert("Scan deleted successfully!");
            await loadScanHistory();

        } catch (error) {
            alert(error.message);
        }
    }

    document.getElementById("refreshHistory")
        .addEventListener("click", loadScanHistory);

    document.getElementById("closeDetails")
        .addEventListener("click", () => {
            detailsPanel.hidden = true;
        });

    loadScanHistory();
});
