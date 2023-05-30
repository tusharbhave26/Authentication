//jshint esversion:6
require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const saltRound = 10;

const app = express()

app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended:true}))
app.set('view engine', 'ejs');

mongoose.connect("mongodb://127.0.0.1:27017/userDB",
{useUnifiedTopology: true,
useNewUrlParser: true});

const userSchema = new mongoose.Schema({
    email:String,
    password: String
});

const User = new mongoose.model("User", userSchema);

app.get("/", function(req,res){
    res.render("home")
})

app.get("/login", function(req,res){
    res.render("login")
})

app.post("/login",function(req,res){
    const userName = req.body.username;
    const password = req.body.password
    
    User.findOne({email: userName}).then(function(founduser){
        if (founduser){
            bcrypt.compare(password, founduser.password, function(err, result) {
                if (result === true){
                    res.render("secrets")
                }
          
                else{
                    res.send("<h2> Wrong Users Password </h2>")
                }
        })}
        else {
            res.send("<h2> Sorry user does not exist </h2>")
        }
    }).catch(function(err){
        console.log(err)
    })
});

app.get("/register", function(req,res){
    res.render("register")
})

app.post("/register", function(req,res){

    bcrypt.hash(req.body.password, saltRound, function(err, hash){
        const newUser = new User({
            email: req.body.username,
            password: hash
        });
        newUser.save().then(function(){
            res.render("secrets")
        }).catch(function(err){
            console.log(err)
        })

    })
})




app.listen(3000, function(){
    console.log("Server started on port 3000")
})