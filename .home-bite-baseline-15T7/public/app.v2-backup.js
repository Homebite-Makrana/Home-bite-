const A=document.getElementById("app");let T=localStorage.getItem("hb_token"),U=JSON.parse(localStorage.getItem("hb_user")||"null"),cart=[];
async function api(u,o={}){o.headers={"Content-Type":"application/json",...(o.headers||{})};if(T)o.headers.Authorization="Bearer "+T;let r=await fetch("https://home-bite.onrender.com"+u,o),d=await r.json();if(!r.ok)throw Error(d.error||"Error");return d}
function save(d){T=d.token;U=d.user;localStorage.setItem("hb_token",T);localStorage.setItem("hb_user",JSON.stringify(U))}
function layout(c){A.innerHTML=`<header class="top"><div class="brand"><div class="logo">🍴</div><div><b>HOME BITE</b><small>Makrana City</small></div></div><div>${U?`Hi, ${U.name} <button class="btn dark" onclick="logout()">Logout</button>`:`<button class="btn" onclick="login()">Login</button>`}</div></header><main class="wrap">${c}</main>`}
async function home(type=""){
  let s=await api("/api/shops"+(type?"?type="+type:""));
  layout(`
    <section class="home-head">
      <div class="location">📍 <span>Delivering in</span><b> Makrana City</b></div>
      <div class="welcome">
        <div>
          <small>WELCOME TO</small>
          <h1>HOME <em>BITE</em></h1>
          <p>Ghar ka swaad, ab aapke ghar.</p>
        </div>
        <div class="brand-mark">HB</div>
      </div>
    </section>

    <div class="search-wrap">
      <span>⌕</span>
      <input class="search" placeholder="What are you craving today?" oninput="find(this.value)">
    </div>

    <div class="section-title">
      <div><small>EXPLORE</small><h2>What would you like?</h2></div>
    </div>

    <div class="category-row">
      <button class="category ${!type?'active':''}" onclick="home()">
        <strong>ALL</strong><span>Everything</span>
      </button>
      <button class="category ${type==='restaurant'?'active':''}" onclick="home('restaurant')">
        <strong>RESTAURANTS</strong><span>Fresh & tasty</span>
      </button>
      <button class="category ${type==='home'?'active':''}" onclick="home('home')">
        <strong>HOME KITCHENS</strong><span>Ghar ka swaad</span>
      </button>
    </div>

    <div class="section-title shop-heading">
      <div><small>NEAR YOU</small><h2>${type==='restaurant'?'Restaurants':type==='home'?'Home Kitchens':'Popular places'}</h2></div>
    </div>

    <div id="shops" class="grid shop-grid">
      ${s.map(x=>`
        <article class="shop-card">
          <div class="shop-visual ${x.type==='home'?'home-food':'restaurant-food'}">
            <span>${x.type==='home'?'HOME KITCHEN':'RESTAURANT'}</span>
          </div>
          <div class="shop-info">
            <div class="shop-title"><h3>${x.name}</h3><span class="pill">★ ${x.rating}</span></div>
            <p class="muted">${x.address}</p>
            <div class="shop-bottom"><span>● Available</span><button class="btn" onclick="menu(${x.id})">View Menu →</button></div>
          </div>
        </article>
      `).join("")}
    </div>

    <div class="quick-actions">
      ${U?.role==='customer'?`<button onclick="orders()">📦 My Orders</button>`:""}
      ${U?.role==='admin'?`<button onclick="admin()">⚙ Admin Panel</button>`:""}
      ${U?.role==='restaurant'?`<button onclick="partner()">Restaurant Panel</button>`:""}
      ${U?.role==='delivery'?`<button onclick="deliver()">Delivery Panel</button>`:""}
    </div>
  `)
}
function find(q){[...document.querySelectorAll("#shops .card")].forEach(x=>x.style.display=x.innerText.toLowerCase().includes(q.toLowerCase())?"block":"none")}
async function menu(id){let s=(await api("/api/shops")).find(x=>x.id==id),m=await api("/api/shops/"+id+"/menu");layout(`<button onclick="home()">← Back</button><h2>${s.name}</h2><div class="card">${m.map(x=>`<div class="food"><div><b>${x.name}</b><div class="muted">₹${x.price} · ${x.category}</div></div><button class="btn" onclick="add(${id},${x.id},'${x.name.replace(/'/g,"\\'")}',${x.price})">Add</button></div>`).join("")}</div><div class="topspace"><button class="btn" onclick="checkout()">Cart (${cart.length})</button></div>`)}
function add(shopId,menuId,name,price){if(cart.length&&cart[0].shopId!==shopId)return alert("Please order from one restaurant at a time.");cart.push({shopId,menuId,name,price,qty:1});alert("Added: "+name)}
function checkout(){if(!cart.length)return alert("Cart empty");if(!U)return login();let t=cart.reduce((a,x)=>a+x.price*x.qty,0);layout(`<button onclick="home()">← Home</button><h2>Checkout</h2><div class="card">${cart.map(x=>`<div class="food"><span>${x.name} × ${x.qty}</span><b>₹${x.price*x.qty}</b></div>`).join("")}<h3>Total ₹${t}</h3><input id="addr" class="input" placeholder="Full delivery address, Makrana"><button class="btn" onclick="place()">Place Order</button></div>`)}
async function place(){try{let a=document.getElementById("addr").value;if(!a)return alert("Address required");let r=await api("/api/orders",{method:"POST",body:JSON.stringify({shopId:cart[0].shopId,items:cart.map(x=>({menuId:x.menuId,qty:x.qty})),address:a})});cart=[];alert("Order #HB"+r.orderId+" placed");orders()}catch(e){alert(e.message)}}
async function orders(){let r=await api("/api/orders");layout(`<h2>My Orders</h2>${r.length?r.map(x=>`<div class="card topspace"><div class="row"><b>#HB${x.id} ${x.shop_name}</b><span class="pill">${x.status}</span></div><p>₹${x.total}<br>${x.address}</p></div>`).join(""):"<p>No orders yet.</p>"}<button class="btn topspace" onclick="home()">Home</button>`)}
function login(){layout(`<h2>Login</h2><input id="p" class="input" placeholder="Mobile number"><input id="pw" class="input" type="password" placeholder="Password"><button class="btn" onclick="doLogin()">Login</button><p>New customer? <button onclick="register()">Create account</button></p>`)}
async function doLogin(){try{save(await api("/api/login",{method:"POST",body:JSON.stringify({phone:p.value,password:pw.value})}));home()}catch(e){alert(e.message)}}
function register(){layout(`<h2>Create account</h2><input id="n" class="input" placeholder="Name"><input id="p" class="input" placeholder="Mobile"><input id="pw" class="input" type="password" placeholder="Password"><button class="btn" onclick="doRegister()">Create</button>`)}
async function doRegister(){try{save(await api("/api/register",{method:"POST",body:JSON.stringify({name:n.value,phone:p.value,password:pw.value})}));home()}catch(e){alert(e.message)}}
function logout(){localStorage.clear();T=null;U=null;home()}
async function admin(){let s=await api("/api/admin/stats"),o=await api("/api/admin/orders");layout(`<h2>Admin Panel</h2><div class="grid"><div class="card"><div class="stat">${s.orders}</div>Orders</div><div class="card"><div class="stat">₹${s.revenue}</div>Revenue</div><div class="card"><div class="stat">${s.restaurants}</div>Restaurants</div><div class="card"><div class="stat">${s.customers}</div>Customers</div></div><div class="topspace"><button class="btn" onclick="addShop('restaurant')">+ Restaurant</button> <button class="btn" onclick="addShop('home')">+ Home Kitchen</button></div><h3>Orders</h3><div class="card"><table><tr><th>#</th><th>Customer</th><th>Shop</th><th>Total</th><th>Status</th></tr>${o.map(x=>`<tr><td>${x.id}</td><td>${x.customer}</td><td>${x.shop_name}</td><td>₹${x.total}</td><td><select onchange="ast(${x.id},this.value)"><option>${x.status}</option><option>PREPARING</option><option>READY</option><option>ON_THE_WAY</option><option>DELIVERED</option></select></td></tr>`).join("")}</table></div><button class="btn topspace" onclick="home()">Customer App</button>`)}
async function ast(id,status){await api("/api/admin/orders/"+id,{method:"PATCH",body:JSON.stringify({status})});alert("Status updated")}
function addShop(type){layout(`<h2>Add ${type==='home'?'Home Kitchen':'Restaurant'}</h2><input id="sn" class="input" placeholder="Business name"><input id="sa" class="input" placeholder="Address"><input id="sp" class="input" placeholder="Phone"><button class="btn" onclick="saveShop('${type}')">Save</button>`)}
async function saveShop(type){await api("/api/admin/shops",{method:"POST",body:JSON.stringify({name:sn.value,type,address:sa.value,phone:sp.value})});admin()}
async function partner(){let s=await api("/api/partner/shop");layout(`<h2>Restaurant Partner</h2><div class="card"><h3>${s.name}</h3><p>${s.address}</p><button class="btn" onclick="addMenu()">+ Add Menu Item</button></div><h3>Menu</h3><div class="card">${s.menu.map(x=>`<div class="food"><span>${x.name}</span><b>₹${x.price}</b></div>`).join("")}</div><h3>Orders</h3><div class="card">${s.orders.map(x=>`<div class="food"><span>#${x.id} · ${x.customer}</span><select onchange="pst(${x.id},this.value)"><option>${x.status}</option><option>PREPARING</option><option>READY</option></select></div>`).join("")}</div><button class="btn" onclick="home()">Home</button>`)}
function addMenu(){layout(`<h2>Add Menu Item</h2><input id="mn" class="input" placeholder="Food name"><input id="mp" class="input" type="number" placeholder="Price"><input id="mc" class="input" placeholder="Category"><button class="btn" onclick="saveMenu()">Save</button>`)}
async function saveMenu(){await api("/api/partner/menu",{method:"POST",body:JSON.stringify({name:mn.value,price:Number(mp.value),category:mc.value})});partner()}
async function pst(id,status){await api("/api/partner/orders/"+id,{method:"PATCH",body:JSON.stringify({status})});partner()}
async function deliver(){let r=await api("/api/delivery/orders");layout(`<h2>Delivery Panel</h2>${r.length?r.map(x=>`<div class="card topspace"><b>#HB${x.id} · ${x.shop_name}</b><p>Customer: ${x.customer}<br>Pickup: ${x.shop_address}<br>Drop: ${x.address}</p><span class="pill">${x.status}</span><br><button class="btn topspace" onclick="dst(${x.id},'ON_THE_WAY')">Picked Up</button> <button class="btn topspace" onclick="dst(${x.id},'DELIVERED')">Delivered</button></div>`).join(""):"<p>No assigned deliveries.</p>"}<button class="btn topspace" onclick="home()">Home</button>`)}
async function dst(id,status){await api("/api/delivery/orders/"+id,{method:"PATCH",body:JSON.stringify({status})});deliver()}
home();