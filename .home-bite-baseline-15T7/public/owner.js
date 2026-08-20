

async function changeOwnerPassword(){
  const current_password=prompt("Enter current password:");
  if(current_password===null)return;

  const new_password=prompt("Enter new password (minimum 6 characters):");
  if(new_password===null)return;

  const confirm_password=prompt("Confirm new password:");
  if(confirm_password===null)return;

  try{
    const d=await api("/api/account/password",{
      method:"PATCH",
      body:JSON.stringify({
        current_password,
        new_password,
        confirm_password
      })
    });
    alert(d.message||"Password changed successfully");
  }catch(e){
    alert(e.message||"Unable to change password");
  }
}

let token = localStorage.getItem("hb_token");

if (!token) {
  document.body.innerHTML = `
    <div style="padding:30px;font-family:Arial;text-align:center">
      <h2>Owner Login Required</h2>
      <p>Please login from the HOME BITE app first.</p>
    </div>`;
}

async function api(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + token,
      ...(options.headers || {})
    }
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

function addPasswordButton(){
  if(document.getElementById("changePasswordBtn"))return;
  const b=document.createElement("button");
  b.id="changePasswordBtn";
  b.className="primary";
  b.textContent="🔐 Change Password";
  b.onclick=changeOwnerPassword;
  document.body.insertBefore(b,document.body.firstChild);
}
setTimeout(addPasswordButton,100);

async function loadDashboard() {
  try {
    const d = await api("/api/owner/dashboard");

    document.getElementById("stats").innerHTML = `
      <div class="stat"><b>${d.orders}</b><span>Orders</span></div>
      <div class="stat"><b>₹${Number(d.revenue).toLocaleString("en-IN")}</b><span>Revenue</span></div>
      <div class="stat"><b>${d.restaurants}</b><span>Restaurants</span></div>
      <div class="stat"><b>${d.kitchens}</b><span>Home Kitchens</span></div>
      <div class="stat"><b>${d.delivery}</b><span>Delivery</span></div>
      <div class="stat"><b>${d.customers}</b><span>Customers</span></div>
    `;
  } catch (e) {
    document.getElementById("stats").innerHTML =
      `<div class="error">${e.message}</div>`;
  }
}

function showSection(section) {
  const panel = document.getElementById("panel");

  const titles = {
    franchise: "Franchise Management",
    shops: "Restaurant & Kitchen Management",
    delivery: "Delivery Partners",
    areas: "Area Management",
    orders: "Order Management",
    users: "User Management"
  };

  panel.innerHTML = `
    <div class="section-card">
      <span class="tag">MANAGEMENT</span>
      <h2>${titles[section]}</h2>
      <p>Loading ${titles[section].toLowerCase()}...</p>
      <div id="sectionData"></div>
    </div>
  `;

  loadSection(section);
}

async function loadSection(section) {
  const box = document.getElementById("sectionData");

  try {
    if (section === "franchise") {
      const data = await api("/api/owner/franchises");

      box.innerHTML = `
        <button class="primary" onclick="addFranchise()">+ Add Franchise</button>
        ${data.map(x => `
          <div class="list-item">
            <div>
              <b>${x.name}</b>
              <small>${x.code} · ${x.city || ""}</small>
            </div>
            <span>${x.active ? "ACTIVE" : "DISABLED"}</span>
          </div>
        `).join("")}
      `;
    }

    if (section === "shops") {
      const data = await api("/api/owner/shops");

      box.innerHTML = `
        <button class="primary" onclick="addRestaurant()">
          + Add Restaurant
        </button>

        <div style="margin-top:18px">
        ${
          data.length
            ? data.map(x => `
              <div class="list-item">
                <div>
                  <b>${x.name}</b>
                  <small>
                    ${x.type} · ${x.owner_name || "No owner"}
                    ${x.owner_phone ? " · " + x.owner_phone : ""}
                  </small>
                </div>
                <span>${x.active ? "ACTIVE" : "OFF"}</span>
              </div>
            `).join("")
            : `<p class="empty">No restaurants or kitchens yet.</p>`
        }
        </div>
      `;
    }

    if (section === "delivery") {
      const data = await api("/api/owner/users");
      const delivery = data.filter(x => x.role === "delivery");

      box.innerHTML = `
        <button class="primary" onclick="addDelivery()">+ Add Delivery Partner</button>
        ${delivery.map(x => `
          <div class="list-item">
            <div>
              <b>${x.name}</b>
              <small>${x.phone}</small>
            </div>
            <span>DELIVERY</span>
          </div>
        `).join("")}
      `;
    }

    if (section === "areas") {
      const data = await api("/api/owner/areas");

      box.innerHTML = `
        <button class="primary" onclick="addArea()">+ Add Area</button>
        ${data.map(x => `
          <div class="list-item">
            <div>
              <b>${x.name}</b>
              <small>${x.franchise_name}</small>
            </div>
          </div>
        `).join("")}
      `;
    }

    if (section === "orders") {
      const data = await api("/api/admin/orders");

      box.innerHTML = data.length
        ? data.map(x => `
          <div class="list-item">
            <div>
              <b>Order #${x.id}</b>
              <small>${x.customer} · ${x.shop_name}</small>
            </div>
            <strong>₹${x.total}</strong>
          </div>
        `).join("")
        : `<p class="empty">No orders yet.</p>`;
    }

    if (section === "users") {
      const data = await api("/api/owner/users");

      box.innerHTML = data.map(x => `
        <div class="list-item">
          <div>
            <b>${x.name}</b>
            <small>${x.phone}</small>
          </div>
          <span>${x.role}</span>
        </div>
      `).join("");
    }
  } catch (e) {
    box.innerHTML = `<div class="error">${e.message}</div>`;
  }
}

async function addRestaurant() {
  const name = prompt("Restaurant / Kitchen name?");
  if (!name) return;

  const owner_name = prompt("Restaurant owner name?");
  if (!owner_name) return;

  const owner_phone = prompt("Owner mobile number?");
  if (!owner_phone) return;

  const password = prompt("Restaurant login password (minimum 6 characters)?");
  if (!password) return;

  if (password.length < 6) {
    alert("Password must be at least 6 characters.");
    return;
  }

  const address = prompt("Restaurant address?", "Makrana City") || "Makrana City";

  const franchise = prompt(
    "Franchise ID? Leave blank if not using franchise."
  );

  const area = prompt(
    "Area ID? Leave blank if not using area."
  );

  const commission = prompt(
    "Commission percentage?",
    "10"
  );

  const latitude = prompt(
    "Latitude? Leave blank if unknown."
  );

  const longitude = prompt(
    "Longitude? Leave blank if unknown."
  );

  try {
    const result = await api("/api/owner/restaurants", {
      method: "POST",
      body: JSON.stringify({
        name: name.trim(),
        owner_name: owner_name.trim(),
        owner_phone: owner_phone.trim(),
        password,
        address: address.trim(),
        franchise_id: franchise ? Number(franchise) : null,
        area_id: area ? Number(area) : null,
        commission_percent: commission === "" ? 10 : Number(commission),
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null
      })
    });

    alert(
      "Restaurant created successfully.\n\n" +
      "Restaurant ID: " + result.shop_id + "\n" +
      "Owner Account ID: " + result.user_id
    );

    showSection("shops");
    loadDashboard();

  } catch (e) {
    alert(e.message || "Restaurant creation failed");
  }
}

async function addFranchise() {
  const name = prompt("Franchise name?");
  if (!name) return;

  const code = prompt("Franchise code?");
  if (!code) return;

  try {
    await api("/api/owner/franchises", {
      method: "POST",
      body: JSON.stringify({
        name,
        code,
        city: "Makrana",
        state: "Rajasthan",
        commission_percent: 10
      })
    });

    showSection("franchise");
    loadDashboard();
  } catch (e) {
    alert(e.message);
  }
}

async function addDelivery() {
  const name = prompt("Delivery partner name?");
  if (!name) return;

  const phone = prompt("Phone number?");
  if (!phone) return;

  const password = prompt("Login password?");
  if (!password) return;

  try {
    await api("/api/owner/delivery", {
      method: "POST",
      body: JSON.stringify({name, phone, password})
    });

    showSection("delivery");
    loadDashboard();
  } catch (e) {
    alert(e.message);
  }
}

async function addArea() {
  const franchise = prompt("Franchise ID?");
  if (!franchise) return;

  const name = prompt("Area name?");
  if (!name) return;

  try {
    await api("/api/owner/areas", {
      method: "POST",
      body: JSON.stringify({
        franchise_id: Number(franchise),
        name
      })
    });

    showSection("areas");
  } catch (e) {
    alert(e.message);
  }
}

function logout() {
  localStorage.removeItem("hb_token");
  location.href = "/";
}

loadDashboard();

async function settings(){
  document.getElementById("panel").innerHTML = `
    <div class="section-card">
      <span class="tag">ACCOUNT SECURITY</span>
      <h2>⚙️ Owner Settings</h2>
      <p>Manage your HOME BITE owner account.</p>

      <h3>🔐 Change Password</h3>

      <form onsubmit="changePassword(event)">
        <input id="currentPassword" type="password"
          placeholder="Current password" required>

        <input id="newPassword" type="password"
          placeholder="New password" minlength="6" required>

        <input id="confirmPassword" type="password"
          placeholder="Confirm new password" minlength="6" required>

        <button class="primary" type="submit">
          Change Password
        </button>
      </form>

      <div id="passwordMessage"></div>

      <hr style="margin:25px 0;opacity:.2">

      <h3>📱 Change Phone Number</h3>

      <form onsubmit="changePhone(event)">
        <input id="phoneCurrentPassword" type="password"
          placeholder="Current password" required>

        <input id="newPhone" type="tel"
          placeholder="New phone number" required>

        <button class="primary" type="submit">
          Change Phone Number
        </button>
      </form>

      <div id="phoneMessage"></div>
    </div>
  `;
}

async function changePhone(e){
  e.preventDefault();

  const current_password =
    document.getElementById("phoneCurrentPassword").value;

  const new_phone =
    document.getElementById("newPhone").value.trim();

  const message =
    document.getElementById("phoneMessage");

  try{
    await api("/api/owner/phone",{
      method:"PATCH",
      body:JSON.stringify({
        current_password,
        new_phone
      })
    });

    message.innerHTML =
      '<div style="color:#ffd400;margin-top:15px">✓ Phone number changed successfully.</div>';

    e.target.reset();

  }catch(err){
    message.innerHTML =
      `<div class="error">${err.message}</div>`;
  }
}

async function changePassword(e){
  e.preventDefault();

  const current_password =
    document.getElementById("currentPassword").value;

  const new_password =
    document.getElementById("newPassword").value;

  const confirm =
    document.getElementById("confirmPassword").value;

  const message = document.getElementById("passwordMessage");

  if(new_password !== confirm){
    message.innerHTML =
      '<div class="error">New passwords do not match.</div>';
    return;
  }

  try{
    const r = await api("/api/owner/password",{
      method:"PATCH",
      body:JSON.stringify({
        current_password,
        new_password
      })
    });

    message.innerHTML =
      '<div style="color:#ffd400;margin-top:15px">✓ Password changed successfully.</div>';

    e.target.reset();

  }catch(err){
    message.innerHTML =
      `<div class="error">${err.message}</div>`;
  }
}
