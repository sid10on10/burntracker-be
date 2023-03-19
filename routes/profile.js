var express = require('express');
var router = express.Router();
var {url,mongodClient} = require("../config")
var mongodb = require("mongodb")
var {authenticate}  = require("../common/auth")
const jwt = require("jsonwebtoken")

router.get('/',authenticate,async function(req,res){
    try{
      client = await mongodClient.connect(url)
      let db = client.db("burntracker")
      let token = req.headers.authorization
      let user = jwt.verify(token,'asknmaofinoinmwrmiwam')
      let userID = user.id
      let userData = await db.collection("users").findOne({_id:mongodb.ObjectId(userID)})
      let data = {
        name: userData.name,
        email: userData.email,
        profile: userData.profile
      }
      return res.status(200).json({message:"User data",data})
    } catch (error) {
      client.close()
      console.log(error)
    }
})

router.post('/',authenticate,async function(req,res){
    try{
      client = await mongodClient.connect(url)
      let db = client.db("burntracker")
      let token = req.headers.authorization
      let user = jwt.verify(token,'asknmaofinoinmwrmiwam')
      let userID = user.id
      let { name, email, age, mobile, gender, dailycalorie, weeklycalorie, dailywater }  = req.body
      let userData = await db.collection("users").updateOne({_id:mongodb.ObjectId(userID)}, { $set : {
            name,
            email,
            profile: {
              age,
              mobile,
              gender,
              dailycalorie,
              weeklycalorie,
              dailywater,
              dailycalorieused
            }
        }
      })
      return res.status(200).json({message:"Profile updated successfully"})
    } catch (error) {
      client.close()
      console.log(error)
    }
})

module.exports = router;