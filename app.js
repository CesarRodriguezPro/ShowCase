const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require('lodash');
const mongoose = require("mongoose");

const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

// database set up ////////////////////////////////////////////////
mongoose.connect('mongodb://localhost:27017/JavierAccounts', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const postSchema = {
  info: String,
  views: Number,
  downloads:Number,
  cameraMake:String,
  cameraModel:String,
  focalLength:String,
  aperture:String,
  shutterSpeed:String,
  ISO:Number,
  dimentions:String,
}

const Post = mongoose.model("Post", postSchema);
///////////////////////////////////////////////////////////////

app.listen(3000, function () {
    console.log("Server started on port 3000");
  });


app.get('/', function (req, res) {
res.render('home');
});