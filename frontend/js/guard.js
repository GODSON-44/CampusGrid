// Logout
async function logout() {
    try {
        const response = await fetch(BASE_URL+"/api/logout", {
            method: "POST",
            credentials: "include"
        });

        if (response.ok) {
            window.location.href = "./index.html";
        }
    } catch (err) {
        console.error("Failed to complete logout operation.", err);
    }
}

// Live Clock
function updateTime() {
    const now = new Date();

    const timeString = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });

    document.getElementById("liveClock").textContent = timeString;
}

setInterval(updateTime, 1000);
updateTime();

// Table Search Filter
document.getElementById("tableSearch").addEventListener("keyup", function () {

    const value = this.value.toLowerCase();

    const rows = document.querySelectorAll("#table tr");

    rows.forEach(row => {

        const text = row.textContent.toLowerCase();

        row.style.display = text.includes(value) ? "" : "none";

    });

});

// Scanner UI Controls
const scanBtn = document.getElementById("cam");
const stopBtn = document.getElementById("stop");
const placeholderImg = document.getElementById("image");
const scannerBox = document.getElementById("reader");
const badgeStatus = document.getElementById("scanStatus");

if (scanBtn && stopBtn) {

    scanBtn.addEventListener("click", () => {

        placeholderImg.style.display = "none";
        scannerBox.style.display = "block";

        badgeStatus.className =
            "badge bg-danger-subtle text-danger px-2.5 py-1.5 rounded-pill";

        badgeStatus.textContent = "Active Scanning";

    });

    stopBtn.addEventListener("click", () => {

        placeholderImg.style.display = "block";
        scannerBox.style.display = "none";

        badgeStatus.className =
            "badge bg-secondary-subtle text-secondary px-2.5 py-1.5 rounded-pill";

        badgeStatus.textContent = "Idle";

    });

}

async function fetchUserProfile() {
    try{

        const response = await fetch(BASE_URL+"/api/guard/profile", {
            credentials:"include"
        })
        console.log(response)

        if(response.ok){

            getData();
        }else{
            window.location.href = "./index.html";
        }

    }catch(err){
        console.log(err)
    }
    
}

async function getData(){

     const dataResponse = await fetch(BASE_URL+"/api/get-entry", {
                credentials:"include"
            })
            
            const data = await dataResponse.json()
            console.log(data)

            table.innerHTML = "";
            let curr = 1;
            data.entries.forEach(entry => {
            const outTime = new Date(entry.outTime).toLocaleTimeString();

            const inTime = entry.inTime
                ? new Date(entry.inTime).toLocaleTimeString()
                : "--";

            table.innerHTML += `
                <tr class="border-bottom">
                    <td>${curr}</td>
                    <td>${entry.name}</td>
                    <td>${entry.roll}</td>
                    <td>${entry.phone}</td>
                    <td>${entry.branch}</td>
                    <td class="fw-bold text-success">${entry.reason}</td>
                    <td class="text-end text-muted small">
                        ${outTime}
                    </td>
                    <td class="text-end text-muted small">
                        ${inTime}
                    </td>
                </tr>
            `;

            curr++;
        });

}

// Logout Button
document.getElementById("logoutBtn").addEventListener("click", logout);
window.onload = function () {

    fetchUserProfile();

};