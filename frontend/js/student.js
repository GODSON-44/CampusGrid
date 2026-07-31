// Global variables
const BASE_URL = "https://campusgrid-f3z4.onrender.com";
let currentStudentData = {
    name: "Authorizing...",
    roll: "--",
    phone: "--",
    p_mob: "--",
    branch: "--",
    detail: "Awaiting Session...",

    status: "Active Session",
    campusStatus: "fetching..",
    expenseAnalysis: {
        totalSpent: 0,
        totalItems: 0,
    },

    itemsBoughtList: []
};

let qrCodeInstance = null;
const escapeHtml = (str) => { const d = document.createElement('div'); d.textContent = str ?? ''; return d.innerHTML; };

// QR Payload
function getQRFormatString(user) {

    return `${user.name},${user.roll},${user.phone},${user.p_mob},${user.branch}`;
}

// Generate QR
function generateStudentQR(user) {

    if (
        !user ||
        user.name === "Authorizing..." ||
        user.name === "Guest Profile" ||
        !user.roll
    ) {

        document.getElementById("qrcode").innerHTML = `
            <div class="text-center text-slate-400 p-4 text-xs font-medium">
                🔓 <br>
                Please log in to generate badge
            </div>
        `;

        return;
    }

    const qrText = getQRFormatString(user);

    const preview =
        document.getElementById(
            "qr-format-preview"
        );

    if (preview) {
        preview.innerText = qrText;
    }

    const qrContainer =
        document.getElementById("qrcode");

    qrContainer.innerHTML = "";

    qrCodeInstance = new QRCode(qrContainer, {

        text: qrText,

        width: 220,
        height: 220,

        colorDark: "black",
        colorLight: "#ffffff",

        correctLevel: QRCode.CorrectLevel.H

    });
}

async function loadPurchaseHistory() {

    try {

        const response = await fetch(BASE_URL+"/purchases/history/student", {
            credentials:"include"
        });
        const data = await response.json()
        console.log(data.history)

        renderLedger(data.history);

    } catch (err) {

        console.error(err);

    }

}



// Render Purchase Ledger
async function renderLedger() {

    const tableBody =
        document.getElementById("ledger-table-body");

    const emptyState =
        document.getElementById("ledger-empty-state");

    // Keep this exactly as it is
    const resp = await fetch(
        `${BASE_URL}/api/get-campus-status?roll=${encodeURIComponent(currentStudentData.roll)}`,
        {
            credentials: "include",
        }
    );

    if (resp.ok) {

        const data = await resp.json();
        currentStudentData.campusStatus = data.campusStatus;

    } else {

        currentStudentData.campusStatus = "Server error!";

    }

    document.getElementById("campus-status-val").innerText =
        currentStudentData.status;

    const statusBadge =
        document.getElementById("status-badge");

    if (currentStudentData.campusStatus === "inCampus") {

        statusBadge.className =
            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 mt-1 border border-emerald-200";

        statusBadge.innerText = "In-Campus";

    } else if (currentStudentData.campusStatus === "outCampus") {

        statusBadge.className =
            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 mt-1 border border-rose-200";

        statusBadge.innerText = "Out-Campus";

    } else {

        statusBadge.className =
            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 text-gray-900 mt-1 border border-gray-300";

        statusBadge.innerText = currentStudentData.campusStatus;

        document.getElementById("campus-status-val").innerText =
            "Inactive Session";

    }

    // Load purchase history
    const historyResp = await fetch(
        `${BASE_URL}/api/purchases/history/student`,
        {
            credentials: "include",
        }
    );

    const historyData = await historyResp.json();

    const history = historyData.history;

    tableBody.innerHTML = "";

    if (!history || history.length === 0) {

        document.getElementById("total-spent-val").innerText = "₹0.00";
        document.getElementById("total-items-val").innerText = "0";

        emptyState.style.display = "flex";
        return;

    }

    emptyState.style.display = "none";

    let totalSpent = 0;
    let totalItems = 0;
    let serial = 1;

    history.forEach(purchase => {

        totalSpent += purchase.totalAmount;

        purchase.products.forEach(product => {

            totalItems += product.quantity;

            tableBody.insertAdjacentHTML(
                "beforeend",
                `
                <tr class="hover:bg-slate-50 transition-colors">

                    <td class="py-4 px-6 font-medium">
                        ${serial++}
                    </td>

                    <td class="py-4 px-6 font-semibold">
                        ${product.name}
                    </td>

                    <td class="py-4 px-6">
                        ₹${Number(product.price).toFixed(2)}
                    </td>

                    <td class="py-4 px-6">
                        ${product.quantity}
                    </td>

                    <td class="py-4 px-6 font-semibold">
                        ₹${Number(product.subtotal).toFixed(2)}
                    </td>

                    <td class="py-4 px-6 text-xs text-slate-400">
                        ${new Date(purchase.createdAt).toLocaleDateString("en-IN")}
                    </td>

                </tr>
                `
            );

        });

    });

    document.getElementById("total-spent-val").innerText =
        `₹${totalSpent.toFixed(2)}`;

    document.getElementById("total-items-val").innerText =
        totalItems;
}

// Update Student Details
function updateStudentVariables(user) {

    currentStudentData.name =
        user.name || "Guest Profile";

    currentStudentData.p_mob =
        user.p_mob || "N/A";

    currentStudentData.reason =
        "General Entry";

    if (user.detail) {

        currentStudentData.detail =
            user.detail;
    }

    if (user.roll)
        currentStudentData.roll = user.roll;

    if (user.phone)
        currentStudentData.phone = user.phone;

    if (user.branch)
        currentStudentData.branch = user.branch;



    if (user.expenseAnalysis)
        currentStudentData.expenseAnalysis =
            user.expenseAnalysis;

    if (user.itemsBoughtList)
        currentStudentData.itemsBoughtList =
            user.itemsBoughtList;

    document.getElementById("user-display").innerText =
        currentStudentData.name;

    document.getElementById("dash-title").innerText =
        `Welcome Back, ${currentStudentData.name.split(" ")[0]}!`;

    document.getElementById("dash-subtitle").innerText =
        currentStudentData.detail;

    document.getElementById("student-branch-badge").innerText =
        `Branch: ${currentStudentData.branch}`;

    document.getElementById("student-roll-badge").innerText =
        `Roll: ${currentStudentData.roll}`;

    generateStudentQR(currentStudentData);

    renderLedger();
}


// Fetch Student Profile
async function fetchUserProfile() {

    const statusBadge =
        document.getElementById("connection-status-badge");

    const statusDot =
        document.getElementById("status-dot");

    const statusText =
        document.getElementById("status-text");

    // const apiUrl =BASE_URL + "/api/student/profile";

    try {
        


        const response = await fetch(BASE_URL+"/api/student/profile", {
            credentials: "include"
        });
        // console.log(response)

        if (response.ok) {

            const user = await response.json();
            updateStudentVariables(user.user);

            statusBadge.className =
                "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 transition-all";

            statusDot.className =
                "w-1.5 h-1.5 rounded-full bg-emerald-500";

            statusText.innerText =
                "API Connected";

        } else {
            window.location.href = "./index.html";
            console.warn("Unauthorized");

            document.getElementById("user-display").innerText =
                "Session Expired";

            document.getElementById("dash-title").innerText =
                "Session Required";

            document.getElementById("dash-subtitle").innerText =
                "Please login again.";

            document.getElementById("qrcode").innerHTML = `
                <div class="text-center text-slate-400 p-4 text-xs font-semibold">
                    ⚠️ <br>
                    Authentication Needed
                </div>
            `;

            document.getElementById("qr-format-preview").innerText =
                "No active session.";

            statusBadge.className =
                "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100";

            statusDot.className =
                "w-1.5 h-1.5 rounded-full bg-amber-500";

            statusText.innerText =
                "No Session";
        }

    } catch (err) {

        console.error(err);

        document.getElementById("user-display").innerText =
            "Offline Mode";

        document.getElementById("dash-title").innerText =
            "Service Offline";

        document.getElementById("dash-subtitle").innerText =
            "Unable to connect to server.";

        document.getElementById("qrcode").innerHTML = `
            <div class="text-center text-slate-400 p-4 text-xs font-semibold">
                🔌 <br>
                Server Offline
            </div>
        `;

        document.getElementById("qr-format-preview").innerText =
            "Offline";

        statusBadge.className =
            "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200";

        statusDot.className =
            "w-1.5 h-1.5 rounded-full bg-slate-400";

        statusText.innerText =
            "Offline";
    }
}

async function loadProducts() {

    try {

    const response = await fetch(`${BASE_URL}/api/products/menu`, {
        credentials: "include"
    });

    const data = await response.json();

    console.log(data);

    renderProducts(data.products);


    } catch (err) {

        // toast(err.message, true);
        console.error(err);
        alert(err.message);


    }

}


function renderProducts(products) {

    const grid = document.getElementById("products-grid");

    grid.innerHTML = "";

    if (!products.length) {

        grid.innerHTML = `
            <div class="col-span-full text-center text-slate-400 py-8">
                No products available.
            </div>
        `;

        return;
    }

    products.forEach(product => {

        grid.insertAdjacentHTML(
            "beforeend",
            `
            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-100 ${!product.inStock ? "opacity-60" : ""}">

                <div class="flex justify-between items-center mb-2">

                    <span class="font-bold text-sm">
                        ${escapeHtml(product.name)}
                    </span>

                    <span class="text-xs font-bold text-indigo-600">
                        ₹${Number(product.price).toFixed(2)}
                    </span>

                </div>

                <p class="text-xs text-slate-400">
                    ${
                        product.description
                        ? escapeHtml(product.description)
                        : "No description available."
                    }
                </p>

                <div class="mt-3">

                    ${
                        product.inStock
                        ? `<span class="inline-flex items-center rounded-full bg-green-100 text-green-700 px-2 py-1 text-xs font-medium">
                                In Stock
                           </span>`
                        : `<span class="inline-flex items-center rounded-full bg-red-100 text-red-700 px-2 py-1 text-xs font-medium">
                                Out of Stock
                           </span>`
                    }

                </div>

            </div>
            `
        );

    });

}


// Logout
async function logout() {

    try {

        const apiUrl =BASE_URL+"/api/logout"

        await fetch(apiUrl, {
            method: "POST",
            credentials:"include"
        });

        window.location.href = "./index.html";

    } catch (err) {

        console.error(err);

        window.location.href = "./index.html";
    }
}

document.getElementById("go-order-btn").addEventListener("click", () => {
    window.location.href = "order.html";
});


// Page Load
window.onload = async () => {

    await fetchUserProfile();

    await loadProducts();

};