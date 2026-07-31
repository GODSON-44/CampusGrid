// ================================
// CONFIGURATION
// ================================

// const BASE_URL = "https://campusgrid-f3z4.onrender.com";
const BASE_URL = window.location.origin;
let currentPendingToken = null;
let pollingInterval = null;

const products = [];

const cart = new Map();



// ================================
// API HELPER
// ================================

async function api(path, options = {}) {

    const response = await fetch(`${BASE_URL}${path}`, {
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        ...options
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Something went wrong.");
    }

    return data;
}


async function fetchUserProfile(){
    try {
        console.log("in fetch student")
        const response = await fetch(BASE_URL+"/api/student/profile", {
            credentials:"include"
        })
        console.log(response)
        if(!response.ok){
            window.location.href = "./index.html";
            console.warn("Unauthorized");
        }
        
    } catch (error) {
        window.location.href = "./index.html";
        console.log(error);
    }
}

// ================================
// LOAD PRODUCTS
// ================================

async function loadProducts() {

    try {
    
        const data = await api("/api/products/students");
        // const resp = await data.json()
        
        console.log(data)
        // console.log(resp)
        products.length = 0;

        products.push(...data.products);

        renderProducts();

    }

    catch (err) {

        alert(err.message);

    }

}



// ================================
// RENDER PRODUCTS
// ================================

function renderProducts() {

    const container =
        document.getElementById("products-container");

    container.innerHTML = "";

    if (products.length === 0) {

        container.innerHTML = `

            <div class="glass-card rounded-3xl p-10 text-center">

                <h3 class="font-bold text-lg">

                    No Products Available

                </h3>

                <p class="text-slate-400 mt-2">

                    Please check again later.

                </p>

            </div>

        `;

        return;

    }


    container.innerHTML = products.map(product => `

        <div
            class="glass-card p-4 rounded-3xl flex items-center justify-between shadow-sm border border-slate-100">

            <div class="flex-1">

                <h3
                    class="font-semibold text-slate-800">

                    ${product.name}

                </h3>

                <p
                    class="text-sm text-slate-400 mt-1">

                    ${product.description || "No description"}

                </p>

                <div
                    class="flex items-center gap-3 mt-3">

                    <span
                        class="font-bold text-indigo-600">

                        ₹${product.price}

                    </span>

                    <span
                        class="text-[10px] uppercase font-bold px-2 py-1 rounded-full
                        ${product.inStock
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"}">

                        ${product.inStock
                            ? "In Stock"
                            : "Out Of Stock"}

                    </span>

                </div>

            </div>


            <div
                class="flex items-center gap-3">

                <div
                    class="flex items-center bg-slate-50 rounded-xl border">

                    <button
                        onclick="changeQty(${product.id},-1)"
                        class="px-3 py-1">

                        -

                    </button>

                    <span
                        id="qty-${product.id}"
                        class="w-8 text-center font-bold">

                        1

                    </span>

                    <button
                        onclick="changeQty(${product.id},1)"
                        class="px-3 py-1">

                        +

                    </button>

                </div>


                <button

                    onclick="addToCart(${product.id})"

                    ${!product.inStock ? "disabled" : ""}

                    class="bg-indigo-600
                    disabled:opacity-30
                    text-white
                    px-5
                    py-2
                    rounded-xl
                    hover:bg-indigo-700">

                    Add

                </button>

            </div>

        </div>

    `).join("");

}



// ================================
// QUANTITY
// ================================

window.changeQty = function (id, delta) {

    const qty =
        document.getElementById(`qty-${id}`);

    let value =
        Number(qty.innerText);

    value += delta;

    if (value < 1)
        value = 1;

    qty.innerText = value;

};


// ================================
// RENDER CART
// ================================

function renderCart() {

    const cartList =
        document.getElementById("cart-items");

    const totalElement =
        document.querySelector("#cart-total span:last-child");

    const generateButton =
        document.getElementById("btn-generate");

    if (cart.size === 0) {

        cartList.innerHTML = `

            <div class="text-center py-8">

                <div class="text-5xl mb-3">
                    🛒
                </div>

                <p class="text-slate-500 font-medium">
                    Your cart is empty
                </p>

                <p class="text-xs text-slate-400 mt-2">
                    Add products to generate your QR.
                </p>

            </div>

        `;

        totalElement.innerText = "₹0";

        generateButton.disabled = true;

        return;

    }

    let total = 0;

    cartList.innerHTML =
        Array.from(cart.values())
        .map(item => {

            const subtotal =
                item.price * item.quantity;

            total += subtotal;

            return `

                <div
                    class="flex justify-between items-center border rounded-2xl p-3">

                    <div>

                        <p class="font-semibold">

                            ${item.name}

                        </p>

                        <p class="text-xs text-slate-400">

                            ₹${item.price} × ${item.quantity}

                        </p>

                    </div>

                    <div class="text-right">

                        <p
                            class="font-bold text-indigo-600">

                            ₹${subtotal}

                        </p>

                        <button

                            onclick="removeFromCart(${item.productId})"

                            class="text-xs text-red-500 hover:underline mt-1">

                            Remove

                        </button>

                    </div>

                </div>

            `;

        }).join("");

    totalElement.innerText =
        `₹${total}`;

    generateButton.disabled = false;

}


async function generateQRCode() {

    if (cart.size === 0)
        return;

    const button =
        document.getElementById("btn-generate");

    button.disabled = true;
    button.innerText = "Generating...";

    try {

        const items =
            Array.from(cart.values()).map(item => ({
                productId: item.productId,
                quantity: item.quantity
            }));

        const response = await api("/api/pending", {
            method: "POST",
            body: JSON.stringify({ items })
        });

        currentPendingToken = response.token;

        showQRCode();

        startPolling();

    } catch (err) {

        alert(err.message);

    } finally {

        button.disabled = false;
        button.innerText = "Generate QR";

    }
}


function showQRCode() {

    document
        .getElementById("qr-modal")
        .classList
        .remove("hidden");

    const qr =
        document.getElementById("qrcode");

    qr.innerHTML = "";

    new QRCode(qr, {
        text: JSON.stringify({
            token: currentPendingToken
        }),
        width: 200,
        height: 200
    });

}

function startPolling() {

    pollingInterval = setInterval(checkOrderStatus, 3000);

}


async function checkOrderStatus() {

    if (!currentPendingToken)
        return;

    try {

        const response =
            await api(`/api/pending/students/${currentPendingToken}`);

        if (!response.completed)
            return;

        clearInterval(pollingInterval);

        pollingInterval = null;

        currentPendingToken = null;

        document
            .getElementById("qr-modal")
            .classList
            .add("hidden");

        cart.clear();

        renderCart();

        loadProducts();

        alert("Purchase completed successfully!");

    }
    catch (err) {

        console.error(err);

    }

}



// ================================
// REMOVE FROM CART
// ================================

window.removeFromCart = function(id){

    cart.delete(id);

    renderCart();

}

// ================================
// CLEAR CART
// ================================

document
.getElementById("btn-clear")
.addEventListener("click",()=>{

    if(cart.size===0)
        return;

    if(!confirm("Clear the cart?"))
        return;

    cart.clear();

    renderCart();

});



// ================================
// CART HELPERS
// ================================

function getCartItems(){

    return Array.from(cart.values());

}


function getTotalAmount(){

    let total=0;

    cart.forEach(item=>{

        total+=
            item.price*
            item.quantity;

    });

    return total;

}


function getTotalItems(){

    let count=0;

    cart.forEach(item=>{

        count+=
            item.quantity;

    });

    return count;

}

document
    .getElementById("btn-generate")
    .addEventListener("click", generateQRCode);

document
    .getElementById("btn-clear")
    .addEventListener("click", () => {

        cart.clear();
        renderCart();

    });

document
    .getElementById("btn-cancel")
    .addEventListener("click", () => {

        clearInterval(pollingInterval);

        pollingInterval = null;
        currentPendingToken = null;

        document
            .getElementById("qr-modal")
            .classList
            .add("hidden");

    });

// loadProducts();
// renderCart();



// ================================
// ADD TO CART
// ================================

window.addToCart = function (id) {

    const product =
        products.find(p => p.id === id);

    const qty =
        Number(
            document.getElementById(`qty-${id}`).innerText
        );

    if (!product)
        return;

    if (cart.has(id)) {

        cart.get(id).quantity += qty;

    }

    else {

        cart.set(id, {

            productId: product.id,

            name: product.name,

            price: product.price,

            quantity: qty

        });

    }

    document.getElementById(`qty-${id}`).innerText = 1;

    renderCart();

};

window.onload = async function () {
    loadProducts();
    fetchUserProfile();
    renderCart();

};