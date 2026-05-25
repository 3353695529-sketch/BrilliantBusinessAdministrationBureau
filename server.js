const express = require("express");
const session = require("express-session");
const passport = require("passport");
const SteamStrategy = require("passport-steam").Strategy;
const path = require("path");
const app = express();

const PORT = process.env.PORT || 3000;

// 你的 Railway 域名
const DOMAIN = "https://brilliantbusinessadministrationbureau-production.up.railway.app";

// Steam 登录配置
passport.use(new SteamStrategy(
    {
        returnURL: `${DOMAIN}/auth/steam/return`,
        realm: DOMAIN,
        apiKey: "8445C9B95434D43270CEB6A5450C277F"
    },
    function(identifier, profile, done) {
        return done(null, profile);
    }
));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

app.use(session({
    secret: "rp-system-secret",
    resave: false,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

// 静态文件（你的 index.html）
app.use(express.static(path.join(__dirname)));

// Steam 登录入口
app.get("/auth/steam",
    passport.authenticate("steam", { failureRedirect: "/" }),
    (req, res) => {}
);

// Steam 回调
app.get("/auth/steam/return",
    passport.authenticate("steam", { failureRedirect: "/" }),
    (req, res) => {
        res.redirect("/home");
    }
);

// 登录成功后的页面
app.get("/home", (req, res) => {
    if (!req.user) return res.redirect("/");
    res.send(`
        <h1>登录成功！</h1>
        <p>欢迎你，${req.user.displayName}</p>
        <img src="${req.user.photos[2].value}">
        <br><br>
        <a href="/logout">退出登录</a>
    `);
});

// 退出登录
app.get("/logout", (req, res) => {
    req.logout(() => {
        res.redirect("/");
    });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log("Server running on port " + PORT);
});
