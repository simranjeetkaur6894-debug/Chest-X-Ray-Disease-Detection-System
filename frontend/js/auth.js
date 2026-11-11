
const API_URL = "http://127.0.0.1:8000";

function showMessage(form, message, isError = false) {
    let messageBox = form.querySelector(".auth-message");

    if (!messageBox) {
        messageBox = document.createElement("p");
        messageBox.className = "auth-message";
        messageBox.style.marginTop = "15px";
        messageBox.style.textAlign = "center";
        form.appendChild(messageBox);
    }

    messageBox.textContent = message;
    messageBox.style.color = isError ? "#ff7070" : "#a8ffbd";
}

async function sendRequest(endpoint, data) {
    const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.detail || "Something went wrong.");
    }

    return result;
}

// SIGNUP
const signupForm = document.getElementById("signupForm");

if (signupForm) {
    signupForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const fullName = document.getElementById("fullName").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (password !== confirmPassword) {
            showMessage(signupForm, "Passwords do not match.", true);
            return;
        }

        try {
            const result = await sendRequest("/signup", {
                full_name: fullName,
                email: email,
                password: password
            });

            showMessage(signupForm, result.message);

            signupForm.reset();

            setTimeout(() => {
                window.location.href = "login.html";
            }, 1500);

        } catch (error) {
            showMessage(signupForm, error.message, true);
        }
    });
}

// LOGIN
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        try {
            const result = await sendRequest("/login", {
                email: email,
                password: password
            });

            sessionStorage.setItem("access_token", result.access_token);
            sessionStorage.setItem("current_user", JSON.stringify(result.user));

            showMessage(loginForm, "Login successful! Opening Home...");

            setTimeout(() => {
                window.location.href = "home.html";
            }, 1000);

        } catch (error) {
            showMessage(loginForm, error.message, true);
        }
    });
}
