

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
async function api(u,o={}){o.headers={"Content-Type":"application/json",...(o.headers||{})};if(T)o.headers.Authorization="Bearer "+T;let r=await fetch(API_BASE+u,o),d=await r.json();if(!r.ok)throw Error(d.error||"Error");return d}
function save(d){T=d.token;U=d.user;localStorage.setItem("hb_token",T);localStorage.setItem("hb_user",JSON.stringify(U))}
function layout(c){A.innerHTML=`<header class="top"><div class="brand"><div class="logo"><img src="/logo.svg" alt="HOME BITE"></div><div><b>HOME BITE</b><small>Makrana City</small></div></div><div>${U?`<button class="btn dark" onclick="notifications()">🔔</button> Hi, ${U.name} <button class="btn dark" onclick="changePassword()">🔐 Password</button> <button class="btn dark" onclick="logout()">Logout</button>`:`<button class="btn" onclick="login()">Login</button>`}</div></header><main class="wrap">${c}</main>`}
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
  const s=await api("/api/shops"+(type?"?type="+encodeURIComponent(type):""));

  layout(`
    <section class="hb2-page">

      <div class="hb2-location">
        <span>📍</span>
        <div>
          <small>DELIVERING IN</small>
          <b>Makrana City</b>
        </div>
        <span class="hb2-live">● LIVE</span>
      </div>

      <section class="hb2-hero">
        <div class="hb2-hero-glow"></div>

        <div class="hb2-hero-copy">
          <div class="hb2-kicker">WELCOME TO</div>
          <h1><span>HOME</span> <em>BITE</em></h1>
          <p>Taste That Feels Like Home</p>
          <button class="hb2-order" onclick="document.getElementById('hb2-search').focus()">
            ORDER NOW <span>→</span>
          </button>
        </div>

        <div class="hb2-logo-ring">
          <img src="/logo.svg" alt="HOME BITE">
        </div>
      </section>

      <div class="hb2-search">
        <span>⌕</span>
        <input id="hb2-search"
          placeholder="Search restaurants or food"
          oninput="find(this.value)">
        <span class="hb2-search-x">×</span>
      </div>

      <div class="hb2-title">
        <div>
          <small>EXPLORE</small>
          <h2>What would you like?</h2>
        </div>
      </div>

      <div class="hb2-categories">

        <button class="hb2-category ${!type?"active":""}" onclick="home()">
          <span class="hb2-cat-icon">🍽</span>
          <b>ALL</b>
          <small>Everything</small>
        </button>

        <button class="hb2-category ${type==="restaurant"?"active":""}" onclick="home('restaurant')">
          <span class="hb2-cat-icon">🏪</span>
          <b>RESTAURANTS</b>
          <small>Fresh & tasty</small>
        </button>

        <button class="hb2-category ${type==="home"?"active":""}" onclick="home('home')">
          <span class="hb2-cat-icon">🍲</span>
          <b>HOME FOOD</b>
          <small>Ghar ka swaad</small>
        </button>

        <button class="hb2-category"
          onclick="alert('Fast delivery available through local delivery partners.')">
          <span class="hb2-cat-icon">🛵</span>
          <b>FAST DELIVERY</b>
          <small>Quick & safe</small>
        </button>

      </div>

      <div class="hb2-title hb2-shop-title">
        <div>
          <small>NEAR YOU</small>
          <h2>${type==="restaurant"?"Restaurants":type==="home"?"Home Kitchens":"Popular Places"}</h2>
        </div>
      </div>

      <div id="shops" class="hb2-shops">

        ${s.length?s.map(x=>`
          <article class="hb2-shop-card">

            <div class="hb2-shop-image ${x.type==="home"?"home":"restaurant"}">
              <div class="hb2-shop-badge">
                ${x.type==="home"?"HOME FOOD":"RESTAURANT"}
              </div>
              <div class="hb2-food-symbol">
                ${x.type==="home"?"🍲":"🍛"}
              </div>
            </div>

            <div class="hb2-shop-content">

              <div class="hb2-shop-head">
                <h3>${x.name}</h3>
                <span class="hb2-rating">★ ${x.rating||5}</span>
              </div>

              <p>${x.address||"Makrana City"}</p>

              <div class="hb2-shop-bottom">
                <span>● Available</span>
                <button onclick="menu(${x.id})">VIEW MENU →</button>
              </div>

            </div>

          </article>
        `).join(""):`
          <div class="hb2-empty">
            <div>🍽</div>
            <h3>No restaurants available yet</h3>
            <p>Restaurants and home kitchens will appear here.</p>
          </div>
        `}

      </div>

      <div class="hb2-benefits">

        <div>
          <span>🍲</span>
          <b>HOME FOOD</b>
          <small>Made with care</small>
        </div>

        <div>
          <span>🏪</span>
          <b>RESTAURANTS</b>
          <small>Near you</small>
        </div>

        <div>
          <span>🛵</span>
          <b>FAST DELIVERY</b>
          <small>Quick & safe</small>
        </div>

      </div>

      <div class="hb2-actions">
        ${U?.role==="customer"?`<button onclick="orders()">📦 My Orders</button>`:""}
        ${U?.role==="admin"?`<button onclick="admin()">⚙ Admin Panel</button>`:""}
        ${U?.role==="restaurant"?`<button onclick="partner()">🏪 Restaurant Panel</button>`:""}
        ${U?.role==="delivery"?`<button onclick="deliver()">🛵 Delivery Panel</button>`:""}
      </div>

    </section>
  `);
}
function find(q){
  const term=q.toLowerCase().trim();
  document.querySelectorAll("#shops .hb-shop-card").forEach(x=>{
    x.style.display=x.innerText.toLowerCase().includes(term)?"":"none";
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
  if(!navigator.geolocation)return alert("GPS location is required for delivery.");
  const pos=await new Promise((resolve,reject)=>{
    navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:true,timeout:10000});
  });
  latitude=pos.coords.latitude;
  longitude=pos.coords.longitude;

  quote=await api("/api/delivery/quote",{
    method:"POST",
    body:JSON.stringify({shopId:cart[0].shopId,latitude,longitude})
  });
}catch(e){
  return alert(e.message||"Unable to calculate delivery fee");
}

const finalTotal=t+quote.delivery_fee;

layout(`<button onclick="home()">← Home</button><h2>Checkout</h2>
<div class="card">
${cart.map(x=>`<div class="food"><span>${x.name} × ${x.qty}</span><b>₹${x.price*x.qty}</b></div>`).join("")}
<hr>
<p>Food subtotal <b>₹${t}</b></p>
<p>Distance <b>${quote.distance_km.toFixed(1)} km</b></p>
<p>Delivery fee <b>₹${quote.delivery_fee}</b></p>
<h3>Final Total ₹${finalTotal}</h3>
<input id="addr" class="input" placeholder="Full delivery address, Makrana">
<h3>Payment Method</h3>
<label><input type="radio" name="payment" value="COD" checked> 💵 Cash on Delivery</label><br>
<label><input type="radio" name="payment" value="ONLINE"> 💳 Online Payment</label>
<div class="topspace"><button class="btn" onclick="place()">Place Order</button></div>
</div>`)
}

async function place(){
try{
let a=document.getElementById("addr").value;
if(!a)return alert("Address required");
let method=document.querySelector('input[name="payment"]:checked')?.value||"COD";

if(!navigator.geolocation)return alert("GPS location is required for delivery.");
const pos=await new Promise((resolve,reject)=>{
  navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:true,timeout:10000});
});
const latitude=pos.coords.latitude;
const longitude=pos.coords.longitude;

if(method==="COD"){
let r=await api("/api/orders",{method:"POST",body:JSON.stringify({shopId:cart[0].shopId,items:cart.map(x=>({menuId:x.menuId,qty:x.qty})),address:a,payment_method:"COD",latitude,longitude})});
cart=[];alert("Order #HB"+r.orderId+" placed");return orders();
}

let p=await api("/api/payment/create",{method:"POST",body:JSON.stringify({shopId:cart[0].shopId,items:cart.map(x=>({menuId:x.menuId,qty:x.qty})),address:a,latitude,longitude})});

let cfg=await api("/api/config/razorpay");
let options={
key:"",
amount:p.amount,
currency:p.currency,
name:"Home Bite",
description:"Food Order",
order_id:p.razorpay_order_id,
prefill:{name:U.name||""},
theme:{color:"#075d31"},
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
  cart=[];
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
    <div style="margin-top:12px;padding:10px;border-radius:10px;background:#f5f5f5">
      <b>Order Progress</b><br>
      ${x.status==="PLACED"?"🟢":"⚪"} Order Placed →
      ${["PREPARING","READY","ON_THE_WAY","DELIVERED"].includes(x.status)?"🟢":"⚪"} Preparing →
      ${["READY","ON_THE_WAY","DELIVERED"].includes(x.status)?"🟢":"⚪"} Ready →
      ${["ON_THE_WAY","DELIVERED"].includes(x.status)?"🟢":"⚪"} On the Way →
      ${x.status==="DELIVERED"?"🟢":"⚪"} Delivered
    </div>
  </div>`).join(""):"<p>No orders yet.</p>"}<button class="btn topspace" onclick="home()">Home</button>`)
}
function login(){layout(`<h2>Login</h2><input id="loginPhone" class="input" type="tel" autocomplete="off" placeholder="Mobile number"><input id="loginPassword" class="input" type="password" autocomplete="new-password" placeholder="Password"><button class="btn" onclick="doLogin()">Login</button><p>New customer? <button onclick="register()">Create account</button></p>`)}
async function doLogin(){try{const phone=document.getElementById("loginPhone").value.trim();const password=document.getElementById("loginPassword").value.trim();const data=await api("/api/login",{method:"POST",body:JSON.stringify({phone:phone,password:password})});save(data);if(data.user.role==="admin")return admin();if(data.user.role==="restaurant")return partner();if(data.user.role==="delivery")return deliver();return home()}catch(e){alert(e.message)}}
function register(){layout(`<h2>Create account</h2><input id="n" class="input" placeholder="Name"><input id="p" class="input" placeholder="Mobile"><input id="pw" class="input" type="password" placeholder="Password"><button class="btn" onclick="doRegister()">Create</button>`)}
async function doRegister(){try{save(await api("/api/register",{method:"POST",body:JSON.stringify({name:n.value,phone:p.value,password:pw.value})}));home()}catch(e){alert(e.message)}}
function logout(){localStorage.clear();T=null;U=null;home()}
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

  <h3>Food Bite Cities</h3>
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
  layout(`<h2>Add Food Bite City</h2>
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

    alert("Food Bite City created successfully");
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
        <option value="">Select Food Bite City</option>
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
    layout(`<h2>Add Home Kitchen</h2><input id="sn" class="input" placeholder="Business name"><input id="sa" class="input" placeholder="Address"><input id="sp" class="input" placeholder="Phone"><button class="btn" onclick="saveShop("home")">Save</button>`);
    return;
  }

  let f=await api("/api/owner/franchises");

  layout(`<h2>Add Restaurant</h2>
  <div class="card">
    <input id="sn" class="input" placeholder="Business / Restaurant name">
    <input id="on" class="input" placeholder="Owner name">
    <input id="op" class="input" type="tel" placeholder="Owner phone">
    <input id="pw" class="input" type="password" placeholder="Partner password (minimum 6 characters)">
    <input id="sa" class="input" placeholder="Full restaurant address">
    <input id="lat" class="input" type="number" step="any" placeholder="Latitude">
    <input id="lng" class="input" type="number" step="any" placeholder="Longitude">
    <button class="btn" type="button" onclick="getRestaurantLocation()">📍 Use Current Location</button>

    <select id="fi" class="input" onchange="loadRestaurantAreas()">
      <option value="">Select City / Franchise</option>
      ${f.map(x=>`<option value="${x.id}" data-commission="${x.commission_percent}">${x.name} - ${x.city||""}</option>`).join("")}
    </select>

    <select id="ari" class="input">
      <option value="">Select Area</option>
    </select>

    <input id="cp" class="input" type="number" min="0" max="100" step="0.1" placeholder="Commission %">

    <button class="btn" onclick="saveRestaurant()">Create Restaurant Partner</button>
    <button class="btn dark topspace" onclick="admin()">Cancel</button>
  </div>`);
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
async function partner(){let s=await api("/api/partner/shop");layout(`<h2>Restaurant Partner</h2><div class="card"><h3>${s.name}</h3><p>${s.address}</p><button class="btn" onclick="addMenu()">+ Add Menu Item</button></div><h3>Menu</h3><div class="card">${s.menu.map(x=>`<div class="food"><span>${x.name}</span><b>₹${x.price}</b></div>`).join("")}</div><h3>Orders</h3><div class="card">${s.orders.map(x=>`<div class="food"><span>#${x.id} · ${x.customer}<br>₹${x.total} · Payment: ${x.payment_status||"PENDING"}</span><select onchange="pst(${x.id},this.value)"><option>${x.status}</option><option>PREPARING</option><option>READY</option></select></div>`).join("")}</div><button class="btn" onclick="home()">Home</button>`)}
function addMenu(){layout(`<h2>Add Menu Item</h2><input id="mn" class="input" placeholder="Food name"><input id="mp" class="input" type="number" placeholder="Price"><input id="mc" class="input" placeholder="Category"><button class="btn" onclick="saveMenu()">Save</button>`)}
async function saveMenu(){await api("/api/partner/menu",{method:"POST",body:JSON.stringify({name:mn.value,price:Number(mp.value),category:mc.value})});partner()}
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
    <button class="btn topspace" onclick="dst(${x.id},'DELIVERED')">Delivered</button>`:"<b>✅ Delivered</b>"}
  </div>`).join(""):"<p>No assigned deliveries.</p>"}
  <button class="btn topspace" onclick="home()">Home</button>`)
}
async function dst(id,status){await api("/api/delivery/orders/"+id,{method:"PATCH",body:JSON.stringify({status})});deliver()}
home().catch(e=>document.getElementById("app").innerHTML="<div style='padding:30px'><h2>Food Bite Error</h2><pre>"+e.message+"</pre></div>");