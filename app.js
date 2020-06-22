const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require('lodash');
const mongoose = require("mongoose");
const upload = require('express-fileupload');
const app = express();
const path = require('path');
const sharp = require('sharp');
const sizeOf = require('image-size');
const fs = require('fs');
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static(__dirname + '/public'));
app.use(upload());
app.use(session({
  secret: 'there in not place like home',
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

// database set up ////////////////////////////////////////////////
mongoose.connect('mongodb://localhost:27017/wild-heartDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

mongoose.set('useCreateIndex', true);
const postSchema = {
  name: String,
  formatedName: String,
  info: String,
  views: Number,
  downloads: Number,
  cameraMake: String,
  cameraModel: String,
  focalLength: String,
  aperture: String,
  shutterSpeed: String,
  ISO: Number,
  imagePath: String,
  imagelowResolutionPath: String,
  imagePathForWeb: String,
  width: String,
  height: String,
}
const Post = mongoose.model("Post", postSchema);


const userSchema = new mongoose.Schema({
  email: String,
  password: String
});
userSchema.plugin(passportLocalMongoose);
const User = mongoose.model("User", userSchema);
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
///////////////////////////////////////////////////////////////

app.listen(process.env.PORT || 3000, function () {
  console.log("Server started on port 3000");
});

app.get('/', function (req, res) {
  Post.find({}, function (err, posts) {
    if (!err) {
      res.render('home', {
        posts: posts
      });
    } else {
      res.send('error');
    }
  });

});

app.get('/compose',
  passport.authenticate('local', {
    successRedirect: '/compose',
    failureRedirect: '/login'
  }));

app.post('/compose', function (req, res) {
  var name = _.camelCase(req.body.name);
  if (req.files) {
    var file = req.files.imgUpload; // file send from compose.ejs
    var fileName = file.name; // name on the file when is uploaded 

    var rawImagePath = path.join("./uploads/images/", fileName);
    var extentionInImage = path.extname(rawImagePath); // this extract the extention in the file uploded 
    var imageName = path.basename(rawImagePath, extentionInImage)
    var lowResolutionPath = "/public/img/forWeb/" + _.camelCase(imageName) + extentionInImage; // to save in public folder after is reduce size
    var imagePathForWeb = "img/forWeb/" + _.camelCase(imageName) + extentionInImage; // path to render pics in templace.
    var imagePathFormated = "/uploads/images/" + _.camelCase(imageName) + extentionInImage;

    file.mv("." + imagePathFormated, function (err) {
      if (!err) {
        sharp("." + imagePathFormated).resize({
          height: 1000
        }).toFile("." + lowResolutionPath);
        var dimensions = sizeOf("." + imagePathFormated);

        const posts = new Post({
          name: req.body.name,
          formatedName: _.camelCase(imageName),
          info: req.body.info,
          cameraMake: req.body.cameraMake,
          cameraModel: req.body.cameraModel,
          focalLength: req.body.focalLength,
          aperture: req.body.aperture,
          shutterSpeed: req.body.shutterSpeed,
          ISO: req.body.iso,
          imagePath: imagePathFormated,
          imagelowResolutionPath: lowResolutionPath,
          imagePathForWeb: imagePathForWeb,
          width: dimensions.width,
          height: dimensions.height,
        });
        posts.save();
      }
    });
    res.redirect('/compose');
  } else {
    res.send('didnt work');
  };
});

app.get('/post/:postid', function (req, res) {
  const postid = req.params.postid;
  Post.findById(postid, function (err, post) {
    if (err) {
      console.log(err);
    } else {
      res.render('detailPost', {
        post: post
      })
    }
  })
});

app.get('/delete', function (req, res, next) {
  if(req.isAuthenticated()){
       Post.find({}, function (err, posts) {
      if (!err) {
        res.render('delete', {
          posts: posts
        });
      } else {
        res.send('error');
      }
    });
  }else{
    res.redirect('login');
  }
})


app.post('/delete', function (req, res) {
  const postId = req.body.postId;
  Post.findById(postId, function (err, post) {
    if (!err) {
      console.log(post);
      fs.unlink(__dirname + post.imagePath, function (err) {
        err ? console.log(err) : console.log('images full image');
      })
      fs.unlink(__dirname + post.imagelowResolutionPath, function (err) {
        err ? console.log(err) : console.log('images erase low image');
      });
      Post.findByIdAndDelete(postId, function (err) {
        err ? console.log(err) : console.log('item in the database was delete.');
      });
      res.redirect('delete');
      // console.log('everything was delete')
    }
  })
});

app.get("/login", function (req, res) {
  res.render('login');
});

app.post('/login', function (req, res) {
  const user = new User({
    username: req.body.username,
    passport: req.body.password,
  });

  req.login(user, function (err) {
    if (err) {
      console.log(err)
    } else {
      passport.authenticate("local")(req, res, function () {
        res.render('compose');;
      })
    }
  })
});

app.get("/register", function (req, res) {
  res.render('register');
});

app.post('/register', function (req, res) {
  User.register({
    username: req.body.username
  }, req.body.password, function (err, user) {
    if (err) {
      console.log(err);
      res.redirect('/register');
    } else {
      passport.authenticate('local')(req, res, function () {
        res.redirect('compose');
      });
    }
  });
});

app.get("/logout", function (req, res) {
  req.logOut();
  res.redirect('/');
});