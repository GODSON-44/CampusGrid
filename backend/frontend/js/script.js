// const BASE_URL = "https://campusgrid-f3z4.onrender.com";
const BASE_URL = window.location.origin;

const cam = document.getElementById("cam");
const stop = document.getElementById("stop");
const frame = document.getElementById("image");
const qrframe = document.getElementById("reader");
const purpose = document.getElementById("prps");
const table = document.getElementById("table");

const settext =
    document.querySelector(".card-text") ||
    document.getElementById("network-status");

let curr = 0;
let isCooldown = false;

// -----------------------------
// Success Modal
// -----------------------------
function showSuccessModal(name, roll, imgUrl) {

    const modal = document.getElementById("scan-success-modal");

    document.getElementById("modal-name").innerText = name;
    document.getElementById("modal-roll").innerText = roll;

    const img = document.getElementById("modal-img");

    img.src = imgUrl || "./avatar.png";

    modal.classList.remove("d-none");
    modal.classList.add("d-flex");

    setTimeout(() => {

        modal.classList.remove("d-flex");
        modal.classList.add("d-none");

    }, 4500);
}

// -----------------------------
// QR Scan Success
// -----------------------------
async function onScanSuccess(decodedText) {

    if (isCooldown) return;

    isCooldown = true;

    const now = new Date();

    const [
        name = "--",
        roll = "--",
        phone = "--",
        pmob = "--",
        branch = "--"
    ] = decodedText.split(",");
    console.log("inside onSracn")
    if(name == '--' || roll == '--' || phone == '--' || pmob == '--' || branch == '--'){
        return alert("Invalid QR code!")
    }

    const reason =
        purpose.value.trim() || "General Entry";

    let profilePicUrl =
        `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff&size=128`;


    if (roll !== "--") {

        try {

            // const safeRoll = encodeURIComponent(roll);

            const response = await fetch(
                `${BASE_URL}/api/student-image?roll=${encodeURIComponent(roll)}`,
                {
                    credentials: "include"
                }
            );


            if (response.ok) {

                const image = await response.json();

                if (image.profile_pic_url) {
                    profilePicUrl = image.profile_pic_url;
                }

            }

        } catch (err) {

            console.error(
                "Failed to retrieve profile picture:",
                err
            );

        }

    }

    showSuccessModal(
        name,
        roll,
        profilePicUrl
    );

    if (settext) {
        settext.innerText = `${name} - ${roll}`;
    }

    purpose.value = "";

    try {

        if (typeof post === "function") {

            await post({
                name,
                roll,
                phone,
                pmob,
                branch,
                reason
            });
            getData();

        }

        // if (typeof get === "function") {
        //     await get();
        // }

    } catch (err) {

        console.error(
            "Backend sync failed:",
            err
        );

    }

    setTimeout(() => {

        isCooldown = false;

        if (settext) {
            settext.innerText =
                "Ready for next scan...";
        }

    }, 2500);

}

// -----------------------------
// QR Scanner
// -----------------------------
const html5QrCode =
    new Html5Qrcode("reader");

cam.addEventListener("click", async () => {

    if (purpose.value.trim() === "") {

        alert("Enter purpose for the first scan!");

        return;
    }

    if (frame) {
        frame.remove();
    }

    try {

        await html5QrCode.start(
            { facingMode: "environment" },
            { fps: 16 },
            onScanSuccess
        );

        document.getElementById("reader").style.display = "block";

    } catch (err) {

        console.error(
            "Camera failed to start:",
            err
        );

        alert(
            "Camera failed to start. Please allow camera permission."
        );

        if (frame) {
            qrframe.before(frame);
        }

    }

});

stop.addEventListener("click", async () => {

    try {

        await html5QrCode.stop();

        if (settext) {
            settext.innerText =
                "Scanner Stopped";
        }

    } catch {

        console.log(
            "Scanner already stopped."
        );

    }

    if (frame) {
        qrframe.before(frame);
    }

});