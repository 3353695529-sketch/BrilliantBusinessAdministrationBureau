const express = require("express");
const session = require("express-session");
const passport = require("passport");
const SteamStrategy = require("passport-steam").Strategy;
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const db = require("./database");

const app = express();

// 管理员密码（自己改）
const ADMIN_PASSWORD = "20090325";
let adminLoggedIn = false;

// 允许跨域
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件目录
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static("uploads"));

// Multer 上传配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Session
app.use(
  session({
    secret: "supersecretkey",
    resave: false,
    saveUninitialized: false
  })
);

// Passport 初始化
app.use(passport.initialize());
app.use(passport.session());

// Steam 登录配置
passport.use(
  new SteamStrategy(
    {
      returnURL:
        "https://brilliantbusinessadministrationbureau-production.up.railway.app/auth/steam/return",
      realm:
        "https://brilliantbusinessadministrationbureau-production.up.railway.app/",
      apiKey: "8445C9B95434D43270CEB6A5450C277F"
    },
    (identifier, profile, done) => {
      return done(null, profile);
    }
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Steam 登录路由
app.get("/auth/steam", passport.authenticate("steam"));
app.get(
  "/auth/steam/return",
  passport.authenticate("steam", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("/");
  }
);

// 退出登录
app.get("/logout", (req, res) => {
  req.logout(() => {
    req.session.destroy(() => {
      res.redirect("/");
    });
  });
});

// 管理员登录
app.post("/api/admin/login", (req, res) => {
  const { password } = req.body;

  if (password === ADMIN_PASSWORD) {
    adminLoggedIn = true;
    return res.json({ success: true, message: "管理员登录成功" });
  }

  res.json({ success: false, message: "密码错误" });
});

// 管理员登出
app.post("/api/admin/logout", (req, res) => {
  adminLoggedIn = false;
  res.json({ success: true });
});

// 注册公司（限制一个）
app.post("/api/registerCompany", upload.single("logo"), (req, res) => {
  if (!req.user)
    return res.status(401).json({ error: "请先登录 Steam" });

  const owner = req.user.id;

  db.get("SELECT id FROM companies WHERE owner = ?", [owner], (err, row) => {
    if (row) {
      return res.json({
        success: false,
        message: "您已经注册过公司，如需重新注册请先删除原公司"
      });
    }

    const { name, description } = req.body;
    const logo = req.file ? req.file.filename : null;

    db.run(
      "INSERT INTO companies (name, description, logo, owner) VALUES (?, ?, ?, ?)",
      [name, description, logo, owner],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID });
      }
    );
  });
});

// 注册商铺（限制一个）
app.post("/api/registerShop", upload.single("logo"), (req, res) => {
  if (!req.user)
    return res.status(401).json({ error: "请先登录 Steam" });

  const owner = req.user.id;

  db.get("SELECT id FROM shops WHERE owner = ?", [owner], (err, row) => {
    if (row) {
      return res.json({
        success: false,
        message: "您已经注册过商铺，如需重新注册请先删除原商铺"
      });
    }

    const { name, description } = req.body;
    const logo = req.file ? req.file.filename : null;

    db.run(
      "INSERT INTO shops (name, description, logo, owner) VALUES (?, ?, ?, ?)",
      [name, description, logo, owner],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID });
      }
    );
  });
});

// 获取所有公司
app.get("/api/companies", (req, res) => {
  db.all("SELECT * FROM companies", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 获取所有商铺
app.get("/api/shops", (req, res) => {
  db.all("SELECT * FROM shops", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 获取当前玩家的公司/商铺
app.get("/api/my", (req, res) => {
  if (!req.user) return res.json({ loggedIn: false });

  const steamId = req.user.id;

  db.all(
    "SELECT * FROM companies WHERE owner = ?",
    [steamId],
    (err, companies) => {
      if (err) return res.status(500).json({ error: err.message });

      db.all(
        "SELECT * FROM shops WHERE owner = ?",
        [steamId],
        (err2, shops) => {
          if (err2) return res.status(500).json({ error: err2.message });

          res.json({
            loggedIn: true,
            user: {
              name: req.user.displayName,
              avatar: req.user.photos[2].value
            },
            companies,
            shops
          });
        }
      );
    }
  );
});

// 删除公司（玩家删自己 + 管理员删任何）
app.delete("/api/deleteCompany/:id", (req, res) => {
  if (!req.user && !adminLoggedIn)
    return res.status(401).json({ error: "请先登录 Steam 或管理员" });

  const id = req.params.id;

  if (adminLoggedIn) {
    db.run("DELETE FROM companies WHERE id = ?", [id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      return res.json({ success: true, message: "管理员已删除公司" });
    });
    return;
  }

  const owner = req.user.id;

  db.run(
    "DELETE FROM companies WHERE id = ? AND owner = ?",
    [id, owner],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      if (this.changes === 0) {
        return res.json({
          success: false,
          message: "删除失败，您不是该公司的拥有者"
        });
      }

      res.json({ success: true, message: "公司已删除" });
    }
  );
});

// 删除商铺（玩家删自己 + 管理员删任何）
app.delete("/api/deleteShop/:id", (req, res) => {
  if (!req.user && !adminLoggedIn)
    return res.status(401).json({ error: "请先登录 Steam 或管理员" });

  const id = req.params.id;

  if (adminLoggedIn) {
    db.run("DELETE FROM shops WHERE id = ?", [id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      return res.json({ success: true, message: "管理员已删除商铺" });
    });
    return;
  }

  const owner = req.user.id;

  db.run(
    "DELETE FROM shops WHERE id = ? AND owner = ?",
    [id, owner],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });

      if (this.changes === 0) {
        return res.json({
          success: false,
          message: "删除失败，您不是该商铺的拥有者"
        });
      }

      res.json({ success: true, message: "商铺已删除" });
    }
  );
});

// HTML 路由
const htmlPages = [
  "index.html",
  "companies.html",
  "shops.html",
  "register_company.html",
  "register_shop.html",
  "company.html",
  "shop.html",
  "me.html",
  "admin.html"
];

htmlPages.forEach((page) => {
  app.get("/" + page, (req, res) => {
    res.sendFile(path.join(__dirname, "public", page));
  });
});

// fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Railway 端口
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
