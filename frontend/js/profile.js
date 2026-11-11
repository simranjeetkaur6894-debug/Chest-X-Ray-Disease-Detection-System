
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

    async function loadProfile() {
        const message = document.getElementById("profileMessage");

        try {
            const response = await fetch(`${API_URL}/me`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error("Unable to load profile information.");
            }

            const user = await response.json();

            const name = user.full_name || "User";
            const email = user.email || "Not available";

            document.getElementById("profileName").textContent = name;
            document.getElementById("profileEmail").textContent = email;
            document.getElementById("fullName").textContent = name;
            document.getElementById("emailAddress").textContent = email;
            document.getElementById("accountId").textContent = user.id ?? "N/A";

            document.getElementById("profileAvatar").textContent =
                name.trim().charAt(0).toUpperCase() || "U";

            document.getElementById("createdAt").textContent =
                user.created_at
                    ? new Date(user.created_at).toLocaleDateString()
                    : "Not available";

        } catch (error) {
            message.textContent = error.message;
        }
    }

    loadProfile();
});
