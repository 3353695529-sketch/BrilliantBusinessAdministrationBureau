const express = require("express");
const session = require("express-session");
const passport = require("passport");
const SteamStrategy = require("passport-steam").Strategy;
const cors = require("cors");

const app = express();

app.use(cors());

app.use(session({
    secret: "rp",
    resave:false,
    saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done)=>{
    done(null,user);
});

passport.deserializeUser((obj, done)=>{
    done(null,obj);
});

passport.use(new SteamStrategy({
        returnURL:"https://你的后端地址/auth/steam/return",
        realm:"https://你的前端地址.github.io",
        apiKey:"你的SteamAPIKey"
    },
    function(identifier, profile, done){
        return done(null, profile);
    }
));

app.get("/auth/steam",
    passport.authenticate("steam"));

app.get("/auth/steam/return",
passport.authenticate("steam", {
    failureRedirect:"/"
}),
(req,res)=>{

    res.redirect(
    "https://你的前端地址.github.io"
    );

});

app.listen(3000);
