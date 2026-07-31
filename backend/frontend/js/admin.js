// Fetch current user profile and unlock admin panel
// BASE_URL = "https://campusgrid-f3z4.onrender.com"
const BASE_URL = window.location.origin;
async function fetchUserProfile() {
    try {
        const response = await fetch(
            BASE_URL+"/api/admin/profile",
            {
                credentials: "include"
            }
        );

        if (response.ok) {
            const user = await response.json();
            console.log(user);
            if (user.role !== "admin") {
                window.location.href = "./index.html";
                return;
            }

            document.getElementById("user-display").innerText =
                user.userDetail.fullName;

            document.getElementById("dash-title").innerText =
                `Welcome, ${user.userDetail.fullName.split(" ")[0]}`;

            document.getElementById("dash-subtitle").innerText =
                `Department assignment: ${user.details}`;

            document
                .getElementById("registration-panel")
                .classList.remove("hidden");
        } else {
            window.location.href = "./index.html";
            console.log("invalid")
        }

    } catch (err) {
        console.error(err);
        // window.location.href = "./index.html";
    }
}


// Logout
async function logout() {
    try {
        await fetch(
            BASE_URL+"/api/logout",
            {
                method: "POST",
                credentials: "include"
            }
        );

        window.location.href = "./index.html";

    } catch (err) {
        console.error("Failed to logout.", err);
    }
}



// Register Student
async function registerStudent(e) {
    console.log("registerStudent called");
    e.preventDefault();

    const btn = document.getElementById("reg-submit-btn");
    const statusText = document.getElementById("reg-status");

    let profilePicUrl = "/default-avatar.png";

    btn.innerText = "Processing...";
    btn.disabled = true;

    try {
        // ==========================
        // Upload Image to Backend
        // ==========================
        const fileInput = document.getElementById("reg-pic");
        const file = fileInput.files[0];

        if (file) {
            const imageForm = new FormData();
            imageForm.append("image", file);

            const uploadResponse = await fetch(
                BASE_URL+"/api/upload",
                {
                    method: "POST",
                    body: imageForm
                }
            );

            const uploadData = await uploadResponse.json();

            if (!uploadResponse.ok || !uploadData.success) {
                throw new Error(uploadData.message || "Image upload failed");
            }

            profilePicUrl = uploadData.imageUrl;
        }

        // ==========================
        // Build Payload
        // ==========================
        const payload = {
            userId: document.getElementById("reg-id").value.trim(),
            password: document.getElementById("reg-pass").value,
            name: document.getElementById("reg-name").value.trim(),
            roll: document.getElementById("reg-roll").value.trim(),
            branch: document.getElementById("reg-branch").value,
            profile_pic_url: profilePicUrl,
            phone: document.getElementById("reg-phone").value.trim(),
            p_mob: document.getElementById("reg-pmob").value.trim(),
            detail: document.getElementById("reg-detail").value.trim()
        };

        // ==========================
        // Register Student
        // ==========================
        const response = await fetch(
            BASE_URL+"/api/admin/register-student",
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Registration failed");
        }

        statusText.innerText = "Student registered successfully.";
        statusText.className = "text-green-600 text-sm mt-3";

        document.getElementById("student-reg-form").reset();

    } catch (err) {

        console.error(err);

        statusText.innerText = err.message || "Server error. Please try again.";
        statusText.className = "text-red-600 text-sm mt-3";

    } finally {

        btn.disabled = false;
        btn.innerText = "Register Student";

        setTimeout(() => {
            statusText.innerText = "";
        }, 3000);

    }
}

document.getElementById("student-reg-form").addEventListener("submit", registerStudent);

window.onload = fetchUserProfile;