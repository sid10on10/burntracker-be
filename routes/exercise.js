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
      let user = jwt.verify(token,process.env.Secret)
      let userID = user.id
      let exerciseData = await db.collection("exercises").find({userID}).toArray()
      res.json({message:"Exercise Data",exerciseData})
      client.close()
      
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
    let user = jwt.verify(token,process.env.Secret)
    let userID = user.id
    let name = req.body.name
    let type = req.body.type
    let logs = []
    let category = []
    let data = {name,type,logs,category,userID}
    let insertedData = await db.collection("exercises").insertOne(data)
    res.json({message:"Exercise Inserted Successfully"})
    client.close()
    
  } catch (error) {
    client.close()
    console.log(error)
  }
})


router.post('/logs/add',authenticate,async function(req,res){
  try{
    client = await mongodClient.connect(url)
    let db = client.db("burntracker")
    let token = req.headers.authorization
    let user = jwt.verify(token,process.env.Secret)
    let exerciseID = req.body.exerciseid
    let datetime = req.body.datetime
    let notes = req.body.notes
    let weight = req.body.weight
    let reps = req.body.reps
    let data = {datetime,notes,weight,reps}
    let insertedData = await db.collection("exercises").updateOne({_id:mongodb.ObjectId(exerciseID)},{$push:{logs:data}})
    res.json({message:"Activity Inserted Successfully"})
    client.close()
    
  } catch (error) {
    client.close()
    console.log(error)
  }
})

router.get('/:exerciseid/logs',authenticate,async function(req,res){
  try{
    client = await mongodClient.connect(url)
    let db = client.db("burntracker")
    let token = req.headers.authorization
    let exerciseID = req.params.exerciseid
    let exerciseData = await db.collection("exercises").findOne({_id:mongodb.ObjectId(exerciseID)})
    let logs = exerciseData.logs

    res.json({message:"Logs Data",logs})
    client.close()
    
  } catch (error) {
    client.close()
    console.log(error)
  }
})




module.exports = router;
