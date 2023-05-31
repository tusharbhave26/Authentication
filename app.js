//jshint esversion:6
require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport")
const passportlocalmongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')


const app = express()

app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended:true}))
app.set('view engine', 'ejs');

app.use(session({
    secret: "Our little secrets.",
    resave: false,
    saveUninitialized: false
}))

passport.serializeUser(function(user,done){
    done(null, user.id);
});

passport.deserializeUser(async function (id, done) {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1:27017/userDB",
{useUnifiedTopology: true,
useNewUrlParser: true});

const userSchema = new mongoose.Schema({
    email:String,
    password: String,
    googleId: String
});

userSchema.plugin(passportlocalmongoose)
userSchema.plugin(findOrCreate);



const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());


passport.use(new GoogleStrategy({
    clientID:"484907210465-f1f9qtlt0cc3e9jrbhbnuliteg9d4nbu.apps.googleusercontent.com",
    clientSecret:"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",
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req,res){
    res.render("home")
})

app.get("/auth/google/", passport.authenticate('google', {scope: ["profile"]}));

app.get("/login", function(req,res){
    res.render("login")
})

app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });


app.post("/login",function(req,res){
    const user = new User({
        username: req.body.username,
        password: req.body.password
    })

    req.logIn(user, function(err){
        if(err){
            console.log(err)
        }
        else{
            passport.authenticate("local")(req,res, function(){
                res.redirect("/secrets");
            })
        }
    })

});

app.get("/register", function(req,res){
    res.render("register")
})

app.get("/secrets", function(req,res){
    if (req.isAuthenticated()){
        res.render("secrets")
    } 
    else{
        res.redirect("/login")
    }
})


app.get("/logout", function(req,res){
    req.logout(function(err){
        if(err){return next(err) ;}
        res.redirect("/")
    });
});


app.post("/register", function(req,res){
    User.register({username: req.body.username}, req.body.password, function(err,user){
        if(err){
            console.log(err)
            res.redirect("/register")
        }
        else{
            passport.authenticate("local")(req,res, function(){
                res.redirect("/secrets")
            })

        }
    })

})




app.listen(3000, function(){
    console.log("Server started on port 3000")
})