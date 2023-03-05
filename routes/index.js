var express = require('express');
var router = express.Router();
var {url,mongodClient} = require("../config")
const { sendEmail } = require('../common/mailer');
var mongodb = require("mongodb")
var {authenticate}  = require("../common/auth")
const jwt = require("jsonwebtoken")
const bcryptjs = require("bcryptjs")

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/verify',authenticate,async function(req,res){
  try{
    client = await mongodClient.connect(url)
    let db = client.db("burntracker")
    let token = req.headers.authorization
    let user = jwt.verify(token,process.env.Secret)
    let userId = user.id
    let userData = await db.collection("users").findOne({_id:mongodb.ObjectId(userId)})
    let userName = userData.name
    res.json({message:"Valid",userName,userId})
    
  } catch (error) {
    client.close()
    console.log(error)
  }
})

router.get('/dashboard',authenticate, async function(req, res, next) {
  let client
  try {
    client = await mongodClient.connect(url)
    let db = client.db("burntracker")
    let token = req.headers.authorization
    let user = jwt.verify(token,process.env.Secret)
    //console.log(user) { id: '5f8d76579f0fa4264d05c524', iat: 1603115379 }
    let userID = user.id
    let userData = await db.collection("users").findOne({_id:mongodb.ObjectId(userID)})
    res.json({
      id:userID,
      email:userData.email
    })
  } catch (error) {
    client.close()
    console.log(error)
  }
});

router.post("/reset_password",async function(req,res,next){
  let client;
  try {
      client = await mongodClient.connect(url)
      let db = client.db("burntracker")
      let {email} = req.body
      let user = await db.collection("users").findOne({email})
      if(user){
        let userId = user._id
        let reset_string = Math.random().toString(36).substr(2, 5);
        let update = await db.collection("users").findOneAndUpdate({email},{$set:{reset_token:reset_string}})
        let payload = `Reset Your Password here https://burntracker.netlify.app/reset/${userId}/${reset_string}`
        let sending = await sendEmail(email,"Reset Link",payload)
        console.log(sending)
        res.json({
          message:"Email sent check your email for reset link"
        })
      }else{
        res.json({
          message:"No user found with this email"
        })
      }

  } catch (error) {
    client.close()
    console.log(error)
  }
})

router.get('/reset/:userid/:reset_string', async function(req, res, next) {
  let client;
  try{
    client = await mongodClient.connect(url)
    let db = client.db("burntracker")
    let user = await db.collection("users").findOne({_id:mongodb.ObjectId(req.params.userid)})
    if(user){
      let userEmail = user.email
      if(user.reset_token==req.params.reset_string){
        res.json({
          message:"Valid RESET URL",
          email:userEmail
        })
        client.close()
      }else{
        client.close()
        res.status(404).json({
          message:"Invalid URL"
        })
      }
    }else{
      client.close()
      res.status(404).json({
        message:"Invalid URL"
      })
    }
    
    }catch(error){
      client.close()
      console.log(error)
  }
});

router.post('/reset', async function(req, res, next) {
  let client;
  try{
    client = await mongodClient.connect(url)
    let db = client.db("burntracker")
    let {email,password} = req.body
    let user = await db.collection("users").findOne({email:email})
    if(user){
      let salt = await bcryptjs.genSalt(10)
      let hash = await bcryptjs.hash(password,salt)
      password = hash
      let setpass = await db.collection("users").updateOne({email},{$set:{password}})
      let remove_token = await db.collection("users").updateOne({email},{$unset:{reset_token:1}})
      res.json({
        message:"Password reset complete"
      })
    }else{
      res.json({
        message:"No user found with this email"
      })
    }
    
  }catch(error){
    client.close()
    console.log(error)
  }
});

module.exports = router;
