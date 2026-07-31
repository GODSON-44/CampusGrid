(() => {
  // const BASE_URL = "https://campusgrid-f3z4.onrender.com";
  const BASE_URL = window.location.origin;
  const API = `${BASE_URL}/api`;
  let DEMO_MODE = false;

  const state = { products: [], history: [], staff: null };
  let html5QrCode = null;
  let scanning = false;
  let scanCooldown = false;
  let currentPending = null;

  //This is a shortcut for document.querySelector().
  const $ = (sel) => document.querySelector(sel);

  //This is a shortcut for selecting all matching elements.
//Normally:
//document.querySelectorAll(".item");
//returns a NodeList.
//Array.from(...) converts that NodeList into a normal JavaScript array.
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));


  const fmtMoney = (n) => `₹${Number(n).toFixed(2)}`;
  const fmtTime = (iso) => {
    try { return new Date(iso).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }); }
    catch { return iso; }
  };

  //for alerts of stock and unstock
  const escapeHtml = (str) => { const d = document.createElement('div'); d.textContent = str ?? ''; return d.innerHTML; };

  async function api(path, options = {}) {
    if (DEMO_MODE) return demoApi(path, options);
    const res = await fetch(`${API}${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!res.ok) {
      let msg = `Request failed (${res.status})`;
      try { const body = await res.json(); if (body?.message) msg = body.message; } catch {}
      const err = new Error(msg); err.status = res.status; throw err;
    }
    if (res.status === 204) return null;
    return res.json();
  }

  function toast(message, isError = false) {
    const el = $('#toast');
    el.textContent = message;
    el.className = 'toast show' + (isError ? ' error' : '');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('show'), 3200);
  }

  // ---------- session ----------
  async function initSession() {
    try {
      const response = await api("/staff/profile");
        state.staff = response.user;
        renderStaff(response.user);
    } catch (err) {
      if (err.status === 401) { window.location.href = 'index.html'; return; }
      DEMO_MODE = true;
      $('#demo-chip').style.display = 'inline-block';
      state.staff = { name: 'Demo Staff', role: 'counter staff' };
      renderStaff(state.staff);
    }
  }

  function renderStaff(staff) {
    $('#staff-name').textContent = staff.name || 'Staff';
    $('#staff-role').textContent = staff.role || '';
    $('#staff-avatar').textContent = (staff.name || 'S').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  }

  $('#logout-btn').addEventListener('click', async () => {
    try { if (!DEMO_MODE) await api('/logout', { method: 'POST' }); } catch {}
    window.location.href = 'index.html';
  });

  // ---------- nav ----------
  const titles = {
    products: ['Products', "Add new items and toggle stock availability for students"],
    scan: ['Scan & History', "Scan a student's QR code to record a purchase, and track recent transactions"],
  };
  $$('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const view = btn.dataset.view;
      $$('.view').forEach(v => v.classList.remove('active'));
      $(`#view-${view}`).classList.add('active');
      $$('.page-title')[0] && null;
      document.querySelector(`#view-${view} .page-title`).textContent = titles[view][0];
      document.querySelector(`#view-${view} .page-sub`).textContent = titles[view][1];
      if (view !== 'scan' && scanning) stopScanner();
    });
  });

  // ---------- products ----------
  async function loadProducts() {
    try {
        const { products } = await api("/products");
        state.products = products;
        renderProducts();
    } catch (err) {
        toast("Could not load products: " + err.message, true);
    }
}

  function renderProducts() {
    const grid = $('#product-grid');
    $('#product-count').textContent = state.products.length;
    $('#products-empty').style.display = state.products.length ? 'none' : 'block';
    grid.innerHTML = state.products.map(p => `
      <div class="product-card ${p.inStock ? '' : 'out'}" data-id="${p.id}">
        <div class="stock-row"><span class="stock-dot"></span>${p.inStock ? 'In stock' : 'Out of stock'}</div>
        <div class="product-name">${escapeHtml(p.name)}</div>
        <div class="product-desc">${escapeHtml(p.description || '')}</div>
        <div class="product-price">${fmtMoney(p.price)}</div>
        <div class="product-foot">
          <span style="font-size:11px;color:var(--text-faint);font-weight:600;">Toggle stock</span>
          <label class="switch">
            <input type="checkbox" ${p.inStock ? 'checked' : ''} data-toggle="${p.id}">
            <span class="switch-track"></span>
          </label>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('[data-toggle]').forEach(input => {
      input.addEventListener('change', (e) => toggleProduct(e.target.dataset.toggle, e.target.checked, e.target));
    });
  }

  $('#add-product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('#add-product-btn');
    const name = $('#p-name').value.trim();
    const price = parseFloat($('#p-price').value);
    const description = $('#p-desc').value.trim();
    if (!name || isNaN(price) || price < 0) { toast('Enter a valid name and price', true); return; }

    btn.disabled = true; btn.textContent = 'Adding…';
    try {
      const { product } = await api("/products", {
            method: "POST",
            body: JSON.stringify({ name, price, description })
        });
        state.products.unshift(product);
        renderProducts();
        e.target.reset();
        toast(`${product.name} added to the store`);
    } catch (err) {
      toast('Could not add product: ' + err.message, true);
    } finally {
      btn.disabled = false; btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 5v14M5 12h14"/></svg> Add product';
    }
  });

  async function toggleProduct(id, nextValue, inputEl) {
    const product = state.products.find(p => String(p.id) === String(id));
    const card = inputEl.closest('.product-card');
    try {
      await api(`/products/${id}/status`, { method: 'PATCH', body: JSON.stringify({ inStock: nextValue }) });
      if (product) product.inStock = nextValue;
      card.classList.toggle('out', !nextValue);
      card.querySelector('.stock-row').innerHTML = `<span class="stock-dot"></span>${nextValue ? 'In stock' : 'Out of stock'}`;
      toast(`${product?.name || 'Product'} marked ${nextValue ? 'in stock' : 'out of stock'}`);
    } catch (err) {
      inputEl.checked = !nextValue;
      toast('Could not update stock: ' + err.message, true);
    }
  }

  $('#refresh-products').addEventListener('click', loadProducts);

  // ---------- scan & purchase ----------
  $('#start-scan-btn').addEventListener('click', startScanner);
  $('#stop-scan-btn').addEventListener('click', stopScanner);

  function startScanner() {
    if (scanning) return;
    if (typeof Html5Qrcode === 'undefined') { toast('Scanner library failed to load — check your connection', true); return; }
    html5QrCode = new Html5Qrcode('qr-reader');
    scanning = true;
    $('#start-scan-btn').style.display = 'none';
    $('#stop-scan-btn').style.display = 'inline-flex';
    setScanStatus('Scanning… point the camera at the student\'s QR code', 'neutral');

    html5QrCode.start(
      { facingMode: 'environment' },
      { fps: 10,},
      onScanSuccess,
      () => {}
    ).catch(err => {
      scanning = false;
      $('#start-scan-btn').style.display = 'inline-flex';
      $('#stop-scan-btn').style.display = 'none';
      setScanStatus('Camera unavailable', 'error');
      toast('Could not start camera: ' + err, true);
    });
  }

  function stopScanner() {
    if (!scanning || !html5QrCode) return;
    html5QrCode.stop().then(() => html5QrCode.clear()).catch(() => {});
    scanning = false;
    $('#start-scan-btn').style.display = 'inline-flex';
    $('#stop-scan-btn').style.display = 'none';
    setScanStatus('Camera idle — tap start to begin scanning', 'neutral');
  }

  function setScanStatus(text, kind) {
    const el = $('#scan-status');
    el.textContent = text;
    el.className = 'scan-status' + (kind === 'success' ? ' success' : kind === 'error' ? ' error' : '');
  }

  // clear green/red border + checkmark/cross flag
  function flashResult(type) {
    const wrap = $('#scanner-view-wrap');
    const flag = $('#result-flag');
    const icon = $('#result-icon');
    wrap.classList.remove('scan-success', 'scan-error');
    flag.classList.remove('show', 'success', 'error');
    void wrap.offsetWidth; // restart animation
    wrap.classList.add(type === 'success' ? 'scan-success' : 'scan-error');
    flag.classList.add(type, 'show');
    icon.innerHTML = type === 'success'
      ? '<polyline points="20 6 9 17 4 12"/>'
      : '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>';
    setTimeout(() => {
      wrap.classList.remove('scan-success', 'scan-error');
      flag.classList.remove('show');
    }, 1300);
  }

  function onScanSuccess(decodedText) {
    if (scanCooldown) return;
    let payload;
    try { payload = JSON.parse(decodedText); }
    catch {
      flashResult('error');
      setScanStatus('Invalid QR code — not a purchase code', 'error');
      toast('QR code is not a valid purchase code', true);
      return;
    }

    if (!payload.token) {
        flashResult('error');
        setScanStatus('QR code missing token', 'error');
        toast('QR code is missing token', true);
        return;
    }

    scanCooldown = true;

    (async () => {
        try {

            const response = await api(`/pending/${payload.token}`);

            flashResult("success");

            setScanStatus(
                `Scan successful — ${response.student.roll}`,
                "success"
            );

            stopScanner();

            renderSlip({
                token: payload.token,
                ...response
            });

        } catch (err) {

            flashResult("error");

            setScanStatus(err.message, "error");

            toast(err.message, true);

        } finally {

            setTimeout(() => {
                scanCooldown = false;
            }, 800);

        }
    })();
  }

  function renderSlip(payload) {

    const student = payload.student;

    const itemsHtml = payload.items.map(item => `
        <div class="slip-row">
            <span class="k">
                ${escapeHtml(item.name)}
                × ${item.quantity}
            </span>

            <span class="v">
                ${fmtMoney(item.subtotal)}
            </span>
        </div>
    `).join("");

    $('#slip-body').innerHTML = `
    <div class="slip-card" id="slip-card">

            <div class="slip-row">
                <span class="k">Student</span>
                <span class="v">${escapeHtml(student.name)}</span>
            </div>

            <div class="slip-row">
                <span class="k">Roll</span>
                <span class="v">${escapeHtml(student.roll)}</span>
            </div>

            <div class="slip-row">
                <span class="k">Branch</span>
                <span class="v">${escapeHtml(student.branch)}</span>
            </div>

            <hr>

            ${itemsHtml}

            <hr>

            <div class="slip-total">
                <span class="k">Total</span>
                <span class="v">${fmtMoney(payload.totalAmount)}</span>
            </div>

        </div>

        <div class="slip-actions">
            <button class="btn btn-danger-outline" id="slip-cancel">
                Discard
            </button>

            <button class="btn btn-primary" id="slip-confirm">
                Confirm Purchase
            </button>
        </div>
    `;

    $("#slip-cancel").addEventListener("click", resetSlip);

    $("#slip-confirm").addEventListener("click", () => {
        confirmPurchase(payload.token);
    });

}

  function resetSlip() {
    $('#slip-body').innerHTML = `
      <div class="slip-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="4" width="7" height="7"/><rect x="13" y="4" width="7" height="7"/><rect x="4" y="13" width="7" height="7"/><path d="M13 13h3v3h-3zM17 17h3v3h-3zM13 17h1v1h-1zM17 13h1v1h-1z"/></svg>
        Scan a student's QR code to see purchase details here.
      </div>`;
  }

  async function confirmPurchase(token) {

    const btn = $("#slip-confirm");
    const card = $("#slip-card");

    btn.disabled = true;
    btn.textContent = "Recording...";

    try {

        const response = await api("/purchases", {
            method: "POST",
            body: JSON.stringify({
                token
            })
        });

        card.classList.add("slip-success");

        toast(
            `Purchase #${response.purchaseId} recorded successfully`
        );

        resetSlip();

        // We'll enable this after we build the history API
        await loadHistory();

    } catch (err) {

        card.classList.add("slip-error");

        toast(
            "Could not record purchase: " + err.message,
            true
        );

        btn.disabled = false;
        btn.textContent = "Confirm Purchase";

    }

}

  // ---------- history ----------
  async function loadHistory(highlightId = null) {

    try {

        const response = await api("/purchases/history?limit=50");

        state.history = response.history;

        renderHistory(highlightId);

    } catch (err) {

        toast(err.message, true);

    }

}

  function renderHistory(highlightId = null) {

    const body = $("#history-body");
    const empty = $("#history-empty");

    body.innerHTML = "";

    if (!state.history.length) {
        empty.style.display = "block";
        return;
    }

    empty.style.display = "none";

    state.history.forEach(history => {

        const products = history.products
            .map(product =>
                `${escapeHtml(product.name)} × ${product.quantity}`
            )
            .join("<br>");

        body.insertAdjacentHTML(
            "beforeend",
            `
            <tr ${highlightId === history.id ? 'class="row-new"' : ""}>
                <td>${fmtTime(history.createdAt)}</td>

                <td>
                    <strong>${escapeHtml(history.student.name)}</strong>
                    <br>
                    <small>${escapeHtml(history.student.roll)}</small>
                </td>

                <td>
                    ${products}
                </td>

                <td class="amount" style="text-align:right;">
                    ${fmtMoney(history.totalAmount)}
                </td>
            </tr>
            `
        );

    });

}

  $('#refresh-history').addEventListener('click', loadHistory);

  // ---------- demo mode mock backend ----------
  function demoApi(path, options) {
    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body) : null;

    if (path === '/products' && method === 'GET') {
      if (!state.products.length) {
        state.products = [
          { id: 'p1', name: 'Maggi Noodles', price: 25, description: 'Masala, 2-min pack', inStock: true, createdAt: new Date().toISOString() },
          { id: 'p2', name: 'Amul Milk 500ml', price: 30, description: 'Chilled', inStock: true, createdAt: new Date().toISOString() },
          { id: 'p3', name: 'Parle-G Biscuit', price: 10, description: '', inStock: false, createdAt: new Date().toISOString() },
        ];
      }
      return Promise.resolve(state.products);
    }
    if (path === '/products' && method === 'POST') {
      const created = { id: 'p' + Date.now(), inStock: true, createdAt: new Date().toISOString(), ...body };
      return Promise.resolve(created);
    }
    if (/^\/products\/.+\/status$/.test(path) && method === 'PATCH') {
      return Promise.resolve({ id: path.split('/')[2], inStock: body.inStock });
    }
    if (path.startsWith('/purchases/history')) {
      return Promise.resolve(state.history);
    }
    if (path === '/purchases' && method === 'POST') {
      const product = state.products.find(p => String(p.id) === String(body.productId));
      const record = {
        id: 'h' + Date.now(),
        rollNumber: body.rollNumber,
        productId: body.productId,
        productName: product?.name || 'Product',
        amount: body.amount,
        staffName: state.staff?.name || 'Demo Staff',
        createdAt: new Date().toISOString(),
      };
      return Promise.resolve(record);
    }
    return Promise.resolve(null);
  }

  // ---------- init ----------
  (async function init() {
    await initSession();
    await Promise.all([loadProducts(), loadHistory()]);
  })();
  window.testScan = onScanSuccess;
})();