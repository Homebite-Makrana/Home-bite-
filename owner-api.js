export function registerOwnerApi(app, db, auth, role, bcrypt) {

  app.get("/api/owner/dashboard", auth, role("admin"), (req, res) => {
    res.json({
      franchises: db.prepare("SELECT COUNT(*) n FROM franchises WHERE active=1").get().n,
      restaurants: db.prepare("SELECT COUNT(*) n FROM shops WHERE type='restaurant' AND active=1").get().n,
      kitchens: db.prepare("SELECT COUNT(*) n FROM shops WHERE type='home' AND active=1").get().n,
      delivery: db.prepare("SELECT COUNT(*) n FROM users WHERE role='delivery'").get().n,
      customers: db.prepare("SELECT COUNT(*) n FROM users WHERE role='customer'").get().n,
      orders: db.prepare("SELECT COUNT(*) n FROM orders").get().n,
      revenue: db.prepare("SELECT COALESCE(SUM(total),0) n FROM orders").get().n
    });
  });

  app.get("/api/owner/franchises", auth, role("admin"), (req, res) => {
    res.json(db.prepare(`
      SELECT f.*,
        (SELECT COUNT(*) FROM shops s WHERE s.franchise_id=f.id AND s.active=1) shops,
        (SELECT COUNT(*) FROM users u WHERE u.franchise_id=f.id AND u.role='delivery') delivery
      FROM franchises f
      ORDER BY f.id DESC
    `).all());
  });

  app.post("/api/owner/franchises", auth, role("admin"), (req, res) => {
    const {name,code,city,state,address,phone,commission_percent}=req.body||{};
    if(!name||!code) return res.status(400).json({error:"Franchise name and code required"});

    try {
      const r=db.prepare(`
        INSERT INTO franchises
        (name,code,city,state,address,phone,commission_percent)
        VALUES(?,?,?,?,?,?,?)
      `).run(
        name,
        code.toUpperCase(),
        city||"",
        state||"",
        address||"",
        phone||"",
        Number(commission_percent ?? 10)
      );
      res.json({ok:true,id:r.lastInsertRowid});
    } catch(e) {
      res.status(400).json({error:"Franchise code already exists"});
    }
  });

  app.patch("/api/owner/franchises/:id", auth, role("admin"), (req,res) => {
    db.prepare("UPDATE franchises SET active=? WHERE id=?")
      .run(req.body.active?1:0,req.params.id);
    res.json({ok:true});
  });

  app.get("/api/owner/areas", auth, role("admin"), (req,res) => {
    res.json(db.prepare(`
      SELECT a.*,f.name franchise_name
      FROM areas a
      JOIN franchises f ON f.id=a.franchise_id
      ORDER BY a.id DESC
    `).all());
  });

  app.post("/api/owner/areas", auth, role("admin"), (req,res) => {
    const {franchise_id,name}=req.body||{};
    if(!franchise_id||!name)
      return res.status(400).json({error:"Franchise and area name required"});

    const r=db.prepare(
      "INSERT INTO areas(franchise_id,name) VALUES(?,?)"
    ).run(franchise_id,name);

    res.json({ok:true,id:r.lastInsertRowid});
  });

  app.get("/api/owner/users", auth, role("admin"), (req,res) => {
    res.json(db.prepare(`
      SELECT id,name,phone,role,franchise_id,area_id
      FROM users
      ORDER BY id DESC
    `).all());
  });

  app.post("/api/owner/delivery", auth, role("admin"), (req,res) => {
    const {name,phone,password,franchise_id,area_id}=req.body||{};

    if(!name||!phone||!password)
      return res.status(400).json({error:"Name, phone and password required"});

    try {
      const r=db.prepare(`
        INSERT INTO users
        (name,phone,password,role,franchise_id,area_id)
        VALUES(?,?,?,?,?,?)
      `).run(
        name,
        phone,
        bcrypt.hashSync(password,10),
        "delivery",
        franchise_id||null,
        area_id||null
      );

      res.json({ok:true,id:r.lastInsertRowid});
    } catch(e) {
      res.status(400).json({error:"Phone already registered"});
    }
  });

  app.get("/api/owner/shops", auth, role("admin"), (req,res) => {
    res.json(db.prepare(`
      SELECT s.*,u.name owner_name,
        f.name franchise_name,
        a.name area_name
      FROM shops s
      LEFT JOIN users u ON u.id=s.owner_id
      LEFT JOIN franchises f ON f.id=s.franchise_id
      LEFT JOIN areas a ON a.id=s.area_id
      ORDER BY s.id DESC
    `).all());
  });

  app.post("/api/owner/restaurants", auth, role("admin"), (req,res) => {
    const {
      name, owner_name, owner_phone, password,
      address, franchise_id, area_id, commission_percent, latitude, longitude
    } = req.body || {};

    if(!name || !owner_name || !owner_phone || !password)
      return res.status(400).json({error:"Restaurant name, owner name, phone and password required"});

    if(password.length < 6)
      return res.status(400).json({error:"Password must be at least 6 characters"});

    try {
      const existing=db.prepare("SELECT id FROM users WHERE phone=?").get(String(owner_phone).trim());
      if(existing)
        return res.status(400).json({error:"Owner phone already registered"});

      const franchise=franchise_id
        ? db.prepare("SELECT * FROM franchises WHERE id=? AND active=1").get(franchise_id)
        : null;

      if(franchise_id && !franchise)
        return res.status(400).json({error:"Invalid franchise"});

      if(area_id) {
        const area=db.prepare("SELECT id FROM areas WHERE id=? AND franchise_id=? AND active=1")
          .get(area_id, franchise_id);
        if(!area) return res.status(400).json({error:"Invalid area"});
      }

      const commission=Number(
        commission_percent ?? franchise?.commission_percent ?? 10
      );

      if(!Number.isFinite(commission) || commission < 0 || commission > 100)
        return res.status(400).json({error:"Commission must be between 0 and 100"});

      const u=db.prepare(`
        INSERT INTO users(name,phone,password,role,franchise_id,area_id)
        VALUES(?,?,?,?,?,?)
      `).run(
        String(owner_name).trim(),
        String(owner_phone).trim(),
        bcrypt.hashSync(password,10),
        "restaurant",
        franchise_id||null,
        area_id||null
      );

      const shop=db.prepare(`
        INSERT INTO shops
        (name,type,address,phone,owner_id,franchise_id,area_id,latitude,longitude)
        VALUES(?,?,?,?,?,?,?,?,?)
      `).run(
        String(name).trim(),
        "restaurant",
        String(address||"").trim(),
        String(owner_phone).trim(),
        u.lastInsertRowid,
        franchise_id||null,
        area_id||null,
        Number(latitude)||null,
        Number(longitude)||null
      );

      const result={
        user_id:u.lastInsertRowid,
        shop_id:shop.lastInsertRowid,
        commission_percent:commission
      };
      res.json({ok:true,...result});

    } catch(e) {
      console.error("RESTAURANT ONBOARD ERROR:",e);
      res.status(400).json({error:e.message||"Restaurant creation failed"});
    }
  });

  app.patch("/api/owner/shops/:id", auth, role("admin"), (req,res) => {
    const {franchise_id,area_id,active}=req.body||{};

    db.prepare(`
      UPDATE shops
      SET franchise_id=?,
          area_id=?,
          active=COALESCE(?,active)
      WHERE id=?
    `).run(
      franchise_id??null,
      area_id??null,
      active===undefined?null:(active?1:0),
      req.params.id
    );

    res.json({ok:true});
  });

  app.get("/api/owner/orders", auth, role("admin"), (req,res) => {
    res.json(db.prepare(`
      SELECT o.*,s.name shop_name,u.name customer,
        f.name franchise_name,d.name delivery_name
      FROM orders o
      JOIN shops s ON s.id=o.shop_id
      JOIN users u ON u.id=o.user_id
      LEFT JOIN franchises f ON f.id=o.franchise_id
      LEFT JOIN users d ON d.id=o.delivery_id
      ORDER BY o.id DESC
    `).all());
  });

  app.get("/api/owner/commissions", auth, role("admin"), (req,res) => {
    res.json(db.prepare(`
      SELECT c.*,o.total order_total,
        f.name franchise_name,s.name shop_name
      FROM commissions c
      JOIN orders o ON o.id=c.order_id
      LEFT JOIN franchises f ON f.id=c.franchise_id
      LEFT JOIN shops s ON s.id=c.shop_id
      ORDER BY c.id DESC
    `).all());
  });


  // V61 owner payout / commission management
  app.get("/api/owner/payout-accounts", auth, role("admin"), (req,res) => {
    res.json(db.prepare(`SELECT p.*,u.name user_name,u.phone,u.role,s.name shop_name FROM payout_accounts p JOIN users u ON u.id=p.user_id LEFT JOIN shops s ON s.owner_id=p.user_id ORDER BY p.id DESC`).all());
  });
  app.patch("/api/owner/payout-accounts/:userId/status", auth, role("admin"), (req,res) => {
    const status=String(req.body?.status||"").toUpperCase();
    if(!["PENDING","VERIFIED","SUSPENDED"].includes(status)) return res.status(400).json({error:"Invalid payout status"});
    db.prepare("UPDATE payout_accounts SET status=?,updated_at=CURRENT_TIMESTAMP WHERE user_id=?").run(status,req.params.userId);
    res.json({ok:true});
  });
  app.get("/api/owner/commission-summary", auth, role("admin"), (req,res) => {
    const rows=db.prepare(`SELECT c.id,c.order_id,c.shop_id,c.amount,c.percent,c.status,s.name shop_name,u.name owner_name,p.status payout_status FROM commissions c LEFT JOIN shops s ON s.id=c.shop_id LEFT JOIN users u ON u.id=s.owner_id LEFT JOIN payout_accounts p ON p.user_id=u.id ORDER BY c.id DESC`).all();
    const total=rows.reduce((n,x)=>n+Number(x.amount||0),0);
    res.json({total,records:rows});
  });

  // Admin reset for restaurant/delivery account password
  app.patch("/api/owner/users/:id/password", auth, role("admin"), (req,res) => {
    try {
      const userId = Number(req.params.id);
      const {new_password} = req.body || {};

      if (!Number.isInteger(userId) || userId <= 0)
        return res.status(400).json({error:"Invalid user ID"});

      if (!new_password || typeof new_password !== "string")
        return res.status(400).json({error:"New password is required"});

      if (new_password.length < 6)
        return res.status(400).json({error:"New password must be at least 6 characters"});

      const user = db.prepare(
        "SELECT id,name,role FROM users WHERE id=?"
      ).get(userId);

      if (!user)
        return res.status(404).json({error:"Account not found"});

      if (!["restaurant","delivery"].includes(user.role))
        return res.status(403).json({error:"Password reset is allowed only for restaurant or delivery accounts"});

      db.prepare("UPDATE users SET password=? WHERE id=?")
        .run(bcrypt.hashSync(new_password,10), user.id);

      res.json({
        ok:true,
        message:"Account password reset successfully"
      });
    } catch(e) {
      console.error("ACCOUNT PASSWORD RESET ERROR:", e.message);
      res.status(500).json({error:"Unable to reset account password"});
    }
  });

  // Change owner phone
  app.patch("/api/owner/phone", auth, role("admin"), (req,res) => {
    const {current_password,new_phone} = req.body || {};
    if (!current_password || !new_phone) return res.status(400).json({error:"Current password and new phone required"});
    const user = db.prepare("SELECT * FROM users WHERE id=?").get(req.user.id);
    if (!user || !bcrypt.compareSync(current_password,user.password)) return res.status(400).json({error:"Current password is incorrect"});
    try {
      db.prepare("UPDATE users SET phone=? WHERE id=?").run(String(new_phone).trim(),req.user.id);
      res.json({ok:true,message:"Phone number changed successfully"});
    } catch(e) {
      res.status(400).json({error:"Phone number already registered"});
    }
  });
  // Change owner password
  app.patch("/api/owner/password", auth, role("admin"), (req,res) => {
    const {current_password,new_password} = req.body || {};

    if (!current_password || !new_password) {
      return res.status(400).json({error:"Current and new password required"});
    }

    if (new_password.length < 6) {
      return res.status(400).json({error:"New password must be at least 6 characters"});
    }

    const user = db.prepare("SELECT * FROM users WHERE id=?").get(req.user.id);

    if (!user || !bcrypt.compareSync(current_password,user.password)) {
      return res.status(400).json({error:"Current password is incorrect"});
    }

    db.prepare("UPDATE users SET password=? WHERE id=?")
      .run(bcrypt.hashSync(new_password,10),req.user.id);

    res.json({ok:true,message:"Password changed successfully"});
  });

}
