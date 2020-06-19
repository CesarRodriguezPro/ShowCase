const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require('lodash');
const mongoose = require("mongoose");
const upload = require('express-fileupload');
const app = express();
const path = require('path');
const sharp = require('sharp');
var sizeOf = require('image-size');


app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));
app.use(upload());


// database set up ////////////////////////////////////////////////
mongoose.connect('mongodb://localhost:27017/JavierAccounts', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const postSchema = {
  name: String,
  info: String,
  views: Number,
  downloads: Number,
  cameraMake: String,
  cameraModel: String,
  focalLength: String,
  aperture: String,
  shutterSpeed: String,
  ISO: Number,
  dimentions: String,
  imagePath: String,
  imagelowResolutionPath: String,
}
const Post = mongoose.model("Post", postSchema);
///////////////////////////////////////////////////////////////

app.listen(3000, function () {
  console.log("Server started on port 3000");
});

app.get('/', function (req, res) {
  res.render('home');
});


app.get('/compose', function (req, res) {
  res.render('compose', );
});

app.post('/compose', function (req, res) {
  var name = _.camelCase(req.body.name);
  if (req.files) {
    var file = req.files.imgUpload;
    var fileName = file.name;

    var rawImagePath = path.join("./uploads/images/", fileName);
    var extentionInImage = path.extname(rawImagePath);
    var imageName = path.basename(rawImagePath, extentionInImage)
    var lowResolutionPath = "./uploads/lowResolution/" + _.camelCase(imageName) + extentionInImage;
    var imagePathFormated = "./uploads/images/" + _.camelCase(imageName) + extentionInImage;


    file.mv(imagePathFormated, function (err) {
      if (!err) {
        sharp(imagePathFormated).resize({height: 780}).toFile(lowResolutionPath);
        var dimensions = sizeOf(imagePathFormated); 

        const posts = new Post({
          name: req.body.name,
          info: req.body.info,
          cameraMake: req.body.cameraMake,
          cameraModel: req.body.cameraModel,
          focalLength: req.body.focalLength,
          aperture: req.body.aperture,
          shutterSpeed: req.body.shutterSpeed,
          ISO: req.body.iso,
          imagePath: imagePathFormated,
          imagelowResolutionPath: lowResolutionPath,
          dimensions: dimensions.width+'x'+ dimensions.height,
        });
        posts.save();
      }
    });



    res.redirect('/compose');
  } else {
    res.send('didnt work');
  };
});