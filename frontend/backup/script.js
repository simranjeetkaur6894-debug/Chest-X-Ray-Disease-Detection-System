
const API_URL = "http://127.0.0.1:8000";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("xrayForm");
  const fileInput = document.getElementById("xrayFile");
  const uploadTitle = document.getElementById("uploadTitle");
  const uploadHint = document.getElementById("uploadHint");
  const uploadZone = document.getElementById("uploadZone");
  const predictButton = document.getElementById("predictButton");
  const scanStatus = document.getElementById("scanStatus");
  const resultPanel = document.getElementById("resultPanel");

  // Smooth navigation
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const id = link.getAttribute("href");

      if (id === "#") {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      const target = document.querySelector(id);

      if (target) {
        event.preventDefault();
        target.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    });
  });

  // Scroll to scanner from the hero button
  document.querySelectorAll('a[href="#scanner"]').forEach((link) => {
    link.addEventListener("click", () => {
      const scanner = document.getElementById("scanner");
      if (scanner) {
        scanner.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  // Display selected image filename
  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];

    resultPanel.hidden = true;

    if (!file) {
      uploadTitle.textContent = "Choose a chest X-ray";
      uploadHint.textContent = "Click to select JPG, PNG or WEBP";
      return;
    }

    uploadTitle.textContent = file.name;
    uploadHint.textContent =
      `${(file.size / (1024 * 1024)).toFixed(2)} MB selected`;

    scanStatus.textContent = "Image selected. Ready to analyze.";
  });

  // Upload image to FastAPI and show prediction
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const file = fileInput.files[0];

    if (!file) {
      scanStatus.textContent = "Please select a chest X-ray image first.";
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      scanStatus.textContent = "Please choose a JPG, PNG or WEBP image.";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      scanStatus.textContent = "Image must be 10 MB or smaller.";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    predictButton.disabled = true;
    predictButton.textContent = "Analyzing...";
    scanStatus.textContent = "Connecting to AI model. Please wait...";
    resultPanel.hidden = true;

    try {
      const response = await fetch(`${API_URL}/predict`, {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Prediction request failed.");
      }

      document.getElementById("resultClass").textContent =
        data.display_name || data.predicted_class;

      document.getElementById("resultConfidence").textContent =
        `${data.confidence}%`;

      const scores = document.getElementById("predictionScores");
      scores.replaceChildren();

      for (const [name, score] of Object.entries(data.predictions || {})) {
        const row = document.createElement("div");
        row.className = "score-row";

        const heading = document.createElement("div");
        heading.className = "score-heading";

        const label = document.createElement("span");
        label.textContent = name;

        const value = document.createElement("span");
        value.textContent = `${score}%`;

        heading.append(label, value);

        const track = document.createElement("div");
        track.className = "score-track";

        const bar = document.createElement("div");
        bar.className = "score-fill";
        bar.style.width = `${Math.max(0, Math.min(100, Number(score) || 0))}%`;

        track.appendChild(bar);
        row.append(heading, track);
        scores.appendChild(row);
      }

      resultPanel.hidden = false;
      scanStatus.textContent = "Analysis complete. Review the educational result below.";
      resultPanel.scrollIntoView({ behavior: "smooth", block: "start" });

    } catch (error) {
      console.error("Prediction error:", error);

      scanStatus.textContent =
        "Could not connect to the backend. Check that FastAPI is running at http://127.0.0.1:8000 and try again.";
    } finally {
      predictButton.disabled = false;
      predictButton.innerHTML = 'Analyze X-ray <span>→</span>';
    }
  });

  console.log("XRAY VISION frontend loaded successfully.");
});


// ===== SCAN HISTORY =====

async function loadScanHistory() {
  const historyList = document.getElementById("historyList");
  const historyCount = document.getElementById("historyCount");

  if (!historyList || !historyCount) return;

  historyList.innerHTML =
    '<p class="history-message">Loading scan history...</p>';

  try {
    const response = await fetch(`${API_URL}/history`);

    if (!response.ok) {
      throw new Error("Unable to load scan history.");
    }

    const records = await response.json();

    historyCount.textContent = `${records.length} scans found`;

    if (records.length === 0) {
      historyList.innerHTML =
        '<p class="history-message">No previous scans found.</p>';
      return;
    }

    historyList.innerHTML = records.map(record => {
      const date = new Date(record.created_at).toLocaleString();

      return `
        <article class="history-card">
          <div>
            <h3>${escapeHistoryText(record.display_name || record.predicted_class)}</h3>
            <p>File: ${escapeHistoryText(record.filename)}</p>
            <p>Scan date: ${escapeHistoryText(date)}</p>
          </div>
          <div class="history-confidence">
          ${Number(record.confidence).toFixed(2)}%
        </div>

        <button
          type="button"
          class="primary-button view-details-btn"
          data-id="${Number(record.id)}">
          View Details →
        </button>
        <button
          type="button"
          class="delete-scan-btn"
          data-id="${Number(record.id)}">
          Delete Scan
        </button>
        </article>
      `;
    }).join("");

  } catch (error) {
    console.error("History error:", error);
    historyCount.textContent = "History unavailable";
    historyList.innerHTML =
      '<p class="history-message">Could not load scan history. Please try again.</p>';
  }
}

function escapeHistoryText(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

document.addEventListener("DOMContentLoaded", () => {
  loadScanHistory();

  const refreshButton = document.getElementById("refreshHistory");

  if (refreshButton) {
    refreshButton.addEventListener("click", loadScanHistory);
  }
});


// ===== VIEW SCAN DETAILS =====

document.addEventListener("click", async (event) => {
  const button = event.target.closest(".view-details-btn");
  if (!button) return;

  const scanId = button.dataset.id;
  const panel = document.getElementById("historyDetails");

  button.disabled = true;
  button.textContent = "Loading...";

  try {
    const response = await fetch(`${API_URL}/history/${scanId}`);

    if (!response.ok) {
      throw new Error("Could not load scan details.");
    }

    const record = await response.json();

    document.getElementById("detailClass").textContent =
      record.display_name || record.predicted_class;

    document.getElementById("detailFilename").textContent =
      record.filename;

    document.getElementById("detailConfidence").textContent =
      `${Number(record.confidence).toFixed(2)}%`;

    document.getElementById("detailDate").textContent =
      new Date(record.created_at).toLocaleString();

    const scores = document.getElementById("detailScores");

    scores.innerHTML = Object.entries(record.predictions || {})
      .map(([name, value]) => {
        const percentage = Number(value) <= 1
          ? Number(value) * 100
          : Number(value);

        const safeName = escapeHistoryText(name);
        const safePercentage = Math.max(
          0,
          Math.min(100, percentage)
        );

        return `
          <div class="score-row">
            <div class="score-heading">
              <span>${safeName}</span>
              <span>${safePercentage.toFixed(2)}%</span>
            </div>
            <div class="score-track">
              <div class="score-fill"
                style="width:${safePercentage}%">
              </div>
            </div>
          </div>
        `;
      }).join("");

    panel.hidden = false;
    panel.scrollIntoView({ behavior: "smooth", block: "center" });

  } catch (error) {
    alert(error.message);
  } finally {
    button.disabled = false;
    button.textContent = "View Details →";
  }
});

// Close details panel
document.getElementById("closeDetails")?.addEventListener("click", () => {
  document.getElementById("historyDetails").hidden = true;
});


// ===== DELETE SCAN HISTORY =====

document.addEventListener("click", async (event) => {
  const button = event.target.closest(".delete-scan-btn");

  if (!button) return;

  const scanId = button.dataset.id;

  const confirmed = confirm(
    "Are you sure you want to delete this scan?"
  );

  if (!confirmed) return;

  button.disabled = true;
  button.textContent = "Deleting...";

  try {
    const response = await fetch(
      `${API_URL}/history/${scanId}`,
      { method: "DELETE" }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Could not delete scan.");
    }

    document.getElementById("historyDetails").hidden = true;

    await loadScanHistory();

    alert("Scan deleted successfully!");

  } catch (error) {
    console.error("Delete error:", error);
    alert(error.message);
    button.disabled = false;
    button.textContent = "Delete Scan";
  }
});
// LOAD DASHBOARD STATISTICS
async function loadDashboardStats() {
  try {
    const response = await fetch(`${API_URL}/dashboard/stats`);

    if (!response.ok) {
      throw new Error("Dashboard data could not be loaded.");
    }

    const data = await response.json();

    document.getElementById("totalScans").textContent =
      data.total_scans;

    const analytics = document.getElementById("predictionAnalytics");

    analytics.innerHTML = Object.entries(data.prediction_counts)
      .map(([disease, count]) => `
        <div class="score-row">
          <div class="score-heading">
            <span>${disease.replace("_", " ")}</span>
            <span>${count} scans</span>
          </div>
          <div class="score-track">
            <div class="score-fill"
              style="width: ${
                data.total_scans > 0
                  ? (count / data.total_scans) * 100
                  : 0
              }%">
            </div>
          </div>
        </div>
      `).join("");
  } catch (error) {
    console.error("Dashboard error:", error);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadDashboardStats();
});

// HISTORY SEARCH AND DISEASE FILTER
function filterHistoryRecords() {
  const searchValue = document
    .getElementById("historySearch")
    .value.toLowerCase()
    .trim();

  const selectedDisease = document
    .getElementById("diseaseFilter")
    .value.toLowerCase()
    .replaceAll("_", " ");

  const cards = document.querySelectorAll(".history-card");
  let visibleCount = 0;

  cards.forEach(card => {
    const cardText = card.textContent
      .toLowerCase()
      .replaceAll("_", " ");

    const matchesSearch = cardText.includes(searchValue);
    const matchesDisease =
      selectedDisease === "all" ||
      cardText.includes(selectedDisease);

    card.hidden = !(matchesSearch && matchesDisease);

    if (!card.hidden) visibleCount++;
  });

  document.getElementById("historyCount").textContent =
    `${visibleCount} of ${cards.length} scans shown`;
}

document.getElementById("historySearch")
  ?.addEventListener("input", filterHistoryRecords);

document.getElementById("diseaseFilter")
  ?.addEventListener("change", filterHistoryRecords);
  
// EXPORT SCAN HISTORY TO CSV
document.getElementById("exportHistory")
  ?.addEventListener("click", async () => {
    try {
      const response = await fetch(`${API_URL}/history`);

      if (!response.ok) {
        throw new Error("Unable to export scan history.");
      }

      const records = await response.json();

      if (records.length === 0) {
        alert("No scan records available to export.");
        return;
      }

      const headers = [
        "ID",
        "Filename",
        "Predicted Disease",
        "Confidence",
        "Scan Date"
      ];

      const rows = records.map(record => [
        record.id,
        record.filename,
        record.display_name || record.predicted_class,
        `${Number(record.confidence).toFixed(2)}%`,
        record.created_at
      ]);

      const csvContent = [headers, ...rows]
        .map(row =>
          row.map(value =>
            `"${String(value ?? "").replace(/"/g, '""')}"`
          ).join(",")
        ).join("\n");

      const blob = new Blob(
        ["\uFEFF" + csvContent],
        { type: "text/csv;charset=utf-8;" }
      );

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "Chest_Xray_Scan_History.csv";
      link.click();

      URL.revokeObjectURL(url);

    } catch (error) {
      alert(error.message);
    }
  });