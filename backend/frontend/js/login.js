let currentRole = "student";
console.log("login.js loaded");
// const BASE_URL = "https://campusgrid-f3z4.onrender.com"
const BASE_URL = window.location.origin;

// Change Role
function setRole(role) {
    currentRole = role;

    document.querySelectorAll(".role-tab").forEach(tab => {
        tab.classList.remove(
            "bg-white",
            "shadow-sm",
            "text-indigo-600"
        );

        tab.classList.add("text-slate-500");
    });

    const activeTab = document.getElementById(`tab-${role}`);

    activeTab.classList.add(
        "bg-white",
        "shadow-sm",
        "text-indigo-600"
    );

    activeTab.classList.remove("text-slate-500");

    const labelMap = {
        student: "Student ID",
        guard: "Guard Badge ID",
        staff: "Staff ID",
    };

    document.getElementById("id-label").innerText = labelMap[role];

    hideMessages();
}

// Hide Messages
function hideMessages() {
    document.getElementById("error-box").classList.add("hidden");
    document.getElementById("success-box").classList.add("hidden");
}

// Form Submit
document
    .getElementById("auth-form")
    .addEventListener("submit", handleAuth);

async function handleAuth(e) {
    e.preventDefault();

    hideMessages();

    const id = document.getElementById("user-id").value.trim();
    const password = document.getElementById("password").value;

    const errorBox = document.getElementById("error-box");
    const successBox = document.getElementById("success-box");
    if(id == "ADMIN"){
        currentRole = "admin"//important
    }

    try {
        const response = await fetch(
            BASE_URL+"/api/login",
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    userId:id,
                    password,
                    role: currentRole
                })
            }
        );

        const data = await response.json();

        // console.log(data)
        if(response.ok && data.success) {
            successBox.innerText =
                data.message || "Login successful.";

            successBox.classList.remove("hidden");
            console.log(currentRole)

            setTimeout(() => {
                switch (currentRole) {
                    case "student":
                        window.location.href = "./student.html";
                        break;

                    case "guard":
                        window.location.href = "./guard.html";
                        break;

                    case "staff":
                        window.location.href = "./staff.html";
                        break;

                    case "admin":
                        window.location.href = "./admin.html";
                        break;

                    default:
                        window.location.href = "./index.html";
                }
            }, 1000);
        } else {
            errorBox.innerText =
                data.message || "Authentication failed.";

            errorBox.classList.remove("hidden");
        }
    } catch (err) {
        console.error(err);

        errorBox.innerText = "Server connection failed.";

        errorBox.classList.remove("hidden");
    }
}