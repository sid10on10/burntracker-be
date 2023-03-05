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
      let categoryData = await db.collection("categories").find({userID}).toArray()
      res.json({message:"Exercise Data",categoryData})
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
    let exercises = []
    let data = {name,exercises,userID}
    let insertedData = await db.collection("categories").insertOne(data)
    res.json({message:"Category Inserted Successfully"})
    client.close()
    
  } catch (error) {
    client.close()
    console.log(error)
  }
})


router.post('/exercise/add',authenticate,async function(req,res){
  try{
    client = await mongodClient.connect(url)
    let db = client.db("burntracker")
    let categoryID = req.body.categoryid
    let exerciseID = req.body.exercise
    let insertData = await db.collection("categories").findOneAndUpdate({_id:mongodb.ObjectId(categoryID)},{$push:{exercises:exerciseID}})
    res.json({message:"Exercise Added"})
    client.close()
    
  } catch (error) {
    client.close()
    console.log(error)
  }
})

router.get('/:categoryid/exercises',authenticate,async function(req,res){
    try{
      client = await mongodClient.connect(url)
      let db = client.db("burntracker")
      let token = req.headers.authorization
      let user = jwt.verify(token,process.env.Secret)
      let userID = user.id
      let categoryID = req.params.categoryid
      let categoryData = await db.collection("categories").findOne({_id:mongodb.ObjectId(categoryID)})
      let exercises = categoryData.exercises
      let exerciseData = []

      for(each of exercises){
        let data = await db.collection("exercises").findOne({_id:mongodb.ObjectId(each)})
        exerciseData.push(data)
      }
      res.json({message:"Exercise Data",exerciseData})
      client.close()
      
    } catch (error) {
      client.close()
      console.log(error)
    }
  })




module.exports = router;
