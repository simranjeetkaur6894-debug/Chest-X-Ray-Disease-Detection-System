
const token = sessionStorage.getItem("access_token");
const userData = sessionStorage.getItem("current_user");

// Login ke bina Home page access nahi hoga
if (!token || !userData) {
    window.location.replace("login.html");
} else {
    const user = JSON.parse(userData);

    const userName = document.getElementById("userName");
    const userAvatar = document.getElementById("userAvatar");

    if (userName) {
        userName.textContent = user.full_name;
    }

    if (userAvatar) {
        userAvatar.textContent = user.full_name
            .trim()
            .charAt(0)
            .toUpperCase();
    }
}

// Logout functionality
const logoutButton = document.getElementById("logoutButton");

if (logoutButton) {
    logoutButton.addEventListener("click", () => {
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("current_user");

        window.location.replace("login.html");
    });
}
