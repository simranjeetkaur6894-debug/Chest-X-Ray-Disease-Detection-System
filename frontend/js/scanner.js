
const API_URL = "http://127.0.0.1:8000";

document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById("xrayInput");
    const analyzeBtn = document.getElementById("analyzeBtn");
    const statusMessage = document.getElementById("statusMessage");
    const resultSection = document.getElementById("resultSection");
    const predictionResult = document.getElementById("predictionResult");
    const logoutBtn = document.getElementById("logoutBtn");
    const downloadReportBtn = document.getElementById("downloadReportBtn");
    let latestScanId = null;

    // Check login session
    const token =
        sessionStorage.getItem("access_token") ||
        sessionStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    // Logout
    logoutBtn?.addEventListener("click", () => {
        sessionStorage.clear();
        window.location.href = "login.html";
    });

    downloadReportBtn.addEventListener("click", async () => {
        if (!latestScanId) return;

        try {
            const response = await fetch(
                `${API_URL}/history/${latestScanId}/report`,
                {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error("PDF download failed.");
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = `XRay_Report_${latestScanId}.pdf`;
            link.click();

            URL.revokeObjectURL(url);

        } catch (error) {
            statusMessage.textContent = error.message;
        }
    });

    // Analyze X-ray
    analyzeBtn.addEventListener("click", async () => {
        const file = fileInput.files[0];

        if (!file) {
            statusMessage.textContent = "Please select an X-ray image first.";
            return;
        }

        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

        if (!allowedTypes.includes(file.type)) {
            statusMessage.textContent = "Please select a JPG, PNG or WEBP image.";
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            statusMessage.textContent = "Image must be 10 MB or smaller.";
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        analyzeBtn.disabled = true;
        analyzeBtn.textContent = "Analyzing...";
        statusMessage.textContent = "AI model is analyzing your X-ray...";
        resultSection.hidden = true;

        try {
            const response = await fetch(`${API_URL}/predict`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || "Prediction failed.");
            }

            predictionResult.replaceChildren();

            const heading = document.createElement("h3");
            heading.textContent =
                data.display_name || data.predicted_class;

            const confidence = document.createElement("p");
            confidence.textContent = `Confidence: ${data.confidence}%`;

            predictionResult.append(heading, confidence);

            const scores = document.createElement("div");
            scores.className = "prediction-scores";

            for (const [name, score] of Object.entries(data.predictions || {})) {
                const percentage = Math.max(
                    0,
                    Math.min(100, Number(score) || 0)
                );

                const row = document.createElement("div");
                row.className = "score-row";

                const label = document.createElement("p");
                label.textContent = `${name}: ${percentage.toFixed(2)}%`;

                const track = document.createElement("div");
                track.className = "score-track";

                const bar = document.createElement("div");
                bar.className = "score-fill";
                bar.style.width = `${percentage}%`;

                track.appendChild(bar);
                row.append(label, track);
                scores.appendChild(row);
            }

            predictionResult.appendChild(scores);

            resultSection.hidden = false;
            latestScanId = data.id;
            downloadReportBtn.hidden = false;
            statusMessage.textContent = "Analysis completed successfully.";
            resultSection.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

        } catch (error) {
            console.error("Prediction error:", error);
            statusMessage.textContent = error.message;
        } finally {
            analyzeBtn.disabled = false;
            analyzeBtn.textContent = "Analyze X-Ray";
        }
    });
});
