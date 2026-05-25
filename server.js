const express = require("express");
const session = require("express-session");
const passport = require("passport");
const SteamStrategy = require("passport-steam").Strategy;
const cors = require("cors");

const app = express();

app.use(cors({
    origin: "*",
    credentials: true
}));

app.use(session({
    secret: "rp-business-secret",
    resave: false,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
    done(null, user);
});
passport.deserializeUser((obj, done) => {
    done(null, obj);
});

const DOMAIN = "https://brilliantbusinessadministrationbureau-production.up.railway.app";

passport.use(new SteamStrategy({
    returnURL: `${DOMAIN}/auth/steam/return`,
    realm: DOMAIN,
    apiKey: "8445C9B95434D43270CEB6A5450C277F"
}, (identifier, profile, done) => {
    return done(null, profile);
}));

app.get("/auth/steam",
    passport.authenticate("steam", { failureRedirect: "/" }),
    (req, res) => {}
);

app.get("/auth/steam/return",
    passport.authenticate("steam", { failureRedirect: "/" }),
    (req, res) => {
        res.redirect(`${DOMAIN}/success`);
    }
);

app.get("/success", (req, res) => {
    if (!req.user) return res.send("未登录");
    res.send(`
        <h1>登录成功</h1>
        <p>欢迎, ${req.user.displayName}</p>
        <p>SteamID: ${req.user.id}</p>
    `);
});


app.get("/", (req, res) => {
    res.send("RP API Running with Steam Login");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});
