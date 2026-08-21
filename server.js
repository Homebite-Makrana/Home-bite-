import "dotenv/config";
import { registerOwnerApi } from "./owner-api.js";
import express from "express";
import cors from "cors";
import { createDatabase } from "./db-adapter.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import Razorpay from "razorpay";
import path from "path";
import {fileURLToPath} from "url";

const __filename=fileURLToPath(import.meta.url), __dirname=path.dirname(__filename);
const app=express();
const db = await createDatabase("foodbite.db");
const SECRET=process.env.JWT_SECRET;
if(!SECRET || SECRET.length < 32){
  throw new Error("JWT_SECRET is missing or too short");
}
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});
app.use(cors());


// ===== V61B_RAZORPAY_WEBHOOK =====
// Webhook MUST receive the raw body before express.json().
app.post("/api/payment/webhook",
  express.raw({type:"application/json"}),
  async (req,res)=>{
    try{
      const secret=process.env.RAZORPAY_WEBHOOK_SECRET;
      if(!secret){
        console.error("RAZORPAY WEBHOOK: secret not configured");
        return res.status(500).json({error:"Webhook secret is not configured"});
      }

      const signature=req.headers["x-razorpay-signature"];
      if(!signature || !Buffer.isBuffer(req.body)){
        return res.status(400).json({error:"Invalid webhook request"});
      }

      const expected=crypto
        .createHmac("sha256",secret)
        .update(req.body)
        .digest("hex");

      const signatureBuffer=Buffer.from(String(signature));
      const expectedBuffer=Buffer.from(expected);
      if(signatureBuffer.length!==expectedBuffer.length || !crypto.timingSafeEqual(expectedBuffer,signatureBuffer)){
        return res.status(400).json({error:"Webhook signature verification failed"});
      }

      const payload=JSON.parse(req.body.toString("utf8"));
      const eventId=String(req.headers["x-razorpay-event-id"]||"").trim();
      const eventType=String(payload?.event||"").trim();

      if(!eventId){
        return res.status(400).json({error:"Webhook event ID missing"});
      }

      const paymentEntity=payload?.payload?.payment?.entity||{};
      const orderId=paymentEntity?.order_id||null;
      const paymentId=paymentEntity?.id||null;

      // Idempotency: the same Razorpay event must never be processed twice.
      const existing=db.prepare(
        "SELECT id FROM payment_events WHERE event_id=?"
      ).get(eventId);

      if(existing){
        return res.json({ok:true,duplicate:true});
      }

      db.prepare(`
        INSERT INTO payment_events
        (event_id,event_type,razorpay_payment_id,razorpay_order_id,payload)
        VALUES(?,?,?,?,?)
      `).run(
        eventId,
        eventType,
        paymentId,
        orderId,
        JSON.stringify(payload)
      );

      // Webhook confirms payment state independently of the customer app.
      if(
        (eventType==="payment.captured" || eventType==="order.paid") &&
        orderId &&
        paymentId
      ){
        const order=db.prepare(
          "SELECT * FROM orders WHERE razorpay_order_id=?"
        ).get(orderId);

        if(order && order.payment_method==="ONLINE"){
          if(order.payment_status!=="PAID"){
            db.prepare(`
              UPDATE orders
              SET payment_status='PAID',
                  status='PLACED',
                  razorpay_payment_id=?
              WHERE id=?
                AND payment_method='ONLINE'
            `).run(paymentId,order.id);

            addCommission(
              order.id,
              order.shop_id,
              order.franchise_id,
              order.commission_amount,
              "PENDING",
              commissionForShop(
                db.prepare(
                  "SELECT * FROM shops WHERE id=?"
                ).get(order.shop_id)
              )
            );
          }

          // Settlement remains guarded by payout verification
          // and duplicate-transfer protection.
          await settleRestaurantTransfer(order.id);
        }
      }

      return res.json({
        ok:true,
        event_id:eventId,
        event_type:eventType
      });

    }catch(e){
      console.error("RAZORPAY WEBHOOK ERROR:",e);
      return res.status(500).json({
        error:e.message||"Webhook processing failed"
      });
    }
  }
);
// ===== END V61B_RAZORPAY_WEBHOOK =====

app.use(express.json()); app.use((req,res,next)=>{res.setHeader("Cache-Control","no-store, no-cache, must-revalidate, proxy-revalidate"); next()}); app.use(express.static(path.join(__dirname,"public")));
app.get("/health",(req,res)=>res.json({ok:true,service:"HOME BITE",database:"postgres"}));
app.get("/api/config/razorpay",(req,res)=>res.json({key_id:process.env.RAZORPAY_KEY_ID}));

db.exec(`
CREATE TABLE IF NOT EXISTS notifications(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  order_id INTEGER,
  message TEXT NOT NULL,
  read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,phone TEXT UNIQUE NOT NULL,password TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'customer');
CREATE TABLE IF NOT EXISTS shops(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,type TEXT NOT NULL,address TEXT,phone TEXT,rating REAL DEFAULT 5,active INTEGER DEFAULT 1,owner_id INTEGER);
CREATE TABLE IF NOT EXISTS menu(id INTEGER PRIMARY KEY AUTOINCREMENT,shop_id INTEGER,name TEXT NOT NULL,price REAL NOT NULL,category TEXT,available INTEGER DEFAULT 1);
CREATE TABLE IF NOT EXISTS orders(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER NOT NULL,shop_id INTEGER NOT NULL,total REAL NOT NULL,address TEXT NOT NULL,status TEXT DEFAULT 'PLACED',payment_status TEXT DEFAULT 'PENDING',delivery_id INTEGER,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS order_items(id INTEGER PRIMARY KEY AUTOINCREMENT,order_id INTEGER,menu_id INTEGER,name TEXT,qty INTEGER,price REAL);
`);

// V61 business-account tables. db.exec() is intentionally a no-op with the PostgreSQL adapter,
// so these statements are executed individually through db.prepare().
for (const sql of [
  `CREATE TABLE IF NOT EXISTS account_profiles (id SERIAL PRIMARY KEY, user_id INTEGER UNIQUE NOT NULL, email TEXT, address TEXT, city TEXT, state TEXT, pincode TEXT, avatar_url TEXT, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS payout_accounts (id SERIAL PRIMARY KEY, user_id INTEGER UNIQUE NOT NULL, account_holder TEXT, bank_name TEXT, account_number TEXT, ifsc TEXT, upi_id TEXT, razorpay_account_id TEXT, status TEXT DEFAULT 'PENDING', updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS app_settings (id SERIAL PRIMARY KEY, setting_key TEXT UNIQUE NOT NULL, setting_value TEXT, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`
]) { try { db.prepare(sql).run(); } catch(e) { console.error('V61 MIGRATION:', e.message); } }

function addUser(name,phone,password,role){
  let u=db.prepare("SELECT id FROM users WHERE phone=?").get(phone);
  if(!u) db.prepare("INSERT INTO users(name,phone,password,role) VALUES(?,?,?,?)").run(name,phone,bcrypt.hashSync(password,10),role);
  return db.prepare("SELECT * FROM users WHERE phone=?").get(phone);
}
function addShop(name,type,address,phone,owner_id){
  let s=db.prepare("SELECT id FROM shops WHERE name=?").get(name);
  if(!s) return db.prepare("INSERT INTO shops(name,type,address,phone,owner_id) VALUES(?,?,?,?,?)").run(name,type,address,phone,owner_id).lastInsertRowid;
  return s.id;
}
// Admin account is managed separately; no default admin password is created here.
function token(u){return jwt.sign({id:u.id,name:u.name,role:u.role},SECRET,{expiresIn:"7d"})}
function auth(req,res,next){try{req.user=jwt.verify((req.headers.authorization||"").replace("Bearer ",""),SECRET);next()}catch(e){res.status(401).json({error:"Login required"})}}
function role(...roles){return (req,res,next)=>roles.includes(req.user.role)?next():res.status(403).json({error:"Not allowed"})}

/* Change password for the currently logged-in account */
app.patch("/api/account/password",auth,async(req,res)=>{
  try{
    const {current_password,new_password,confirm_password}=req.body||{};

    if(!current_password||!new_password||!confirm_password)
      return res.status(400).json({error:"All password fields are required"});

    if(new_password.length<6)
      return res.status(400).json({error:"New password must be at least 6 characters"});

    if(new_password!==confirm_password)
      return res.status(400).json({error:"New passwords do not match"});

    const user=db.prepare("SELECT * FROM users WHERE id=?").get(req.user.id);

    if(!user)
      return res.status(404).json({error:"Account not found"});

    if(!bcrypt.compareSync(current_password,user.password))
      return res.status(400).json({error:"Current password is incorrect"});

    db.prepare("UPDATE users SET password=? WHERE id=?")
      .run(bcrypt.hashSync(new_password,10),req.user.id);

    res.json({ok:true,message:"Password changed successfully"});
  }catch(e){
    console.error("PASSWORD CHANGE ERROR:",e);
    res.status(500).json({error:"Unable to change password"});
  }
});


app.post("/api/register",(req,res)=>{
 const {name,phone,password}=req.body||{}; if(!name||!phone||!password)return res.status(400).json({error:"Required fields missing"});
 try{const r=db.prepare("INSERT INTO users(name,phone,password) VALUES(?,?,?)").run(name,phone,bcrypt.hashSync(password,10));const u={id:r.lastInsertRowid,name,role:"customer"};res.json({token:token(u),user:u})}catch(e){res.status(400).json({error:"Phone already registered"})}
});
app.post("/api/login",(req,res)=>{
 const loginPhone=String(req.body.phone||"").trim(); const loginPassword=String(req.body.password||""); const u=db.prepare("SELECT * FROM users WHERE phone=?").get(loginPhone); 
 if(!u||!bcrypt.compareSync(loginPassword,u.password))return res.status(401).json({error:"Invalid login"});
 res.json({token:token(u),user:{id:u.id,name:u.name,role:u.role,shop_id:db.prepare("SELECT id FROM shops WHERE owner_id=?").get(u.id)?.id||null}})
});
app.get("/api/shops",(req,res)=>{const t=req.query.type;res.json(db.prepare(t?"SELECT * FROM shops WHERE active=1 AND type=?":"SELECT * FROM shops WHERE active=1").all(...(t?[t]:[])))});
app.get("/api/shops/:id/menu",(req,res)=>res.json(db.prepare("SELECT * FROM menu WHERE shop_id=? AND available=1").all(req.params.id)));


function commissionForShop(shop){
  const f=shop?.franchise_id ? db.prepare("SELECT commission_percent FROM franchises WHERE id=?").get(shop.franchise_id) : null;
  const n=Number(f?.commission_percent);
  return Number.isFinite(n) ? n : 15;
}

function addCommission(orderId,shopId,franchiseId,amount,status="PENDING",percent=15){
  const exists=db.prepare("SELECT id FROM commissions WHERE order_id=?").get(orderId);
  if(exists)return;
  db.prepare(`
    INSERT INTO commissions(order_id,franchise_id,shop_id,amount,percent,status)
    VALUES(?,?,?,?,?,?)
  `).run(orderId,franchiseId||null,shopId,amount,percent,status);
}

function notifyOrderStatus(orderId,status){
  const o=db.prepare("SELECT user_id FROM orders WHERE id=?").get(orderId);
  if(!o)return;

  const messages={
    PLACED:"Order placed successfully",
    PREPARING:"Restaurant is preparing your order",
    READY:"Your order is ready for pickup",
    ON_THE_WAY:"Your order is on the way",
    DELIVERED:"Order delivered successfully"
  };

  const message=messages[status]||("Order status: "+status);

  db.prepare(
    "INSERT INTO notifications(user_id,order_id,message) VALUES(?,?,?)"
  ).run(o.user_id,orderId,message);
}

function deliveryFeeKm(km){
  if(km<=2)return 25;
  if(km<=4)return 30;
  if(km<=6)return 35;
  return 40;
}
function distanceKm(lat1,lon1,lat2,lon2){
  const R=6371, r=Math.PI/180;
  const dLat=(lat2-lat1)*r, dLon=(lon2-lon1)*r;
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*r)*Math.cos(lat2*r)*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

app.post("/api/orders",auth,role("customer"),(req,res)=>{
 const {shopId,items,address,latitude,longitude,payment_method}=req.body||{};
 if(!shopId||!items?.length||!address)return res.status(400).json({error:"Shop/items/address required"});

 const shop=db.prepare("SELECT * FROM shops WHERE id=? AND active=1").get(shopId);
 if(!shop)return res.status(400).json({error:"Invalid shop"});

 let subtotal=0,checked=[],get=db.prepare("SELECT * FROM menu WHERE id=? AND shop_id=?");
 try{
  for(const x of items){
   const m=get.get(x.menuId,shopId);if(!m)throw Error("Invalid item");
   const qty=Number(x.qty||1);subtotal+=m.price*qty;checked.push({...m,qty});
  }
 }catch(e){return res.status(400).json({error:e.message})}

 if(!Number.isFinite(Number(latitude))||!Number.isFinite(Number(longitude))||shop.latitude==null||shop.longitude==null)
   return res.status(400).json({error:"Location required for delivery fee"});

 const km=distanceKm(Number(latitude),Number(longitude),Number(shop.latitude),Number(shop.longitude));
 const deliveryFee=deliveryFeeKm(km);
 const commissionPercent=commissionForShop(shop);
 const commissionAmount=Math.round(subtotal*commissionPercent)/100;
 const total=subtotal+deliveryFee;

 const r=db.prepare(`
  INSERT INTO orders(user_id,shop_id,total,address,status,payment_status,payment_method,franchise_id,commission_amount,delivery_fee)
  VALUES(?,?,?,?,?,?,?,?,?,?)
 `).run(req.user.id,shopId,total,address,"PLACED","PENDING",payment_method||"COD",shop.franchise_id||null,commissionAmount,deliveryFee);

 const ins=db.prepare("INSERT INTO order_items(order_id,menu_id,name,qty,price) VALUES(?,?,?,?,?)");
 checked.forEach(x=>ins.run(r.lastInsertRowid,x.id,x.name,x.qty,x.price));

 res.json({orderId:r.lastInsertRowid,total,subtotal,delivery_fee:deliveryFee,commission_amount:commissionAmount,distance_km:km,status:"PLACED",payment_status:"PENDING"});
});
app.post("/api/delivery/quote",auth,role("customer"),(req,res)=>{
  const {shopId,latitude,longitude}=req.body||{};
  const shop=db.prepare("SELECT latitude,longitude FROM shops WHERE id=? AND active=1").get(shopId);
  if(!shop||shop.latitude==null||shop.longitude==null)
    return res.status(400).json({error:"Restaurant location unavailable"});
  if(!Number.isFinite(Number(latitude))||!Number.isFinite(Number(longitude)))
    return res.status(400).json({error:"Location required"});
  const km=distanceKm(Number(latitude),Number(longitude),Number(shop.latitude),Number(shop.longitude));
  res.json({distance_km:km,delivery_fee:deliveryFeeKm(km)});
});

app.post("/api/payment/create",auth,role("customer"),async(req,res)=>{
  try{
    const {shopId,items,address,latitude,longitude}=req.body||{};
    if(!shopId||!items?.length||!address)
      return res.status(400).json({error:"Shop/items/address required"});

    let subtotal=0,checked=[];
    const get=db.prepare("SELECT * FROM menu WHERE id=? AND shop_id=?");

    for(const x of items){
      const m=get.get(x.menuId,shopId);
      if(!m)return res.status(400).json({error:"Invalid item"});
      const qty=Number(x.qty||1);
      subtotal+=m.price*qty;
      checked.push({...m,qty});
    }

    if(!Number.isFinite(Number(latitude))||!Number.isFinite(Number(longitude)))
      return res.status(400).json({error:"Location required for delivery fee"});
    const shop=db.prepare("SELECT * FROM shops WHERE id=? AND active=1").get(shopId);
    if(!shop||shop.latitude==null||shop.longitude==null)
      return res.status(400).json({error:"Restaurant location unavailable"});
    const km=distanceKm(Number(latitude),Number(longitude),Number(shop.latitude),Number(shop.longitude));
    const deliveryFee=deliveryFeeKm(km);
    const commissionPercent=commissionForShop(shop);
    const commissionAmount=Math.round(subtotal*commissionPercent)/100;
    const total=subtotal+deliveryFee;

    const rp=await razorpay.orders.create({
      amount:Math.round(total*100),
      currency:"INR",
      receipt:"HB_"+Date.now(),
      notes:{shopId:String(shopId),userId:String(req.user.id)}
    });

    const r=db.prepare(
      "INSERT INTO orders(user_id,shop_id,total,address,status,payment_status,payment_method,franchise_id,commission_amount,delivery_fee,razorpay_order_id) VALUES(?,?,?,?,?,?,?,?,?,?,?)"
    ).run(req.user.id,shopId,total,address,"PAYMENT_PENDING","PENDING","ONLINE",shop.franchise_id||null,commissionAmount,deliveryFee,rp.id);

    const ins=db.prepare("INSERT INTO order_items(order_id,menu_id,name,qty,price) VALUES(?,?,?,?,?)");
    checked.forEach(x=>ins.run(r.lastInsertRowid,x.id,x.name,x.qty,x.price));

    res.json({
      ok:true,
      orderId:r.lastInsertRowid,
      razorpay_order_id:rp.id,
      amount:rp.amount,
      currency:rp.currency,
      subtotal,
      delivery_fee:deliveryFee,
      commission_amount:commissionAmount,
      distance_km:km
    });
  }catch(e){
    console.error("RAZORPAY CREATE ERROR:",e);
    res.status(500).json({error:e.message||"Payment order failed"});
  }
});


// ===== V61_REAL_ROUTE_SETTLEMENT =====
async function v61RazorpayTransfer(paymentId, accountId, amountPaise, orderId){
  const key = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;

  if(!key || !secret) throw new Error("Razorpay credentials are not configured");
  if(!paymentId) throw new Error("Razorpay payment ID missing");
  if(!accountId) throw new Error("Razorpay Linked Account ID missing");
  if(!Number.isInteger(amountPaise) || amountPaise < 100)
    throw new Error("Invalid restaurant transfer amount");

  const auth = Buffer.from(key + ":" + secret).toString("base64");

  const response = await fetch(
    "https://api.razorpay.com/v1/payments/" +
    encodeURIComponent(paymentId) + "/transfers",
    {
      method:"POST",
      headers:{
        "Authorization":"Basic " + auth,
        "Content-Type":"application/json"
      },
      body:JSON.stringify({
        transfers:[{
          account:accountId,
          amount:amountPaise,
          currency:"INR",
          notes:{
            home_bite_order:String(orderId),
            purpose:"restaurant_payout"
          }
        }]
      })
    }
  );

  const data = await response.json().catch(()=>({}));

  if(!response.ok)
    throw new Error(data?.error?.description || data?.error?.reason || "Razorpay Route transfer failed");

  return data;
}


async function settleDeliveryTransfer(orderId){
  const order=db.prepare("SELECT * FROM orders WHERE id=?").get(orderId);

  if(!order)
    return {ok:false,status:"ORDER_NOT_FOUND"};

  if(order.payment_method!=="ONLINE")
    return {ok:true,status:"COD_NO_RAZORPAY_TRANSFER",amount:Number(order.delivery_fee||0)};

  if(order.payment_status!=="PAID" || !order.razorpay_payment_id)
    return {ok:false,status:"PAYMENT_NOT_PAID"};

  if(!order.delivery_id)
    return {ok:false,status:"DELIVERY_AGENT_NOT_ASSIGNED"};

  const payout=db.prepare(
    "SELECT * FROM payout_accounts WHERE user_id=?"
  ).get(order.delivery_id);

  if(!payout || payout.status!=="VERIFIED" || !payout.razorpay_account_id){
    return {
      ok:false,
      status:"DELIVERY_PAYOUT_NOT_READY",
      message:"Delivery Partner Razorpay Linked Account is not verified"
    };
  }

  const amountPaise=Math.round(Number(order.delivery_fee||0)*100);

  if(amountPaise<100)
    return {ok:true,status:"NO_DELIVERY_TRANSFER_AMOUNT",amount:amountPaise/100};

  const existing=db.prepare(
    "SELECT * FROM payment_transfers WHERE order_id=? AND beneficiary_user_id=?"
  ).get(order.id,order.delivery_id);

  if(existing?.status==="PROCESSED"){
    return {
      ok:true,
      status:"PROCESSED",
      transfer_id:existing.razorpay_transfer_id||null,
      amount:Number(existing.amount||0)
    };
  }

  if(existing?.status==="PENDING"){
    return {
      ok:true,
      status:"PENDING",
      transfer_id:existing.razorpay_transfer_id||null,
      amount:Number(existing.amount||0),
      message:"Delivery transfer already exists and is awaiting reconciliation"
    };
  }

  let rowId=existing?.id;

  if(!rowId){
    const r=db.prepare(`
      INSERT INTO payment_transfers
      (order_id,shop_id,beneficiary_user_id,razorpay_payment_id,
       razorpay_account_id,amount,status)
      VALUES(?,?,?,?,?,?,?)
      RETURNING id
    `).run(
      order.id,
      order.shop_id,
      order.delivery_id,
      order.razorpay_payment_id,
      payout.razorpay_account_id,
      amountPaise/100,
      "PENDING"
    );
    rowId=r.lastInsertRowid;
  }else{
    db.prepare(`
      UPDATE payment_transfers
      SET status='PENDING',
          razorpay_payment_id=?,
          razorpay_account_id=?,
          amount=?,
          failure_reason=NULL,
          updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(
      order.razorpay_payment_id,
      payout.razorpay_account_id,
      amountPaise/100,
      rowId
    );
  }

  try{
    const transfer=await v61RazorpayTransfer(
      order.razorpay_payment_id,
      payout.razorpay_account_id,
      amountPaise,
      order.id
    );

    const transferStatus=
      transfer.transfer_status ||
      transfer.status ||
      "PENDING";

    const normalized=
      transferStatus==="processed" ? "PROCESSED" :
      transferStatus==="failed" ? "FAILED" :
      "PENDING";

    db.prepare(`
      UPDATE payment_transfers
      SET razorpay_transfer_id=?,
          status=?,
          failure_reason=NULL,
          updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(
      transfer.id||null,
      normalized,
      rowId
    );

    db.prepare(`
      INSERT INTO settlement_records
      (order_id,user_id,transfer_id,gross_amount,
       commission_amount,payable_amount,status,settled_at)
      VALUES(?,?,?,?,?,?,?,?)
      ON CONFLICT DO NOTHING
    `).run(
      order.id,
      order.delivery_id,
      rowId,
      Number(order.delivery_fee||0),
      0,
      amountPaise/100,
      normalized,
      normalized==="PROCESSED" ? new Date() : null
    );

    return {
      ok:true,
      status:normalized,
      transfer_id:transfer.id||null,
      amount:amountPaise/100
    };

  }catch(e){
    db.prepare(`
      UPDATE payment_transfers
      SET status='FAILED',
          failure_reason=?,
          updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(
      String(e.message||e).slice(0,1000),
      rowId
    );

    db.prepare(`
      INSERT INTO settlement_records
      (order_id,user_id,transfer_id,gross_amount,
       commission_amount,payable_amount,status)
      VALUES(?,?,?,?,?,?,?)
      ON CONFLICT DO NOTHING
    `).run(
      order.id,
      order.delivery_id,
      rowId,
      Number(order.delivery_fee||0),
      0,
      amountPaise/100,
      "FAILED"
    );

    return {
      ok:false,
      status:"FAILED",
      message:String(e.message||e)
    };
  }
}

async function settleRestaurantTransfer(orderId){
  const order = db.prepare("SELECT * FROM orders WHERE id=?").get(orderId);
  if(!order || order.payment_status!=="PAID")
    return {ok:false,status:"PAYMENT_NOT_PAID"};

  const shop = db.prepare("SELECT * FROM shops WHERE id=?").get(order.shop_id);
  if(!shop || !shop.owner_id)
    return {ok:false,status:"RESTAURANT_OWNER_MISSING"};

  const payout = db.prepare(
    "SELECT * FROM payout_accounts WHERE user_id=?"
  ).get(shop.owner_id);

  if(!payout || payout.status!=="VERIFIED" || !payout.razorpay_account_id){
    return {
      ok:false,
      status:"PAYOUT_NOT_READY",
      message:"Restaurant Razorpay Linked Account is not verified"
    };
  }

  const restaurantAmount =
    Math.round(
      (Number(order.total||0) -
       Number(order.delivery_fee||0) -
       Number(order.commission_amount||0)) * 100
    );

  if(restaurantAmount < 100){
    return {
      ok:false,
      status:"NO_TRANSFERABLE_AMOUNT"
    };
  }

  const existing = db.prepare(
    "SELECT * FROM payment_transfers WHERE order_id=? AND beneficiary_user_id=?"
  ).get(order.id, shop.owner_id);

  if(existing?.status==="PROCESSED"){
    return {ok:true,status:"PROCESSED",transfer_id:existing.razorpay_transfer_id||null};
  }

  // A PENDING transfer must not be blindly recreated.
  // Reconciliation/retry is handled explicitly by the admin endpoint.
  if(existing?.status==="PENDING"){
    return {
      ok:true,
      status:"PENDING",
      transfer_id:existing.razorpay_transfer_id||null,
      message:"Transfer already exists and is awaiting reconciliation"
    };
  }

  let rowId = existing?.id;

  if(!rowId){
    const r = db.prepare(`
      INSERT INTO payment_transfers
      (order_id,shop_id,beneficiary_user_id,razorpay_payment_id,
       razorpay_account_id,amount,status)
      VALUES(?,?,?,?,?,?,?)
      RETURNING id
    `).run(
      order.id,
      order.shop_id,
      shop.owner_id,
      order.razorpay_payment_id,
      payout.razorpay_account_id,
      restaurantAmount/100,
      "PENDING"
    );
    rowId = r.lastInsertRowid;
  } else {
    db.prepare(`
      UPDATE payment_transfers
      SET status='PENDING',
          razorpay_payment_id=?,
          razorpay_account_id=?,
          amount=?,
          failure_reason=NULL,
          updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(
      order.razorpay_payment_id,
      payout.razorpay_account_id,
      restaurantAmount/100,
      rowId
    );
  }

  try{
    const transfer = await v61RazorpayTransfer(
      order.razorpay_payment_id,
      payout.razorpay_account_id,
      restaurantAmount,
      order.id
    );

    const transferStatus =
      transfer.transfer_status ||
      transfer.status ||
      "PENDING";

    const normalized =
      transferStatus==="processed" ? "PROCESSED" :
      transferStatus==="failed" ? "FAILED" :
      "PENDING";

    db.prepare(`
      UPDATE payment_transfers
      SET razorpay_transfer_id=?,
          status=?,
          failure_reason=NULL,
          updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(
      transfer.id || null,
      normalized,
      rowId
    );

    db.prepare(`
      INSERT INTO settlement_records
      (order_id,user_id,transfer_id,gross_amount,
       commission_amount,payable_amount,status,settled_at)
      VALUES(?,?,?,?,?,?,?,?)
      ON CONFLICT DO NOTHING
    `).run(
      order.id,
      shop.owner_id,
      rowId,
      Number(order.total||0),
      Number(order.commission_amount||0),
      restaurantAmount/100,
      normalized,
      normalized==="PROCESSED" ? new Date() : null
    );

    return {
      ok:true,
      status:normalized,
      transfer_id:transfer.id || null,
      amount:restaurantAmount/100
    };

  }catch(e){
    db.prepare(`
      UPDATE payment_transfers
      SET status='FAILED',
          failure_reason=?,
          updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(String(e.message||e).slice(0,1000),rowId);

    db.prepare(`
      INSERT INTO settlement_records
      (order_id,user_id,transfer_id,gross_amount,
       commission_amount,payable_amount,status)
      VALUES(?,?,?,?,?,?,?)
      ON CONFLICT DO NOTHING
    `).run(
      order.id,
      shop.owner_id,
      rowId,
      Number(order.total||0),
      Number(order.commission_amount||0),
      restaurantAmount/100,
      "FAILED"
    );

    return {
      ok:false,
      status:"FAILED",
      message:String(e.message||e)
    };
  }
}

app.post("/api/admin/settlements/:orderId/retry",auth,async(req,res)=>{
  try{
    if(req.user.role!=="admin")
      return res.status(403).json({error:"Admin access required"});

    const orderId=Number(req.params.orderId);
    if(!Number.isInteger(orderId) || orderId<=0)
      return res.status(400).json({error:"Invalid order ID"});

    const row=db.prepare(
      "SELECT * FROM payment_transfers WHERE order_id=? ORDER BY id DESC LIMIT 1"
    ).get(orderId);

    if(row?.status==="PROCESSED")
      return res.json({
        ok:true,
        status:"PROCESSED",
        transfer_id:row.razorpay_transfer_id||null,
        message:"Transfer already processed"
      });

    if(row?.status!=="FAILED")
      return res.status(409).json({
        error:"Only FAILED transfers can be retried safely"
      });

    const result=await settleRestaurantTransfer(orderId);
    res.json(result);
  }catch(e){
    res.status(500).json({error:e.message||"Settlement retry failed"});
  }
});

app.get("/api/payment/transfer-status/:orderId",auth,async(req,res)=>{
  try{
    const orderId=Number(req.params.orderId);
    const order=db.prepare("SELECT * FROM orders WHERE id=?").get(orderId);

    if(!order) return res.status(404).json({error:"Order not found"});

    if(req.user.role!=="admin" && order.user_id!==req.user.id){
      const shop=db.prepare("SELECT owner_id FROM shops WHERE id=?").get(order.shop_id);
      if(!shop || shop.owner_id!==req.user.id)
        return res.status(403).json({error:"Access denied"});
    }

    const row=db.prepare(
      "SELECT * FROM payment_transfers WHERE order_id=? ORDER BY id DESC LIMIT 1"
    ).get(orderId);

    res.json(row||null);
  }catch(e){
    res.status(500).json({error:e.message});
  }
});

// ===== END V61_REAL_ROUTE_SETTLEMENT =====

// ===== V61_EARNINGS_SETTLEMENT_APIS =====

app.get("/api/account/earnings",auth,async(req,res)=>{
  try{
    const rows=db.prepare(`
      SELECT
        pt.id,
        pt.order_id,
        pt.amount,
        pt.status,
        pt.razorpay_transfer_id,
        pt.failure_reason,
        pt.created_at,
        pt.updated_at,
        s.name AS shop_name
      FROM payment_transfers pt
      LEFT JOIN shops s ON s.id=pt.shop_id
      WHERE pt.beneficiary_user_id=?
      ORDER BY pt.id DESC
      LIMIT 100
    `).all(req.user.id);

    const total=rows.reduce((n,x)=>
      n+(x.status==="PROCESSED"?Number(x.amount||0):0),0);

    const pending=rows.reduce((n,x)=>
      n+(x.status==="PENDING"?Number(x.amount||0):0),0);

    const failed=rows.reduce((n,x)=>
      n+(x.status==="FAILED"?Number(x.amount||0):0),0);

    res.json({
      total_earnings:total,
      pending_amount:pending,
      failed_amount:failed,
      records:rows
    });
  }catch(e){
    res.status(500).json({error:e.message||"Unable to load earnings"});
  }
});

app.get("/api/account/settlements",auth,async(req,res)=>{
  try{
    const rows=db.prepare(`
      SELECT
        sr.id,
        sr.order_id,
        sr.gross_amount,
        sr.commission_amount,
        sr.payable_amount,
        sr.status,
        sr.settled_at,
        sr.created_at,
        pt.razorpay_transfer_id
      FROM settlement_records sr
      LEFT JOIN payment_transfers pt ON pt.id=sr.transfer_id
      WHERE sr.user_id=?
      ORDER BY sr.id DESC
      LIMIT 100
    `).all(req.user.id);

    res.json(rows);
  }catch(e){
    res.status(500).json({error:e.message||"Unable to load settlements"});
  }
});

app.get("/api/admin/settlements",auth,async(req,res)=>{
  try{
    if(req.user.role!=="admin")
      return res.status(403).json({error:"Admin access required"});

    const rows=db.prepare(`
      SELECT
        pt.id,
        pt.order_id,
        pt.amount,
        pt.status,
        pt.razorpay_transfer_id,
        pt.razorpay_account_id,
        pt.failure_reason,
        pt.created_at,
        pt.updated_at,
        u.name AS owner_name,
        u.phone AS owner_phone,
        s.name AS shop_name
      FROM payment_transfers pt
      LEFT JOIN users u ON u.id=pt.beneficiary_user_id
      LEFT JOIN shops s ON s.id=pt.shop_id
      ORDER BY pt.id DESC
      LIMIT 200
    `).all();

    res.json(rows);
  }catch(e){
    res.status(500).json({error:e.message||"Unable to load settlements"});
  }
});

// ===== END V61_EARNINGS_SETTLEMENT_APIS =====



app.post("/api/payment/verify",auth,role("customer"),async(req,res)=>{
  try{
    const {razorpay_order_id,razorpay_payment_id,razorpay_signature}=req.body||{};

    if(!razorpay_order_id||!razorpay_payment_id||!razorpay_signature)
      return res.status(400).json({error:"Payment verification data missing"});

    const order=db.prepare(
      "SELECT * FROM orders WHERE razorpay_order_id=? AND user_id=?"
    ).get(razorpay_order_id,req.user.id);

    if(!order)
      return res.status(404).json({error:"Order not found"});

    const expected=crypto.createHmac("sha256",process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id+"|"+razorpay_payment_id)
      .digest("hex");

    if(expected!==razorpay_signature)
      return res.status(400).json({error:"Payment signature verification failed"});

    if(order.payment_method!=="ONLINE")
      return res.status(400).json({error:"Invalid payment method"});

    if(order.payment_status==="PAID")
      return res.json({
        ok:true,
        orderId:order.id,
        payment_status:"PAID",
        already_paid:true
      });

    db.prepare(`
      UPDATE orders
      SET payment_status='PAID',
          status='PLACED',
          razorpay_payment_id=?,
          razorpay_signature=?
      WHERE id=? AND user_id=? AND payment_method='ONLINE'
    `).run(
      razorpay_payment_id,
      razorpay_signature,
      order.id,
      req.user.id
    );

    addCommission(
      order.id,
      order.shop_id,
      order.franchise_id,
      order.commission_amount,
      "PENDING",
      commissionForShop(db.prepare("SELECT * FROM shops WHERE id=?").get(order.shop_id))
    );

    const settlement = await settleRestaurantTransfer(order.id);

    res.json({
      ok:true,
      orderId:order.id,
      payment_status:"PAID"
    });
  }catch(e){
    console.error("RAZORPAY VERIFY ERROR:",e);
    res.status(500).json({error:e.message||"Payment verification failed"});
  }
});

app.post("/api/payment/confirm",auth,role("customer"),async(req,res)=>{
  try{
    const {razorpay_order_id}=req.body||{};
    if(!razorpay_order_id)
      return res.status(400).json({error:"Razorpay order ID required"});

    const order=db.prepare(
      "SELECT * FROM orders WHERE razorpay_order_id=? AND user_id=?"
    ).get(razorpay_order_id,req.user.id);

    if(!order)
      return res.status(404).json({error:"Order not found"});

    const payments=await razorpay.orders.fetchPayments(razorpay_order_id);
    const paid=payments.items?.find(x=>x.status==="captured");

    if(!paid)
      return res.status(400).json({error:"Payment not captured yet"});

    if(order.payment_method!=="ONLINE")
      return res.status(400).json({error:"Invalid payment method"});

    if(order.payment_status==="PAID")
      return res.json({
        ok:true,
        orderId:order.id,
        payment_status:"PAID",
        payment_id:order.razorpay_payment_id,
        already_paid:true
      });

    db.prepare(`
      UPDATE orders
      SET payment_status='PAID',
          status='PLACED',
          razorpay_payment_id=?
      WHERE id=? AND user_id=? AND payment_method='ONLINE'
    `).run(paid.id,order.id,req.user.id);

    addCommission(
      order.id,
      order.shop_id,
      order.franchise_id,
      order.commission_amount,
      "PENDING",
      commissionForShop(db.prepare("SELECT * FROM shops WHERE id=?").get(order.shop_id))
    );

    const settlement = await settleRestaurantTransfer(order.id);

    res.json({
      ok:true,
      orderId:order.id,
      payment_status:"PAID",
      payment_id:paid.id,
      settlement
    });
  }catch(e){
    console.error("RAZORPAY CONFIRM ERROR:",e);
    res.status(500).json({error:e.message||"Payment confirmation failed"});
  }
});

app.get("/api/orders",auth,role("customer"),(req,res)=>res.json(db.prepare("SELECT o.*,s.name shop_name FROM orders o JOIN shops s ON s.id=o.shop_id WHERE o.user_id=? ORDER BY o.id DESC").all(req.user.id)));

app.get("/api/admin/stats",auth,role("admin"),(req,res)=>res.json({
 orders:db.prepare("SELECT COUNT(*) n FROM orders").get().n,
 revenue:db.prepare("SELECT COALESCE(SUM(total),0) n FROM orders WHERE payment_status='PAID'").get().n,
 pendingPayments:db.prepare("SELECT COALESCE(SUM(total),0) n FROM orders WHERE payment_status='PENDING'").get().n,
 restaurants:db.prepare("SELECT COUNT(*) n FROM shops WHERE type='restaurant'").get().n,
 kitchens:db.prepare("SELECT COUNT(*) n FROM shops WHERE type='home'").get().n,
 customers:db.prepare("SELECT COUNT(*) n FROM users WHERE role='customer'").get().n,
 delivery:db.prepare("SELECT COUNT(*) n FROM users WHERE role='delivery'").get().n
}));
app.get("/api/admin/orders",auth,role("admin"),(req,res)=>res.json(db.prepare("SELECT o.*,s.name shop_name,u.name customer FROM orders o JOIN shops s ON s.id=o.shop_id JOIN users u ON u.id=o.user_id ORDER BY o.id DESC").all()));
app.patch("/api/admin/orders/:id",auth,role("admin"),(req,res)=>{
  db.prepare("UPDATE orders SET status=? WHERE id=?").run(req.body.status,req.params.id);
  notifyOrderStatus(req.params.id,req.body.status);
  res.json({ok:true});
});
app.post("/api/admin/shops",auth,role("admin"),(req,res)=>{const {name,type,address,phone}=req.body||{};if(!name||!type)return res.status(400).json({error:"Name/type required"});const r=db.prepare("INSERT INTO shops(name,type,address,phone) VALUES(?,?,?,?)").run(name,type,address||"Makrana City",phone||"");res.json({id:r.lastInsertRowid})});

app.get("/api/partner/shop",auth,role("restaurant"),(req,res)=>{
 const s=db.prepare("SELECT * FROM shops WHERE owner_id=?").get(req.user.id); if(!s)return res.status(404).json({error:"Shop not found"});
 res.json({...s,menu:db.prepare("SELECT * FROM menu WHERE shop_id=?").all(s.id),orders:db.prepare("SELECT o.*,u.name customer FROM orders o JOIN users u ON u.id=o.user_id WHERE o.shop_id=? ORDER BY o.id DESC").all(s.id)})
});
app.post("/api/partner/menu",auth,role("restaurant"),(req,res)=>{
 const s=db.prepare("SELECT * FROM shops WHERE owner_id=?").get(req.user.id);if(!s)return res.status(404).json({error:"Shop not found"});
 const {name,price,category}=req.body||{};if(!name||!price)return res.status(400).json({error:"Name/price required"});
 const r=db.prepare("INSERT INTO menu(shop_id,name,price,category) VALUES(?,?,?,?)").run(s.id,name,price,category||"General");res.json({id:r.lastInsertRowid});
});
app.patch("/api/partner/menu/:id",auth,role("restaurant"),(req,res)=>{
  const shop=db.prepare("SELECT * FROM shops WHERE owner_id=?").get(req.user.id);
  if(!shop)
    return res.status(404).json({error:"Shop not found"});

  const item=db.prepare(
    "SELECT * FROM menu WHERE id=? AND shop_id=?"
  ).get(req.params.id,shop.id);

  if(!item)
    return res.status(404).json({error:"Menu item not found"});

  const {name,price,category,available}=req.body||{};

  if(name!==undefined && !String(name).trim())
    return res.status(400).json({error:"Menu name cannot be empty"});

  if(price!==undefined &&
     (!Number.isFinite(Number(price)) || Number(price)<=0))
    return res.status(400).json({error:"Invalid menu price"});

  if(available!==undefined && ![0,1,true,false].includes(available))
    return res.status(400).json({error:"Invalid availability value"});

  db.prepare(`
    UPDATE menu
    SET name=?,
        price=?,
        category=?,
        available=?
    WHERE id=? AND shop_id=?
  `).run(
    name===undefined ? item.name : String(name).trim(),
    price===undefined ? item.price : Number(price),
    category===undefined ? (item.category||"General") : String(category).trim(),
    available===undefined ? item.available : (available===true || Number(available)===1 ? 1 : 0),
    item.id,
    shop.id
  );

  res.json({ok:true});
});

app.delete("/api/partner/menu/:id",auth,role("restaurant"),(req,res)=>{
  const shop=db.prepare("SELECT * FROM shops WHERE owner_id=?").get(req.user.id);
  if(!shop)
    return res.status(404).json({error:"Shop not found"});

  const result=db.prepare(
    "DELETE FROM menu WHERE id=? AND shop_id=?"
  ).run(req.params.id,shop.id);

  if(!result.changes)
    return res.status(404).json({error:"Menu item not found"});

  res.json({ok:true});
});

app.patch("/api/partner/orders/:id",auth,role("restaurant"),(req,res)=>{
 const s=db.prepare("SELECT * FROM shops WHERE owner_id=?").get(req.user.id);

 if(!s)
   return res.status(404).json({error:"Shop not found"});

 const o=db.prepare(
   "SELECT * FROM orders WHERE id=? AND shop_id=?"
 ).get(req.params.id,s.id);

 if(!o)
   return res.status(404).json({error:"Order not found"});

 const status=String(req.body.status||"").trim();

 const allowed={
   PLACED:["PREPARING"],
   PREPARING:["READY"]
 };

 if(!allowed[o.status]?.includes(status))
   return res.status(400).json({
     error:"Invalid restaurant order transition"
   });

 db.prepare(
   "UPDATE orders SET status=? WHERE id=? AND shop_id=?"
 ).run(status,o.id,s.id);

 notifyOrderStatus(o.id,status);

 res.json({ok:true,status});
});

app.get("/api/delivery/earnings",auth,role("delivery"),(req,res)=>{
  const rows=db.prepare(`
    SELECT
      o.id,
      o.total,
      o.delivery_fee,
      o.status,
      o.payment_status,
      o.payment_method,
      o.created_at,
      pt.status AS transfer_status,
      pt.razorpay_transfer_id
    FROM orders o
    LEFT JOIN payment_transfers pt
      ON pt.order_id=o.id
     AND pt.beneficiary_user_id=?
    WHERE o.delivery_id=?
      AND o.status='DELIVERED'
    ORDER BY o.id DESC
  `).all(req.user.id,req.user.id);

  const total=rows.reduce(
    (sum,x)=>sum+Number(x.delivery_fee||0),0
  );

  const paidOnline=rows
    .filter(x=>x.payment_method==="ONLINE" && x.transfer_status==="PROCESSED")
    .reduce((sum,x)=>sum+Number(x.delivery_fee||0),0);

  const pendingOnline=rows
    .filter(x=>x.payment_method==="ONLINE" && x.transfer_status!=="PROCESSED")
    .reduce((sum,x)=>sum+Number(x.delivery_fee||0),0);

  const codCash=rows
    .filter(x=>x.payment_method==="COD")
    .reduce((sum,x)=>sum+Number(x.delivery_fee||0),0);

  const payout=db.prepare(`
    SELECT status,razorpay_account_id
    FROM payout_accounts
    WHERE user_id=?
  `).get(req.user.id)||null;

  res.json({
    total_earnings:total,
    paid_online:paidOnline,
    pending_online:pendingOnline,
    cod_cash_earnings:codCash,
    completed_deliveries:rows.length,
    payout_status:payout?.status||"NOT_ADDED",
    razorpay_linked:!!payout?.razorpay_account_id,
    orders:rows
  });
});

// ===== V61 ACCOUNT / PAYOUT API =====
app.get("/api/account/profile",auth,(req,res)=>{
  const u=db.prepare("SELECT id,name,phone,role FROM users WHERE id=?").get(req.user.id);
  if(!u) return res.status(404).json({error:"Account not found"});
  const p=db.prepare("SELECT * FROM account_profiles WHERE user_id=?").get(req.user.id)||{};
  res.json({...u,...p});
});

app.patch("/api/account/profile",auth,(req,res)=>{
  const {name,phone,email,address,city,state,pincode,avatar_url}=req.body||{};
  try {
    if(name!==undefined || phone!==undefined) {
      db.prepare("UPDATE users SET name=COALESCE(?,name), phone=COALESCE(?,phone) WHERE id=?")
        .run(name===undefined?null:String(name).trim(),phone===undefined?null:String(phone).trim(),req.user.id);
    }
    const exists=db.prepare("SELECT id FROM account_profiles WHERE user_id=?").get(req.user.id);
    if(exists) db.prepare(`UPDATE account_profiles SET email=COALESCE(?,email),address=COALESCE(?,address),city=COALESCE(?,city),state=COALESCE(?,state),pincode=COALESCE(?,pincode),avatar_url=COALESCE(?,avatar_url),updated_at=CURRENT_TIMESTAMP WHERE user_id=?`).run(email??null,address??null,city??null,state??null,pincode??null,avatar_url??null,req.user.id);
    else db.prepare(`INSERT INTO account_profiles(user_id,email,address,city,state,pincode,avatar_url) VALUES(?,?,?,?,?,?,?)`).run(req.user.id,email??null,address??null,city??null,state??null,pincode??null,avatar_url??null);
    res.json({ok:true});
  } catch(e) { res.status(400).json({error:e.message||"Unable to update profile"}); }
});

app.get("/api/account/payout",auth,(req,res)=>{
  const p=db.prepare("SELECT id,user_id,account_holder,bank_name,account_number,ifsc,upi_id,razorpay_account_id,status,updated_at FROM payout_accounts WHERE user_id=?").get(req.user.id);
  res.json(p||null);
});

app.put("/api/account/payout",auth,(req,res)=>{
  const {account_holder,bank_name,account_number,ifsc,upi_id,razorpay_account_id}=req.body||{};
  if(!account_holder || (!account_number && !upi_id)) return res.status(400).json({error:"Account holder and bank account or UPI are required"});
  try {
    const exists=db.prepare("SELECT id FROM payout_accounts WHERE user_id=?").get(req.user.id);
    if(exists) db.prepare(`UPDATE payout_accounts SET account_holder=?,bank_name=?,account_number=?,ifsc=?,upi_id=?,razorpay_account_id=?,status='PENDING',updated_at=CURRENT_TIMESTAMP WHERE user_id=?`).run(account_holder,bank_name||null,account_number||null,ifsc||null,upi_id||null,razorpay_account_id||null,req.user.id);
    else db.prepare(`INSERT INTO payout_accounts(user_id,account_holder,bank_name,account_number,ifsc,upi_id,razorpay_account_id,status) VALUES(?,?,?,?,?,?,?,'PENDING')`).run(req.user.id,account_holder,bank_name||null,account_number||null,ifsc||null,upi_id||null,razorpay_account_id||null);
    res.json({ok:true,message:"Payout account saved. Verification is required before live settlement."});
  } catch(e) { res.status(400).json({error:e.message||"Unable to save payout account"}); }
});

app.get("/api/account/summary",auth,(req,res)=>{
  const u=db.prepare("SELECT id,name,phone,role FROM users WHERE id=?").get(req.user.id);
  const payout=db.prepare("SELECT account_holder,bank_name,account_number,ifsc,upi_id,razorpay_account_id,status FROM payout_accounts WHERE user_id=?").get(req.user.id)||null;
  let shop=null;
  if(["restaurant","admin"].includes(req.user.role)) shop=db.prepare("SELECT * FROM shops WHERE owner_id=? ORDER BY id DESC LIMIT 1").get(req.user.id)||null;
  const commission=req.user.role==="admin" ? db.prepare("SELECT COALESCE(SUM(amount),0) total,COUNT(*) records FROM commissions WHERE status IN ('PENDING','APPROVED','PAID')").get() : null;
  let deliverySettlement=null;

if(u?.role==="delivery"){
  deliverySettlement=db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN status='PROCESSED' THEN payable_amount ELSE 0 END),0) AS paid,
      COALESCE(SUM(CASE WHEN status IN ('PENDING','FAILED') THEN payable_amount ELSE 0 END),0) AS pending,
      COUNT(*) AS records
    FROM settlement_records
    WHERE user_id=?
  `).get(req.user.id);
}

res.json({
  user:u,
  payout,
  shop,
  commission,
  deliverySettlement
});
});

app.get("/api/notifications",auth,(req,res)=>{
  res.json(db.prepare(
    "SELECT * FROM notifications WHERE user_id=? ORDER BY id DESC LIMIT 30"
  ).all(req.user.id));
});

app.patch("/api/notifications/:id/read",auth,(req,res)=>{
  db.prepare("UPDATE notifications SET read=1 WHERE id=? AND user_id=?")
    .run(req.params.id,req.user.id);
  res.json({ok:true});
});

app.get("/api/delivery/orders",auth,role("delivery"),(req,res)=>res.json(db.prepare(`SELECT o.*,s.name shop_name,s.address shop_address,u.name customer FROM orders o JOIN shops s ON s.id=o.shop_id JOIN users u ON u.id=o.user_id WHERE (o.status='READY' AND (o.delivery_id IS NULL OR o.delivery_id=?)) OR o.delivery_id=? ORDER BY o.id DESC`).all(req.user.id,req.user.id)));

app.post("/api/admin/delivery-settlements/:orderId/retry",auth,role("admin"),async(req,res)=>{
  try{
    const result=await settleDeliveryTransfer(Number(req.params.orderId));
    res.json(result);
  }catch(e){
    res.status(500).json({
      error:e.message||"Delivery settlement retry failed"
    });
  }
});

app.patch("/api/delivery/orders/:id/cod-collected",auth,role("delivery"),(req,res)=>{
  const o=db.prepare("SELECT * FROM orders WHERE id=?").get(req.params.id);

  if(!o)
    return res.status(404).json({error:"Order not found"});

  if(o.delivery_id!==req.user.id)
    return res.status(403).json({error:"Order not assigned to this delivery agent"});

  if(o.payment_method!=="COD")
    return res.status(400).json({error:"This order is not COD"});

  if(o.status!=="DELIVERED")
    return res.status(400).json({error:"Order must be DELIVERED before cash collection"});

  if(o.payment_status==="PAID")
    return res.json({ok:true,orderId:o.id,payment_status:"PAID",already_paid:true});

  db.prepare(`
    UPDATE orders
    SET payment_status='PAID'
    WHERE id=? AND delivery_id=? AND payment_method='COD' AND status='DELIVERED'
  `).run(o.id,req.user.id);

  addCommission(
    o.id,
    o.shop_id,
    o.franchise_id,
    o.commission_amount,
    "PENDING"
  );

  db.prepare(
    "INSERT INTO notifications(user_id,order_id,message) VALUES(?,?,?)"
  ).run(o.user_id,o.id,"Cash payment received successfully");

  res.json({
    ok:true,
    orderId:o.id,
    payment_status:"PAID"
  });
});

app.patch("/api/delivery/orders/:id",auth,role("delivery"),async(req,res)=>{
 const o=db.prepare("SELECT * FROM orders WHERE id=?").get(req.params.id);

 if(!o)
   return res.status(404).json({error:"Order not found"});

 if(o.delivery_id&&o.delivery_id!==req.user.id)
   return res.status(403).json({error:"Delivery already assigned"});

 const status=String(req.body.status||"").trim();

 const allowed={
   READY:["ON_THE_WAY"],
   ON_THE_WAY:["DELIVERED"]
 };

 if(!allowed[o.status]?.includes(status))
   return res.status(400).json({
     error:"Invalid delivery order transition"
   });

 db.prepare(
   "UPDATE orders SET status=?,delivery_id=? WHERE id=?"
 ).run(status,req.user.id,o.id);

 notifyOrderStatus(o.id,status);

 let deliverySettlement=null;

 if(status==="DELIVERED"){
   deliverySettlement=await settleDeliveryTransfer(o.id);
 }

 res.json({
   ok:true,
   status,
   deliverySettlement
 });
});

registerOwnerApi(app,db,auth,role,bcrypt);
app.get("/owner",(req,res)=>res.sendFile(path.join(__dirname,"public","owner.html")));
app.get("/{*splat}",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.listen(process.env.PORT||3000,"0.0.0.0",()=>console.log("HOME BITE running"));
