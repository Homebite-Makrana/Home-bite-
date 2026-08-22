

async function changePassword(){
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

const A=document.getElementById("app");let T=localStorage.getItem("hb_token"),U=JSON.parse(localStorage.getItem("hb_user")||"null"),cart=[];
const API_BASE="https://home-bite-t0mi.onrender.com";
async function api(u,o={}){
  try{
    o.headers={"Content-Type":"application/json",...(o.headers||{})};
    if(T)o.headers.Authorization="Bearer "+T;

    const r=await fetch(API_BASE+u,o);
    const text=await r.text();

    let d={};
    try{
      d=text?JSON.parse(text):{};
    }catch(_){
      d={error:text||"Empty server response"};
    }

    if(!r.ok)throw Error(d.error||("HTTP "+r.status));
    return d;
  }catch(e){
    console.error("HOME BITE API ERROR:",e);
    throw Error(e?.message||"Network error. Please check internet connection.");
  }
}
function save(d){T=d.token;U=d.user;localStorage.setItem("hb_token",T);localStorage.setItem("hb_user",JSON.stringify(U))}
function hbIcon(name){
  const a={
    grid:`<svg class="hb-svg" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
    restaurant:`<svg class="hb-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10h16M5 10v9M19 10v9M3 19h18M6 10l2-5h8l2 5M8 14h8"/></svg>`,
    homefood:`<svg class="hb-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5M5.5 10.5V20h13v-9.5M9 20v-5h6v5"/></svg>`,
    hero:`<svg class="hb-svg hb-svg-hero" viewBox="0 0 64 64" aria-hidden="true"><path d="M10 36h44M14 36c0-13 8-22 18-22s18 9 18 22M8 40h48M18 40v8h28v-8M23 50h18M29 14h6M32 9v5"/></svg>`,
    bell:`<svg class="hb-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>`,
    user:`<svg class="hb-svg" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="4"/><path d="M4 21c.8-4 3.5-6 8-6s7.2 2 8 6"/></svg>`,
    cart:`<svg class="hb-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L21 8H6M9 21h.01M18 21h.01"/></svg>`,
    orders:`<svg class="hb-svg" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18H6zM9 7h6M9 11h6M9 15h4"/></svg>`
  };
  return a[name]||"";
}

function layout(c){
  A.innerHTML=`<header class="top">
    <div class="brand">
      <div class="logo hb-app-logo">
        <img class="hb-app-logo-img" src="/home-bite-app-icon-blue.png" alt="HOME BITE">
      </div>
      <div><b>HOME BITE</b><small>Makrana City</small></div>
    </div>
    <div class="hb-header-actions">
      ${U
        ? `<button class="hb-bell" onclick="notifications()">${hbIcon("bell")}</button><span class="hb-hi">Hi, ${U.name}</span><button class="btn dark" onclick="changePassword()">🔐 Password</button><button class="btn dark" onclick="logout()">Logout</button>`
        : `<button class="hb-bell" onclick="notifications()">${hbIcon("bell")}</button><button class="btn" onclick="login()">Login</button>`
      }
    </div>
  </header><main class="wrap">${c}</main>`;
}

async function notifications(){
  try{
    let n=await api("/api/notifications");
    layout(`<h2>🔔 Notifications</h2>
      ${n.length?n.map(x=>`
        <div class="card topspace">
          <b>${x.read?"":"🟢 "}${x.message}</b>
          <small>${x.created_at||""}</small>
          ${!x.read?`<button class="btn topspace" onclick="readNotification(${x.id})">Mark Read</button>`:""}
        </div>
      `).join(""):"<p>No notifications yet.</p>"}
      <button class="btn topspace" onclick="home()">Home</button>`);
  }catch(e){alert(e.message||"Unable to load notifications")}
}

async function readNotification(id){
  await api("/api/notifications/"+id,{method:"PATCH"});
  notifications();
}

async function home(type=""){
  const title =
    type==="restaurant" ? "Restaurants" :
    type==="home" ? "Home Food" :
    "Popular Restaurants";

  layout(`
    <section class="hb-final-page hb-reference-home">

      <div class="hb-final-location">
        <span class="hb-pin">●</span>
        <div><small>DELIVERING IN</small> <b>Makrana City</b></div>
        <span class="hb-live">● LIVE</span>
      </div>

      <div class="hb-final-search hb-reference-search">
        <span class="hb-search-icon">⌕</span>
        <input id="hb-final-search-input"
          type="search"
          autocomplete="off"
          placeholder="Search restaurant or kitchen"
          oninput="find(this.value)">
        <button type="button" class="hb-search-clear"
          onclick="document.getElementById('hb-final-search-input').value='';find('')">×</button>
        <span class="hb-search-go">⌕</span>
      </div>

      <section class="hb-final-hero hb-reference-hero">
        <div class="hb-hero-copy">
          <small>HOME BITE</small>
          <h1>रेस्टोरेंट का स्वाद<br><em>अब आपके घर.</em></h1>
          <p>Restaurant food + homemade food</p>
        </div>
        <div class="hb-hero-dish">${hbIcon("hero")}</div>
      </section>

      <div class="hb-final-cats hb-reference-cats">
        <button class="${!type?"active":""}" onclick="home()">
          ${hbIcon("grid")}<b>All</b>
        </button>
        <button class="${type==="restaurant"?"active":""}" onclick="home('restaurant')">
          ${hbIcon("restaurant")}<b>Restaurants</b>
        </button>
        <button class="${type==="home"?"active":""}" onclick="home('home')">
          ${hbIcon("homefood")}<b>Home Food</b>
        </button>
      </div>

      <div class="hb-final-heading hb-reference-heading">
        <div>
          <small>NEAR YOU</small>
          <h2>${title}</h2>
        </div>
        <span>View all ›</span>
      </div>

      <div id="shops" class="hb-final-shops">
        <div class="hb-final-empty hb-reference-empty">
          <div>${hbIcon("hero")}</div>
          <h3>Loading restaurants...</h3>
        </div>
      </div>

      <div class="hb-final-benefits">
        <div><span>🛵</span><b>Fast Delivery</b><small>Quick & safe</small></div>
        <div><span>✦</span><b>Best Quality</b><small>Fresh food</small></div>
        <div><span>%</span><b>Best Offers</b><small>Great value</small></div>
        <div><span>◉</span><b>24/7 Support</b><small>We're here</small></div>
      </div>

      <nav class="hb-final-nav hb-reference-nav">
        <button class="selected" onclick="home()">${hbIcon("homefood")}<b>Home</b></button>
        ${U?.role==="customer"?`<button onclick="orders()">${hbIcon("orders")}<b>Orders</b></button>`:""}
        <button onclick="checkout()">${hbIcon("cart")}<b>Cart</b></button>
        <button onclick="login()">${hbIcon("user")}<b>Account</b></button>
      </nav>

      <div class="hb-final-role-actions">
        ${U?.role==="admin"?`<button onclick="admin()">⚙ Admin Panel</button>`:""}
        ${U?.role==="restaurant"?`<button onclick="partner()">🏪 Restaurant Panel</button>`:""}
        ${U?.role==="delivery"?`<button onclick="deliver()">🛵 Delivery Panel</button>`:""}
      </div>

    </section>
  `);

  try{
    const s = await api("/api/shops"+(type?"?type="+encodeURIComponent(type):""));
    const shops = document.getElementById("shops");
    if(!shops) return;

    shops.innerHTML = s.length ? s.map(x=>`
      <article class="hb-final-card hb-reference-card">
        <div class="hb-food-image ${x.type==="home"?"home":"restaurant"}">
          <span>${x.type==="home"?"HOME FOOD":"RESTAURANT"}</span>
          <strong>${x.type==="home"?"🍲":"🍛"}</strong>
        </div>

        <div class="hb-card-body">
          <div class="hb-card-title">
            <div>
              <h3>${x.name}</h3>
              <b class="hb-rating">★ ${x.rating||5}</b>
            </div>
          </div>

          <p class="hb-address">⌖ ${x.address||"Makrana City"}</p>

          <div class="hb-card-bottom">
            <span class="hb-open">● Open</span>
            <button onclick="menu(${x.id})">VIEW MENU <span>→</span></button>
          </div>
        </div>
      </article>
    `).join("") : `
      <div class="hb-final-empty hb-reference-empty">
        <div>${hbIcon("hero")}</div>
        <h3>No restaurants available yet</h3>
        <p>Restaurants and home kitchens will appear here.</p>
      </div>
    `;
  }catch(e){
    const shops = document.getElementById("shops");
    if(!shops) return;

    shops.innerHTML = `
      <div class="hb-final-empty hb-reference-empty">
        <div style="font-size:40px;">⚠️</div>
        <h3>Restaurants couldn't load</h3>
        <p>HOME BITE is ready. Please try again.</p>
        <button class="btn" onclick="home('${type||""}')">Try Again</button>
      </div>
    `;
  }
}

function find(q){
  const term = String(q || "").toLowerCase().trim();
  document.querySelectorAll("#shops .hb-final-card").forEach(x=>{
    x.style.display = x.innerText.toLowerCase().includes(term) ? "" : "none";
  });
}

async function menu(id){let s=(await api("/api/shops")).find(x=>x.id==id),m=await api("/api/shops/"+id+"/menu");layout(`<button onclick="home()">← Back</button><h2>${s.name}</h2><div class="card">${m.map(x=>`<div class="food"><div><b>${x.name}</b><div class="muted">₹${x.price} · ${x.category}</div></div><button class="btn" onclick="add(${id},${x.id},'${x.name.replace(/'/g,"\\'")}',${x.price})">Add</button></div>`).join("")}</div><div class="topspace"><button class="btn" onclick="checkout()">Cart (${cart.length})</button></div>`)}
async function add(shopId,menuId,name,price){if(cart.length&&cart[0].shopId!==shopId)return alert("Please order from one restaurant at a time.");cart.push({shopId,menuId,name,price,qty:1});await menu(shopId)}
async function checkout(){
  if(!cart.length)return alert("Cart empty");
  if(!U)return login();

  let t=cart.reduce((a,x)=>a+x.price*x.qty,0);
  let latitude,longitude,quote;

  try{
    if(!navigator.geolocation){
      return alert("Location is required for home delivery. Please enable location on your phone.");
    }

    const pos=await new Promise((resolve,reject)=>{
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy:true,
          timeout:15000,
          maximumAge:60000
        }
      );
    });

    latitude=Number(pos.coords.latitude);
    longitude=Number(pos.coords.longitude);

    if(!Number.isFinite(latitude)||!Number.isFinite(longitude)){
      throw new Error("Unable to read your delivery location.");
    }

    quote=await api("/api/delivery/quote",{
      method:"POST",
      body:JSON.stringify({
        shopId:cart[0].shopId,
        latitude,
        longitude
      })
    });

    if(!quote || !Number.isFinite(Number(quote.delivery_fee))){
      throw new Error("Unable to calculate delivery fee.");
    }

  }catch(e){
    console.error("CHECKOUT LOCATION/QUOTE ERROR:",e);

    if(e && e.code===1){
      return alert("Location permission is required for home delivery. Please allow location permission and try Cart again.");
    }

    if(e && e.code===2){
      return alert("Your location could not be detected. Please turn on GPS/location and try again.");
    }

    if(e && e.code===3){
      return alert("Location request timed out. Please make sure GPS/location is ON and try again.");
    }

    return alert(e.message||"Unable to calculate delivery fee.");
  }

  // Keep the successful GPS coordinates for the Place Order step.
  window.hbCheckoutLocation={
    latitude,
    longitude
  };

  const finalTotal=t+Number(quote.delivery_fee);

  layout(`
    <button onclick="home()">← Home</button>
    <h2>Checkout</h2>

    <div class="card hb-checkout-card">
      ${cart.map(x=>`
        <div class="food hb-cart-row">
          <span>${x.name} × ${x.qty}</span>
          <b>₹${x.price*x.qty}</b>
        </div>
      `).join("")}

      <hr>

      <p>Food subtotal <b>₹${t}</b></p>
      <p>Distance <b>${Number(quote.distance_km).toFixed(1)} km</b></p>
      <p>Delivery fee <b>₹${quote.delivery_fee}</b></p>
      <h3>Final Total ₹${finalTotal}</h3>

      <input id="addr"
        class="input hb-address-input"
        placeholder="Full delivery address, Makrana">

      <h3>Payment Method</h3>

      <label class="hb-payment-option">
        <input type="radio" name="payment" value="COD" checked>
        💵 Cash on Delivery
      </label>

      <label class="hb-payment-option">
        <input type="radio" name="payment" value="ONLINE">
        💳 Online Payment
      </label>

      <div class="topspace hb-place-order">
        <button class="btn" onclick="place()">Place Order</button>
      </div>
    </div>
  `);
}

async function place(){
  try{
    let a=document.getElementById("addr")?.value.trim();
    if(!a)return alert("Address required");

    let method=document.querySelector('input[name="payment"]:checked')?.value||"COD";

    // Reuse the location already obtained during Cart/Checkout.
    let latitude=Number(window.hbCheckoutLocation?.latitude);
    let longitude=Number(window.hbCheckoutLocation?.longitude);

    if(!Number.isFinite(latitude)||!Number.isFinite(longitude)){
      return alert("Delivery location is missing. Please go back to Cart and allow location.");
    }

if(method==="COD"){
let r=await api("/api/orders",{method:"POST",body:JSON.stringify({shopId:cart[0].shopId,items:cart.map(x=>({menuId:x.menuId,qty:x.qty})),address:a,payment_method:"COD",latitude,longitude})});
cart=[];window.hbCheckoutLocation=null;alert("Order #HB"+r.orderId+" placed");return orders();
}

let p=await api("/api/payment/create",{method:"POST",body:JSON.stringify({shopId:cart[0].shopId,items:cart.map(x=>({menuId:x.menuId,qty:x.qty})),address:a,latitude,longitude})});

let cfg=await api("/api/config/razorpay");

if(typeof Razorpay!=="function"){
  await new Promise((resolve,reject)=>{
    const existing=document.querySelector('script[data-razorpay-sdk="1"]');
    if(existing){
      existing.addEventListener("load",resolve,{once:true});
      existing.addEventListener("error",()=>reject(new Error("Razorpay SDK failed to load")),{once:true});
      return;
    }

    const script=document.createElement("script");
    script.src="https://checkout.razorpay.com/v1/checkout.js";
    script.async=true;
    script.dataset.razorpaySdk="1";
    script.onload=resolve;
    script.onerror=()=>reject(new Error("Razorpay SDK failed to load"));
    document.head.appendChild(script);
  });
}

let options={
key:"",
amount:p.amount,
currency:p.currency,
name:"Home Bite",
description:"Food Order",
order_id:p.razorpay_order_id,
webview_intent:true,
prefill:{name:U.name||""},
theme:{color:"#075d31"},
config:{
  display:{
    blocks:{
      hb_upi:{
        name:"UPI & UPI Apps",
        instruments:[
          {method:"upi"}
        ]
      }
    },
    sequence:[
      "block.hb_upi",
      "card",
      "netbanking",
      "wallet"
    ],
    preferences:{
      show_default_blocks:true
    }
  }
},
modal:{
  ondismiss:function(){
    alert("Razorpay checkout closed.");
  }
},
handler:async function(response){
try{
  let v=await api("/api/payment/verify",{
    method:"POST",
    body:JSON.stringify({
      razorpay_order_id:response.razorpay_order_id,
      razorpay_payment_id:response.razorpay_payment_id,
      razorpay_signature:response.razorpay_signature
    })
  });
  cart=[];window.hbCheckoutLocation=null;
  alert("Payment successful! Order #HB"+v.orderId);
  orders();
}catch(e){
  alert(e.message||"Payment verification failed");
}
}
};
options.key=cfg.key_id||"";
if(!options.key)return alert("Razorpay Key ID not available in browser");
if(typeof Razorpay!=="function")return alert("Razorpay SDK not loaded");
console.log("RAZORPAY DEBUG:",options.key.slice(0,8),options.amount,options.order_id);
alert("Razorpay: "+options.key.slice(0,8)+" | ₹"+options.amount/100+" | "+options.order_id);
try{
  const rzp=new Razorpay(options);
  rzp.on("payment.failed", function(response){
    alert("Payment failed: "+(response.error?.description||"Unknown Razorpay error"));
    console.error("RAZORPAY FAILED:",response);
  });
  rzp.open();
}catch(e){
  alert("Razorpay open error: "+e.message);
  console.error(e);
}

}catch(e){alert(e.message)}
}
async function orders(){
  let r=await api("/api/orders");
  layout(`<h2>My Orders</h2>${r.length?r.map(x=>`<div class="card topspace">
    <div class="row"><b>#HB${x.id} ${x.shop_name}</b><span class="pill">${x.status}</span></div>
    <p>₹${x.total}<br>${x.address}<br><b>Payment: ${x.payment_status||"PENDING"}</b></p>
    <div class="hb-order-progress">
      <b>Order Progress</b><br>
      <div class="hb-progress-line">
        <span>${x.status==="PLACED"?"🟢":"⚪"} Order Placed →</span>
        <span>${["PREPARING","READY","ON_THE_WAY","DELIVERED"].includes(x.status)?"🟢":"⚪"} Preparing →</span>
        <span>${["READY","ON_THE_WAY","DELIVERED"].includes(x.status)?"🟢":"⚪"} Ready →</span>
        <span>${["ON_THE_WAY","DELIVERED"].includes(x.status)?"🟢":"⚪"} On the Way →</span>
        <span>${x.status==="DELIVERED"?"🟢":"⚪"} Delivered</span>
      </div>
    </div>
  </div>`).join(""):"<p>No orders yet.</p>"}<button class="btn topspace" onclick="home()">Home</button>`)
}
function login(){layout(`
<section class="hb-login-v61">
  <div class="hb-login-head">
    <img class="hb-login-logo" src="/home-bite-app-icon-blue.png" alt="HOME BITE">
    <small>HOME BITE</small>
    <h2>Welcome Back</h2>
    <p>Login to continue to your account</p>
  </div>
  <div class="hb-login-form card">
    <label>Mobile Number</label>
    <input id="loginPhone" class="input hb-login-field" type="tel" autocomplete="tel" inputmode="numeric" placeholder="Enter mobile number">
    <label>Password</label>
    <input id="loginPassword" class="input hb-login-field" type="password" autocomplete="current-password" placeholder="Enter password">
    <button id="hbLoginBtn" class="btn hb-login-button" type="button" onclick="doLogin()">Login</button>
    <div class="hb-login-links">
      <button class="btn dark" type="button" onclick="register()">Create New Account</button>
      <button class="btn dark" type="button" onclick="home()">Continue as Guest</button>
    </div>
  </div>
</section>`)}
async function doLogin(){
  const btn=document.getElementById("hbLoginBtn");
  try{
    const phone=document.getElementById("loginPhone").value.trim();
    const password=document.getElementById("loginPassword").value.trim();
    if(!phone||!password){alert("Please enter mobile number and password");return}
    if(btn){btn.disabled=true;btn.textContent="Logging in…"}
    const data=await api("/api/login",{method:"POST",body:JSON.stringify({phone:phone,password:password})});
    save(data);
    if(data.user.role==="admin")return admin();
    if(data.user.role==="restaurant")return partner();
    if(data.user.role==="delivery")return deliver();
    return home();
  }catch(e){
    if(btn){btn.disabled=false;btn.textContent="Login"}
    alert(e.message)
  }
}
function register(){layout(`<h2>Create account</h2><input id="n" class="input" placeholder="Name"><input id="p" class="input" placeholder="Mobile"><input id="pw" class="input" type="password" placeholder="Password"><button class="btn" onclick="doRegister()">Create</button>`)}
async function doRegister(){try{save(await api("/api/register",{method:"POST",body:JSON.stringify({name:n.value,phone:p.value,password:pw.value})}));home()}catch(e){alert(e.message)}}
function logout(){
  localStorage.clear();
  T=null;
  U=null;
  if(typeof hbClearNav==="function") hbClearNav();
  home();
}
async function admin(){
  let s=await api("/api/admin/stats");
  let o=await api("/api/admin/orders");
  let f=await api("/api/owner/franchises");
  let c=await api("/api/owner/commissions");
  let totalCommission=c.reduce((sum,x)=>sum+Number(x.amount||0),0);

  layout(`<h2>Admin Panel</h2>

  <div class="grid">
    <div class="card"><div class="stat">${s.orders}</div>Orders</div>
    <div class="card"><div class="stat">₹${s.revenue}</div>Paid Revenue</div>
    <div class="card"><div class="stat">₹${s.pendingPayments||0}</div>Pending Payments</div>
    <div class="card"><div class="stat">${s.restaurants}</div>Restaurants</div>
    <div class="card"><div class="stat">${s.customers}</div>Customers</div>
  </div>

  <div class="topspace">
    <button class="btn" onclick="addShop('restaurant')">+ Restaurant</button>
    <button class="btn" onclick="addShop('home')">+ Home Kitchen</button>
    <button class="btn" onclick="addFranchise()">+ City / Franchise</button>
    <button class="btn" onclick="addArea()">+ Area</button>
  </div>

  <h3>HOME BITE Cities</h3>
  <div class="card">
    ${f.length ? f.map(x=>`
      <div class="food">
        <span><b>${x.name}</b><br>
        ${x.city||""}, ${x.state||""}<br>
        Commission: ${x.commission_percent}%</span>
        <span>${x.shops||0} restaurants</span>
      </div>
    `).join("") : "<p>No cities added yet.</p>"}
  </div>

  <h3>Home Bite Commission</h3>
  <div class="card">
    <div class="row">
      <b>Total Commission Earned</b>
      <b>₹${totalCommission}</b>
    </div>
    <p>Commission records: <b>${c.length}</b></p>
  </div>

  <div class="card">
    <table>
      <tr><th>#</th><th>Restaurant</th><th>City</th><th>Order</th><th>Commission</th></tr>
      ${c.length ? c.map(x=>`
        <tr>
          <td>${x.id}</td>
          <td>${x.shop_name||"-"}</td>
          <td>${x.franchise_name||"-"}</td>
          <td>#HB${x.order_id} · ₹${x.order_total||0}</td>
          <td><b>₹${x.amount||0}</b></td>
        </tr>
      `).join("") : '<tr><td colspan="5">No commission records yet.</td></tr>'}
    </table>
  </div>

  <h3>Orders</h3>
  <div class="card">
    <table>
      <tr><th>#</th><th>Customer</th><th>Shop</th><th>Total</th><th>Payment</th><th>Delivery</th><th>Status</th></tr>
      ${o.map(x=>`
        <tr>
          <td>${x.id}</td>
          <td>${x.customer}</td>
          <td>${x.shop_name}</td>
          <td>₹${x.total}</td>
          <td>${x.payment_status||"PENDING"}</td>
          <td>${x.delivery_id||"Unassigned"}</td>
          <td>
            <select onchange="ast(${x.id},this.value)">
              <option>${x.status}</option>
              <option>PREPARING</option>
              <option>READY</option>
              <option>ON_THE_WAY</option>
              <option>DELIVERED</option>
            </select>
          </td>
        </tr>
      `).join("")}
    </table>
  </div>

  <button class="btn topspace" onclick="home()">Customer App</button>`);
}

async function addFranchise(){
  layout(`<h2>Add HOME BITE City</h2>
  <div class="card">
    <input id="fn" class="input" placeholder="City / Franchise name">
    <input id="fc" class="input" placeholder="Unique code e.g. MAKRANA">
    <input id="fci" class="input" placeholder="City">
    <input id="fst" class="input" placeholder="State">
    <input id="fa" class="input" placeholder="Office / Address">
    <input id="fp" class="input" placeholder="Contact phone">
    <input id="fcom" class="input" type="number" min="0" max="100" value="10" placeholder="Commission %">

    <button class="btn" onclick="saveFranchise()">Save City</button>
    <button class="btn dark topspace" onclick="admin()">Cancel</button>
  </div>`);
}

async function saveFranchise(){
  try{
    const data={
      name:document.getElementById("fn").value.trim(),
      code:document.getElementById("fc").value.trim(),
      city:document.getElementById("fci").value.trim(),
      state:document.getElementById("fst").value.trim(),
      address:document.getElementById("fa").value.trim(),
      phone:document.getElementById("fp").value.trim(),
      commission_percent:Number(document.getElementById("fcom").value||10)
    };

    await api("/api/owner/franchises",{
      method:"POST",
      body:JSON.stringify(data)
    });

    alert("HOME BITE City created successfully");
    admin();
  }catch(e){
    alert(e.message);
  }
}

async function addArea(){
  try{
    const f=await api("/api/owner/franchises");

    layout(`<h2>Add Area</h2>
    <div class="card">
      <select id="afi" class="input">
        <option value="">Select HOME BITE City</option>
        ${f.map(x=>`<option value="${x.id}">${x.name} - ${x.city||""}</option>`).join("")}
      </select>

      <input id="an" class="input" placeholder="Area name e.g. Makrana Main Market">

      <button class="btn" onclick="saveArea()">Save Area</button>
      <button class="btn dark topspace" onclick="admin()">Cancel</button>
    </div>`);
  }catch(e){
    alert(e.message);
  }
}

async function saveArea(){
  try{
    const franchise_id=Number(document.getElementById("afi").value);
    const name=document.getElementById("an").value.trim();

    if(!franchise_id || !name)
      return alert("City and Area name required");

    await api("/api/owner/areas",{
      method:"POST",
      body:JSON.stringify({franchise_id,name})
    });

    alert("Area created successfully");
    admin();
  }catch(e){
    alert(e.message);
  }
}

async function ast(id,status){await api("/api/admin/orders/"+id,{method:"PATCH",body:JSON.stringify({status})});alert("Status updated")}
async function addShop(type){
  if(type==="home"){
    layout(`<h2>Add Home Kitchen</h2><input id="sn" class="input" placeholder="Business name"><input id="sa" class="input" placeholder="Address"><input id="sp" class="input" placeholder="Phone"><button class="btn" onclick='saveShop("home")'>Save</button>`);
    return;
  }

  let f=await api("/api/owner/franchises");

  layout(`
  <section class="hb-restaurant-page">
    <div class="hb-form-heading">
      <small>HOME BITE PARTNER</small>
      <h2>Add Restaurant</h2>
      <p>Create a restaurant partner profile and assign its service area.</p>
    </div>

    <div class="card hb-restaurant-form">
      <div class="hb-form-section">
        <h3>Business Details</h3>
        <p>Enter restaurant and owner information.</p>

        <label>Business / Restaurant Name</label>
        <input id="sn" class="input" placeholder="Restaurant name">

        <label>Owner Name</label>
        <input id="on" class="input" placeholder="Owner full name">

        <label>Owner Phone</label>
        <input id="op" class="input" type="tel" inputmode="numeric" placeholder="Owner mobile number">

        <label>Partner Password</label>
        <input id="pw" class="input" type="password" placeholder="Minimum 6 characters">
      </div>

      <div class="hb-form-section">
        <h3>Restaurant Location</h3>
        <p>Add address and map location.</p>

        <label>Full Address</label>
        <input id="sa" class="input" placeholder="Full restaurant address">

        <div class="hb-location-grid">
          <div>
            <label>Latitude</label>
            <input id="lat" class="input" type="number" step="any" placeholder="Latitude">
          </div>
          <div>
            <label>Longitude</label>
            <input id="lng" class="input" type="number" step="any" placeholder="Longitude">
          </div>
        </div>

        <button class="btn hb-location-button" type="button" onclick="getRestaurantLocation()">📍 Use Current Location</button>
      </div>

      <div class="hb-form-section">
        <h3>Service & Commission</h3>
        <p>Select city/franchise and delivery area.</p>

        <label>City / Franchise</label>
        <select id="fi" class="input" onchange="loadRestaurantAreas()">
          <option value="">Select City / Franchise</option>
          ${f.map(x=>`<option value="${x.id}" data-commission="${x.commission_percent}">${x.name} - ${x.city||""}</option>`).join("")}
        </select>

        <label>Area</label>
        <select id="ari" class="input">
          <option value="">Select Area</option>
        </select>

        <label>Commission %</label>
        <input id="cp" class="input" type="number" min="0" max="100" step="0.1" placeholder="Commission percentage">
      </div>

      <div class="hb-form-actions">
        <button class="btn hb-v61-wide" type="button" onclick="saveRestaurant()">Create Restaurant Partner</button>
        <button class="btn dark hb-v61-wide" type="button" onclick="admin()">Cancel</button>
      </div>
    </div>
  </section>`);
}

async function loadRestaurantAreas(){
  const franchiseId=document.getElementById("fi").value;
  const area=document.getElementById("ari");
  const commission=document.getElementById("cp");

  area.innerHTML='<option value="">Select Area</option>';

  if(!franchiseId)return;

  const areas=await api("/api/owner/areas");
  areas.filter(x=>String(x.franchise_id)===String(franchiseId) && x.active)
    .forEach(x=>{
      area.innerHTML+=`<option value="${x.id}">${x.name}</option>`;
    });

  const option=document.querySelector("#fi option:checked");
  if(option && option.dataset.commission)
    commission.value=option.dataset.commission;
}

function getRestaurantLocation(){
  if(!navigator.geolocation)
    return alert("GPS location is not supported on this device.");
  navigator.geolocation.getCurrentPosition(
    p=>{
      document.getElementById("lat").value=p.coords.latitude;
      document.getElementById("lng").value=p.coords.longitude;
      alert("Restaurant location captured.");
    },
    e=>alert("Location permission/error: "+e.message),
    {enableHighAccuracy:true,timeout:10000}
  );
}

async function saveRestaurant(){
  try{
    const data={
      name:document.getElementById("sn").value.trim(),
      owner_name:document.getElementById("on").value.trim(),
      owner_phone:document.getElementById("op").value.trim(),
      password:document.getElementById("pw").value,
      address:document.getElementById("sa").value.trim(),
      franchise_id:Number(document.getElementById("fi").value)||null,
      area_id:Number(document.getElementById("ari").value)||null,
      commission_percent:Number(document.getElementById("cp").value||0),
      latitude:Number(document.getElementById("lat").value)||null,
      longitude:Number(document.getElementById("lng").value)||null
    };

    const r=await api("/api/owner/restaurants",{
      method:"POST",
      body:JSON.stringify(data)
    });

    alert("Restaurant created successfully!\\nShop ID: "+r.shop_id+"\\nPartner User ID: "+r.user_id+"\\nCommission: "+r.commission_percent+"%");
    admin();
  }catch(e){
    alert(e.message);
  }
}

async function saveShop(type){
  await api("/api/admin/shops",{
    method:"POST",
    body:JSON.stringify({
      name:sn.value,
      type,
      address:sa.value,
      phone:sp.value
    })
  });
  admin();
}
async function partner(){
  try{
    let s=await api("/api/partner/shop");

    layout(`
      <h2>Restaurant Partner</h2>

      <div class="card">
        <h3>${s.name}</h3>
        <p>${s.address||""}</p>
        <button class="btn" onclick="addMenu()">+ Add Menu Item</button>
      </div>

      <h3>Menu Management</h3>

      <div class="card">
        ${
          s.menu.length
          ? s.menu.map(x=>`
            <div class="food">
              <div>
                <b>${x.name}</b>
                <div class="muted">
                  ₹${x.price} · ${x.category||"General"} ·
                  ${Number(x.available)===1 ? "AVAILABLE" : "HIDDEN"}
                </div>
              </div>

              <div>
                <button class="btn" onclick="editMenu(${x.id})">
                  ✏️ Edit
                </button>

                <button class="btn" onclick="toggleMenu(${x.id},${Number(x.available)===1?0:1})">
                  ${Number(x.available)===1 ? "Hide" : "Show"}
                </button>

                <button class="btn" onclick="deleteMenu(${x.id})">
                  🗑️ Delete
                </button>
              </div>
            </div>
          `).join("")
          : "<p>No menu items yet.</p>"
        }
      </div>

      <h3>Orders</h3>

      <div class="card">
        ${
          s.orders.length
          ? s.orders.map(x=>`
            <div class="food">
              <span>
                #${x.id} · ${x.customer}<br>
                ₹${x.total} · Payment: ${x.payment_status||"PENDING"}
              </span>

              <select onchange="pst(${x.id},this.value)">
                <option>${x.status}</option>
                <option>PREPARING</option>
                <option>READY</option>
              </select>
            </div>
          `).join("")
          : "<p>No orders yet.</p>"
        }
      </div>

      <button class="btn topspace" onclick="home()">Home</button>
    `);

  }catch(e){
    alert(e.message);
  }
}

function addMenu(){
  layout(`
    <h2>Add Menu Item</h2>

    <input id="mn"
      class="input"
      placeholder="Food name">

    <input id="mp"
      class="input"
      type="number"
      min="1"
      placeholder="Price">

    <input id="mc"
      class="input"
      placeholder="Category">

    <button class="btn" onclick="saveMenu()">
      Save Menu Item
    </button>

    <button class="btn topspace" onclick="partner()">
      ← Back
    </button>
  `);
}

async function saveMenu(){
  try{
    const name=mn.value.trim();
    const price=Number(mp.value);
    const category=mc.value.trim();

    if(!name)
      return alert("Food name required.");

    if(!Number.isFinite(price) || price<=0)
      return alert("Valid price required.");

    await api("/api/partner/menu",{
      method:"POST",
      body:JSON.stringify({
        name,
        price,
        category
      })
    });

    alert("Menu item added successfully.");
    partner();

  }catch(e){
    alert(e.message);
  }
}

async function editMenu(id){
  try{
    const s=await api("/api/partner/shop");
    const x=s.menu.find(m=>Number(m.id)===Number(id));

    if(!x)
      return alert("Menu item not found.");

    const name=prompt("Food name?",x.name);
    if(name===null) return;

    const price=prompt("Price?",x.price);
    if(price===null) return;

    const category=prompt(
      "Category?",
      x.category||"General"
    );
    if(category===null) return;

    if(!name.trim())
      return alert("Food name cannot be empty.");

    if(!Number.isFinite(Number(price)) || Number(price)<=0)
      return alert("Invalid price.");

    await api("/api/partner/menu/"+id,{
      method:"PATCH",
      body:JSON.stringify({
        name:name.trim(),
        price:Number(price),
        category:category.trim()
      })
    });

    alert("Menu item updated successfully.");
    partner();

  }catch(e){
    alert(e.message);
  }
}

async function toggleMenu(id,available){
  try{
    await api("/api/partner/menu/"+id,{
      method:"PATCH",
      body:JSON.stringify({
        available:Number(available)
      })
    });

    partner();

  }catch(e){
    alert(e.message);
  }
}

async function deleteMenu(id){
  if(!confirm(
    "Delete this menu item permanently?"
  )) return;

  try{
    await api("/api/partner/menu/"+id,{
      method:"DELETE"
    });

    alert("Menu item deleted.");
    partner();

  }catch(e){
    alert(e.message);
  }
}

async function pst(id,status){await api("/api/partner/orders/"+id,{method:"PATCH",body:JSON.stringify({status})});partner()}
async function deliver(){
  let r=await api("/api/delivery/orders");
  let e=await api("/api/delivery/earnings");

  layout(`<h2>Delivery Panel</h2>
  <div class="card">
    <div class="row"><b>Total Earnings</b><b>₹${e.total_earnings}</b></div>
    <p>Completed Deliveries: <b>${e.completed_deliveries}</b></p>
  </div>
  ${r.length?r.map(x=>`<div class="card topspace">
    <b>#HB${x.id} · ${x.shop_name}</b>
    <p>Customer: ${x.customer}<br>
    Pickup: ${x.shop_address}<br>
    Drop: ${x.address}<br>
    Order ₹${x.total}<br>
    Delivery Earning: <b>₹${x.delivery_fee||0}</b><br>
    Payment: ${x.payment_status||"PENDING"}</p>
    <span class="pill">${x.status}</span><br>
    ${x.status!=="DELIVERED"?`<button class="btn topspace" onclick="dst(${x.id},'ON_THE_WAY')">Picked Up</button>
    <button class="btn topspace" onclick="dst(${x.id},'DELIVERED')">Delivered</button>`:
    `<b>✅ Delivered</b>
     ${x.payment_method==="COD" && x.payment_status!=="PAID"
       ? `<button class="btn topspace" onclick="collectCOD(${x.id})">💵 Cash Collected</button>`
       : x.payment_method==="COD" && x.payment_status==="PAID"
       ? `<div class="pill topspace">💵 Cash Paid</div>`
       : ""}`}
  </div>`).join(""):"<p>No assigned deliveries.</p>"}
  <button class="btn topspace" onclick="home()">Home</button>`)
}
async function collectCOD(id){
  if(!confirm("Confirm that cash payment has been received from the customer?")) return;
  try{
    await api("/api/delivery/orders/"+id+"/cod-collected",{
      method:"PATCH"
    });
    alert("Cash payment marked as PAID.");
    deliver();
  }catch(e){
    alert(e.message);
  }
}

async function dst(id,status){await api("/api/delivery/orders/"+id,{method:"PATCH",body:JSON.stringify({status})});deliver()}
home().catch(e=>document.getElementById("app").innerHTML="<div style='padding:30px'><h2>HOME BITE Error</h2><pre>"+e.message+"</pre></div>");

// ================= HOME BITE V61 BUSINESS UI =================
(function(){
  let hbNavStack = [];
  let hbRestoring = false;

  function esc(v){
    return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
  }
  function roleLabel(){
    const r=U?.role;
    return r==="admin"?"Admin":r==="restaurant"?"Restaurant Partner":r==="delivery"?"Delivery Partner":r==="home"?"Home Kitchen":"Customer";
  }
  function pushCurrent(){
    if(hbRestoring || !A?.innerHTML) return;
    const html=A.innerHTML.trim();
    if(!html) return;

    const last=hbNavStack[hbNavStack.length-1];
    if(last!==html) hbNavStack.push(html);

    if(hbNavStack.length>30) hbNavStack.shift();
  }

  function clearNavStack(){
    hbNavStack=[];
  }

  window.hbClearNav=function(){
    clearNavStack();
  };

  window.hbBack=function(){
    if(hbNavStack.length<=1){
      clearNavStack();
      if(typeof home==="function"){
        hbRestoring=true;
        try{
          return home();
        }finally{
          hbRestoring=false;
        }
      }
      return;
    }

    hbNavStack.pop();
    const previous=hbNavStack[hbNavStack.length-1];

    if(!previous){
      clearNavStack();
      if(typeof home==="function") return home();
      return;
    }

    hbRestoring=true;
    try{
      A.innerHTML=previous;
    }finally{
      hbRestoring=false;
    }
  };

  const oldLayout=layout;
  layout=function(c){
    if(!hbRestoring) pushCurrent();

    A.innerHTML=`<header class="top hb-v61-top">
      <div class="brand">
        <div class="logo hb-app-logo"><img class="hb-app-logo-img" src="/home-bite-app-icon-blue.png" alt="HOME BITE"></div>
        <div><b>HOME BITE</b><small>Makrana City</small></div>
      </div>
      <div class="hb-v61-actions">
        <button class="hb-v61-icon-btn" onclick="hbBack()" title="Back" aria-label="Back">←</button>
        ${U?`<button class="hb-v61-icon-btn" onclick="settings()" title="Settings" aria-label="Settings">☰</button>`:""}
        ${U?`<button class="hb-bell" onclick="notifications()" title="Notifications">${hbIcon("bell")}</button>`:""}
        ${U?`<span class="hb-hi hb-v61-hi">Hi, ${esc(U.name)}</span>`:`<button class="btn" onclick="login()">Login</button>`}
      </div>
    </header><main class="wrap">${c}</main>`;
  };

  window.settings=async function(){
    layout(`<div class="hb-v61-page">
      <div class="hb-v61-title-row"><div><small>ACCOUNT</small><h2>Settings</h2><p>${esc(roleLabel())}</p></div></div>
      <div class="hb-settings-grid">
        <button class="hb-setting-card" onclick="profileSettings()"><b>👤 Profile</b><span>Edit name, mobile and address</span></button>
        <button class="hb-setting-card" onclick="changePassword()"><b>🔐 Password</b><span>Change account password</span></button>
        <button class="hb-setting-card" onclick="payoutSettings()"><b>🏦 Payment Account</b><span>Bank, UPI and Razorpay account</span></button>
        <button class="hb-setting-card" onclick="earningsSettings()"><b>💰 Earnings</b><span>Paid, pending and failed settlements</span></button>
        <button class="hb-setting-card" onclick="settlementHistorySettings()"><b>📋 Settlement History</b><span>View your complete payout history</span></button>
        ${U?.role==="admin"?`
          <button class="hb-setting-card" onclick="commissionSettings()"><b>👑 Commission</b><span>Owner commission and payout records</span></button>
          <button class="hb-setting-card" onclick="adminSettlementsSettings()"><b>🔄 Transfers & Settlements</b><span>Manage restaurant payouts and retries</span></button>
        `:""}
        <button class="hb-setting-card" onclick="appSettings()"><b>⚙️ App Settings</b><span>Notifications and preferences</span></button>
        <button class="hb-setting-card" onclick="paymentSettings()"><b>💳 Payments</b><span>Online payment and COD status</span></button>
        <button class="hb-setting-card" onclick="supportSettings()"><b>☎️ Support</b><span>Get help with HOME BITE</span></button>
        <button class="hb-setting-card" onclick="aboutSettings()"><b>ℹ️ About</b><span>HOME BITE business information</span></button>
        <button class="hb-setting-card hb-setting-danger" onclick="logout()"><b>↪ Logout</b><span>Sign out of this account</span></button>
      </div>
    </div>`);
  };

  window.profileSettings=async function(){
    try{
      const p=await api("/api/account/profile");
      layout(`<div class="hb-v61-page"><div class="hb-v61-title-row"><div><small>ACCOUNT</small><h2>Profile</h2></div></div>
        <div class="card hb-v61-form">
          <label>Full Name</label><input id="hbpf_name" class="input" value="${esc(p.name)}">
          <label>Mobile Number</label><input id="hbpf_phone" class="input" type="tel" value="${esc(p.phone)}">
          <label>Email</label><input id="hbpf_email" class="input" type="email" value="${esc(p.email||"")}">
          <label>Address</label><input id="hbpf_address" class="input" value="${esc(p.address||"")}">
          <label>City</label><input id="hbpf_city" class="input" value="${esc(p.city||"Makrana")}">
          <label>State</label><input id="hbpf_state" class="input" value="${esc(p.state||"Rajasthan")}">
          <label>Pincode</label><input id="hbpf_pin" class="input" inputmode="numeric" value="${esc(p.pincode||"")}">
          <button class="btn hb-v61-wide" onclick="saveProfileSettings()">Save Profile</button>
        </div></div>`);
    }catch(e){alert(e.message)}
  };

  window.saveProfileSettings=async function(){
    try{
      const d=await api("/api/account/profile",{method:"PATCH",body:JSON.stringify({
        name:document.getElementById("hbpf_name").value.trim(),
        phone:document.getElementById("hbpf_phone").value.trim(),
        email:document.getElementById("hbpf_email").value.trim(),
        address:document.getElementById("hbpf_address").value.trim(),
        city:document.getElementById("hbpf_city").value.trim(),
        state:document.getElementById("hbpf_state").value.trim(),
        pincode:document.getElementById("hbpf_pin").value.trim()
      })});
      if(U){
        U.name=document.getElementById("hbpf_name").value.trim();
        U.phone=document.getElementById("hbpf_phone").value.trim();
        localStorage.setItem("hb_user",JSON.stringify(U));
      }
      alert(d.message||"Profile saved successfully");
      settings();
    }catch(e){alert(e.message)}
  };


// ===== V61_SETTLEMENT_UI =====

window.earningsSettings=async function(){
  try{
    const e=await api("/api/account/earnings");

    layout(`
      <div class="hb-v61-page">
        <div class="hb-v61-title-row">
          <div>
            <small>EARNINGS</small>
            <h2>My Earnings</h2>
            <p>Restaurant / Home Kitchen settlement</p>
          </div>
        </div>

        <div class="hb-v61-stat-grid">
          <div class="card hb-v61-stat-card">
            <span>Paid</span>
            <strong>₹${Number(e.total_earnings||0).toFixed(2)}</strong>
          </div>
          <div class="card hb-v61-stat-card">
            <span>Pending</span>
            <strong>₹${Number(e.pending_amount||0).toFixed(2)}</strong>
          </div>
          <div class="card hb-v61-stat-card">
            <span>Failed</span>
            <strong>₹${Number(e.failed_amount||0).toFixed(2)}</strong>
          </div>
        </div>

        <h3>Settlement Records</h3>

        <div class="card">
          ${(e.records||[]).map(x=>`
            <div class="food hb-v61-list-row">
              <span>
                <b>Order #${x.order_id}</b><br>
                ${esc(x.shop_name||"Restaurant")}<br>
                Status: ${esc(x.status)}
                ${x.failure_reason?`<br><small>${esc(x.failure_reason)}</small>`:""}
              </span>
              <b>₹${Number(x.amount||0).toFixed(2)}</b>
            </div>
          `).join("") || "<p>No earnings yet.</p>"}
        </div>

        <button class="btn hb-v61-wide" onclick="settlementHistorySettings()">
          Settlement History
        </button>
      </div>
    `);
  }catch(e){
    alert(e.message);
  }
};

window.settlementHistorySettings=async function(){
  try{
    const rows=await api("/api/account/settlements");

    layout(`
      <div class="hb-v61-page">
        <div class="hb-v61-title-row">
          <div>
            <small>SETTLEMENTS</small>
            <h2>Settlement History</h2>
            <p>Complete payout history</p>
          </div>
        </div>

        <div class="card">
          ${(rows||[]).map(x=>`
            <div class="food hb-v61-list-row">
              <span>
                <b>Order #${x.order_id}</b><br>
                Gross: ₹${Number(x.gross_amount||0).toFixed(2)}<br>
                Commission: ₹${Number(x.commission_amount||0).toFixed(2)}<br>
                Payable: ₹${Number(x.payable_amount||0).toFixed(2)}<br>
                Status: ${esc(x.status)}
                ${x.razorpay_transfer_id?
                  `<br><small>Transfer: ${esc(x.razorpay_transfer_id)}</small>`:""}
              </span>
              <b>₹${Number(x.payable_amount||0).toFixed(2)}</b>
            </div>
          `).join("") || "<p>No settlement records yet.</p>"}
        </div>
      </div>
    `);
  }catch(e){
    alert(e.message);
  }
};

window.adminSettlementsSettings=async function(){
  try{
    const rows=await api("/api/admin/settlements");

    layout(`
      <div class="hb-v61-page">
        <div class="hb-v61-title-row">
          <div>
            <small>ADMIN</small>
            <h2>Transfers & Settlements</h2>
            <p>Restaurant payout management</p>
          </div>
        </div>

        <div class="card">
          ${(rows||[]).map(x=>`
            <div class="food hb-v61-list-row">
              <span>
                <b>Order #${x.order_id} · ${esc(x.shop_name||"-")}</b><br>
                Owner: ${esc(x.owner_name||"-")}<br>
                Amount: ₹${Number(x.amount||0).toFixed(2)}<br>
                Status: ${esc(x.status)}
                ${x.razorpay_transfer_id?
                  `<br><small>Transfer: ${esc(x.razorpay_transfer_id)}</small>`:""}
                ${x.failure_reason?
                  `<br><small>${esc(x.failure_reason)}</small>`:""}
              </span>

              ${x.status==="FAILED"?
                `<button class="btn"
                  onclick="retrySettlement(${x.order_id})">
                  Retry
                </button>`:""}
            </div>
          `).join("") || "<p>No settlement records yet.</p>"}
        </div>
      </div>
    `);
  }catch(e){
    alert(e.message);
  }
};

window.retrySettlement=async function(orderId){
  if(!confirm("Retry this failed settlement?")) return;

  try{
    const r=await api(
      "/api/admin/settlements/"+orderId+"/retry",
      {
        method:"POST",
        body:"{}"
      }
    );

    alert(
      r.status==="PROCESSED"
        ? "Settlement processed successfully."
        : "Settlement status: "+(r.status||"PENDING")
    );

    adminSettlementsSettings();
  }catch(e){
    alert(e.message);
  }
};

// ===== END V61_SETTLEMENT_UI =====


window.payoutSettings=async function(){
    try{
      const p=await api("/api/account/payout");
      layout(`<div class="hb-v61-page"><div class="hb-v61-title-row"><div><small>PAYOUT</small><h2>Payment Account</h2><p>Money settlement destination</p></div></div>
        <div class="card hb-v61-info"><b>Status: ${esc(p?.status||"NOT ADDED")}</b><p>Saving account details does not by itself activate live settlement. Verification and the production Razorpay marketplace/settlement setup are required.</p></div>
        <div class="card hb-v61-form">
          <label>Account Holder Name</label><input id="hbp_holder" class="input" value="${esc(p?.account_holder||U?.name||"")}">
          <label>Bank Name</label><input id="hbp_bank" class="input" value="${esc(p?.bank_name||"")}">
          <label>Bank Account Number</label><input id="hbp_acc" class="input" inputmode="numeric" value="${esc(p?.account_number||"")}">
          <label>IFSC</label><input id="hbp_ifsc" class="input" value="${esc(p?.ifsc||"")}">
          <label>UPI ID</label><input id="hbp_upi" class="input" value="${esc(p?.upi_id||"")}">
          <label>Razorpay Linked Account ID (if applicable)</label><input id="hbp_rp" class="input" value="${esc(p?.razorpay_account_id||"")}">
          <button class="btn hb-v61-wide" onclick="savePayoutSettings()">Save Payment Account</button>
        </div></div>`);
    }catch(e){alert(e.message)}
  };

  window.savePayoutSettings=async function(){
    try{
      const body={
        account_holder:document.getElementById("hbp_holder").value.trim(),
        bank_name:document.getElementById("hbp_bank").value.trim(),
        account_number:document.getElementById("hbp_acc").value.trim(),
        ifsc:document.getElementById("hbp_ifsc").value.trim(),
        upi_id:document.getElementById("hbp_upi").value.trim(),
        razorpay_account_id:document.getElementById("hbp_rp").value.trim()
      };
      const d=await api("/api/account/payout",{method:"PUT",body:JSON.stringify(body)});
      alert(d.message||"Payment account saved");
      settings();
    }catch(e){alert(e.message)}
  };

  window.commissionSettings=async function(){
    try{
      const d=await api("/api/owner/commission-summary");
      const accounts=await api("/api/owner/payout-accounts");
      layout(`<div class="hb-v61-page"><div class="hb-v61-title-row"><div><small>OWNER</small><h2>Commission</h2><p>Total recorded commission: ₹${Number(d.total||0).toFixed(2)}</p></div></div>
        <div class="card hb-v61-stat-card"><b>Total Commission</b><strong>₹${Number(d.total||0).toFixed(2)}</strong><span>${d.records?.length||0} records</span></div>
        <h3>Payout Accounts</h3>
        <div class="card">${accounts.length?accounts.map(x=>`<div class="food hb-v61-list-row"><span><b>${esc(x.user_name)}</b><br>${esc(x.role)} · ${esc(x.shop_name||"HOME BITE Owner")}<br>Status: ${esc(x.status)}</span><button class="btn" onclick="setPayoutStatus(${x.user_id},'${x.status==="VERIFIED"?"PENDING":"VERIFIED"}')">${x.status==="VERIFIED"?"Unverify":"Verify"}</button></div>`).join(""):"<p>No payout accounts added yet.</p>"}</div>
        <h3>Recent Commission</h3><div class="card">${(d.records||[]).slice(0,30).map(x=>`<div class="food hb-v61-list-row"><span>#${x.order_id} · ${esc(x.shop_name||"-")}<br>Owner: ${esc(x.owner_name||"-")}</span><b>₹${Number(x.amount||0).toFixed(2)}</b></div>`).join("")||"<p>No commission records.</p>"}</div>
      </div>`);
    }catch(e){alert(e.message)}
  };
  window.setPayoutStatus=async function(uid,status){
    try{await api("/api/owner/payout-accounts/"+uid+"/status",{method:"PATCH",body:JSON.stringify({status})});commissionSettings()}catch(e){alert(e.message)}
  };

  window.appSettings=function(){
    const n=localStorage.getItem("hb_notifications")!=="off";
    layout(`<div class="hb-v61-page"><small>APPLICATION</small><h2>App Settings</h2>
      <div class="card hb-v61-form">
        <label class="hb-toggle-row"><span>Notifications</span><input id="hbnotif" type="checkbox" ${n?"checked":""}></label>
        <button class="btn hb-v61-wide" onclick="localStorage.setItem('hb_notifications',document.getElementById('hbnotif').checked?'on':'off');alert('App settings saved');settings()">Save Settings</button>
      </div></div>`);
  };
  window.paymentSettings=function(){
    layout(`<div class="hb-v61-page"><small>PAYMENTS</small><h2>Payment Settings</h2>
      <div class="card hb-v61-form">
        <div class="hb-v61-info-row"><b>Online Payment</b><span>Razorpay checkout</span></div>
        <div class="hb-v61-info-row"><b>Cash on Delivery</b><span>Available where enabled</span></div>
        <div class="hb-v61-info-row"><b>Settlement</b><span>Requires verified payout configuration</span></div>
      </div></div>`);
  };
  window.supportSettings=function(){
    layout(`<div class="hb-v61-page"><small>HELP</small><h2>Support</h2>
      <div class="card hb-v61-form"><p>For HOME BITE account, restaurant, delivery or payment issues, contact the HOME BITE administrator.</p><p><b>Account:</b> ${esc(U?.phone||"Not logged in")}</p></div></div>`);
  };
  window.aboutSettings=function(){
    layout(`<div class="hb-v61-page"><small>HOME BITE</small><h2>About</h2>
      <div class="card hb-v61-form"><h3>HOME BITE — Makrana City</h3><p>Restaurant food + homemade food delivery platform.</p><p>Business-ready V61 foundation with role-based accounts, orders, location/GPS, Razorpay checkout, commission tracking and payout-account management.</p></div></div>`);
  };
})();
