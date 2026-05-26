// ===============================
// 基础模块
// ===============================
const express = require("express");
const path = require("path");
const multer = require("multer");
const session = require("express-session");
const passport = require("passport");
const SteamStrategy = require("passport-steam").Strategy;
const db = require("./database");

const app = express();
const PORT = process.env.PORT || 3000;

// ===============================
// 中间件
// ===============================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session（Steam 登录必须）
app.use(session({
    secret: "rp-system-secret",
    resave: false,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

// 静态文件目录（必须指向 public）
app.use(express.static(path.join(__dirname, "public")));

// ===============================
// Multer 上传配置
// ===============================
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + ext);
    }
});
const upload = multer({ storage });

// ===============================
// Steam 登录配置
// ===============================
passport.use(new SteamStrategy(
    {
        returnURL: "https://brilliantbusinessadministrationbureau-production.up.railway.app/auth/steam/return",
        realm: "https://brilliantbusinessadministrationbureau-production.up.railway.app/",
        apiKey: "你的SteamAPIKey"
    },
    function (identifier, profile, done) {
        return done(null, profile);
    }
));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// ===============================
// Steam 登录路由
// ===============================
app.get("/auth/steam",
    passport.authenticate("steam", { failureRedirect: "/" })
);

app.get("/auth/steam/return",
    passport.authenticate("steam", { failureRedirect: "/" }),
    (req, res) => {
        res.redirect("/"); // 登录成功后回主页
    }
);

// 退出登录
app.get("/logout", (req, res) => {
    req.logout(() => {
        res.redirect("/");
    });
});

// ===============================
// 获取当前登录用户信息（前端显示头像昵称）
// ===============================
app.get("/api/user", (req, res) => {
    if (!req.user) return res.json({ loggedIn: false });

    res.json({
        loggedIn: true,
        name: req.user.displayName,
        avatar: req.user.photos[2].value
    });
});

// ===============================
// 注册公司 API
// ===============================
app.post("/api/registerCompany", upload.single("logo"), (req, res) => {
    const { name, description } = req.body;
    const logo = req.file ? req.file.filename : null;

    db.run(
        "INSERT INTO companies (name, description, logo) VALUES (?, ?, ?)",
        [name, description, logo],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: this.lastID });
        }
    );
});

// ===============================
// 注册商铺 API
// ===============================
app.post("/api/registerShop", upload.single("logo"), (req, res) => {
    const { name, description } = req.body;
    const logo = req.file ? req.file.filename : null;

    db.run(
        "INSERT INTO shops (name, description, logo) VALUES (?, ?, ?)",
        [name, description, logo],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: this.lastID });
        }
    );
});

// ===============================
// 获取公司列表
// ===============================
app.get("/api/companies", (req, res) => {
    db.all("SELECT * FROM companies", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// ===============================
// 获取商铺列表
// ===============================
app.get("/api/shops", (req, res) => {
    db.all("SELECT * FROM shops", (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// ===============================
// 启动服务器
// ===============================
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
