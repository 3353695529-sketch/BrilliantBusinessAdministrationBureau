const express = require("express");
const session = require("express-session");
const passport = require("passport");
const SteamStrategy = require("passport-steam").Strategy;
const cors = require("cors");

const app = express();

// 允许跨域（前端 GitHub Pages 必须）
app.use(cors({
    origin: "*",
    credentials: true
}));

// Session（Steam 登录必须）
app.use(session({
    secret: "rp-business-secret",
    resave: false,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

// 序列化用户
passport.serializeUser((user, done) => {
    done(null, user);
});
passport.deserializeUser((obj, done) => {
    done(null, obj);
});

// 你的 Railway 域名
const DOMAIN = "https://brilliantbusinessadministrationbureau-production.up.railway.app";

// Steam 登录配置
passport.use(new SteamStrategy({
    returnURL: `${DOMAIN}/auth/steam/return`,
    realm: DOMAIN,
    apiKey: "8445C9B95434D43270CEB6A5450C277F"
}, (identifier, profile, done) => {
    return done(null, profile);
}));

// Steam 登录入口
app.get("/auth/steam",
    passport.authenticate("steam", { failureRedirect: "/" }),
    (req, res) => {}
);

// Steam 登录回调
app.get("/auth/steam/return",
    passport.authenticate("steam", { failureRedirect: "/" }),
    (req, res) => {
        res.redirect(`${DOMAIN}/success`);
    }
);

// 登录成功页面
app.get("/success", (req, res) => {
    if (!req.user) return res.send("未登录");
    res.send(`
        <h1>登录成功</h1>
        <p>欢迎, ${req.user.displayName}</p>
        <p>SteamID: ${req.user.id}</p>
    `);
});

// 测试 API
app.get("/", (req, res) => {
    res.send("RP API Running with Steam Login");
});

// Railway 必须监听 0.0.0.0，否则会 502
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
    console.log("Server running on port " + PORT);
});
