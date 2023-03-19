var express = require('express');
var router = express.Router();
var {url,mongodClient} = require("../config")
var mongodb = require("mongodb")
var {authenticate}  = require("../common/auth")
const jwt = require("jsonwebtoken")
var {exercises}  = require("../exerciseConfig");
const e = require('express');



router.get('/',authenticate,async function(req,res){
    try{
      client = await mongodClient.connect(url)
      let token = req.headers.authorization
      let user = jwt.verify(token,'asknmaofinoinmwrmiwam')
      let userID = user.id
      let exerciseData = exercises
      let outExercises = {}
      for (let key of Object.keys(exerciseData)){
        let value = exerciseData[key]
        let temp = []
        for(let key2 of Object.keys(value)){
          temp.push(key2)
        }
        outExercises[key] = temp
      }
      return res.json({message:"Exercise Data",data: outExercises})      
    } catch (error) {
      client.close()
      console.log(error)
    }
  })

router.post('/add',authenticate,async function(req,res){
  try{
    client = await mongodClient.connect(url)
    let db = client.db("burntracker")
    let token = req.headers.authorization
    let user = jwt.verify(token,'asknmaofinoinmwrmiwam')
    let userID = user.id
    let type = req.body.type
    let exercise = req.body.exercise
    let reps = req.body.reps
    let exerciseData = exercises
    let calorie = exerciseData[type][exercise].calorie*reps
    // update the daily calorie
    let userData = await db.collection("users").findOne({_id:mongodb.ObjectId(userID)})
    let newCalorie
    if(userData.profile.dailycalorieused){
      newCalorie = userData.profile.dailycalorieused + calorie
    }else{
      newCalorie = calorie
    }
    await db.collection("users").updateOne({_id:mongodb.ObjectId(userID)}, { $set : {
      profile: {
        dailycalorieused: newCalorie
        }
      }
    })
    let date = new Date()
    let dateString = `${date.getDate()}-${date.getMonth()+1}-${date.getFullYear()}`
    // update in exercises collection
    let exerciseLog = await db.collection("exercises").findOne({userId:mongodb.ObjectId(userID)})
    let logs = exerciseLog.logs
    if(dateString in logs){
      let data = {
        exercise,
        type,
        reps,
        calorie
      }
      logs[dateString].push(data)
      let insertedData = await db.collection("exercises").updateOne({userId:mongodb.ObjectId(userID)},{$set:{logs:logs}})
    }else{
      let data = {
        exercise,
        type,
        reps,
        calorie
      }
      logs[dateString] = [data]
      let insertData = {
        userId: userID,
        logs: logs
      } 
      let insertedData = await db.collection("exercises").updateOne({userId:mongodb.ObjectId(userID)},{$set:{logs:logs}})
    }
    
    res.json({message:"Exercise Inserted Successfully"})
    client.close()
    
  } catch (error) {
    client.close()
    console.log(error)
  }
})


router.get('/logs',authenticate,async function(req,res){
  try{
    client = await mongodClient.connect(url)
    let db = client.db("burntracker")
    let token = req.headers.authorization
    let user = jwt.verify(token,'asknmaofinoinmwrmiwam')
    let userID = user.id
    let data = await db.collection("exercises").findOne({ userId: mongodb.ObjectId(userID) })
    let outData = []
    let logs = data.logs
    let index = 0
    for(let key of Object.keys(logs)){
      for(let i of logs[key]){
        i['date'] = key
        index = index + 1
        i['id'] = index
        outData.push(i)
      }

    }
    res.json({message:"Logs fetched Successfully", data: outData})
    client.close()
    
  } catch (error) {
    client.close()
    console.log(error)
  }
})

module.exports = router;
