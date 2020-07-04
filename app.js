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
const Schema = require("./Schemas");


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
const Post = mongoose.model("Post", Schema.postSchema);
const User = mongoose.model("User", Schema.userSchema);
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
///////////////////////////////////////////////////////////////

const categories = [{
  name : 'unitedStates',
  title : 'United States',
  info : 'Beautiful fullsize Photographs From the United States',
  position : 0,
}, {
  name : 'europe',
  title : 'Europe',
  info : 'Beautiful Continents with Misterius beauty.',
  position : 1,
}, {
  name : 'mobile',
  title : 'Mobile',
  info : 'Beautiful Photos for your phone.',
  position : 2,
}];


app.listen(process.env.PORT || 3000, function () {
  console.log("Server started on port 3000");
});
 
app.route('/')
  .get(function (req, res) {
    Promise.all([
      Post.find({category:"unitedStates"}).limit(6),
      Post.find({category:"europe"}).limit(6),
      Post.find({category:"mobile"}).limit(6),
    ]).then(results=>{      
    res.render('home', {posts: results, categories:categories });
    }
    );
  });

app.route('/compose')
  .get(function (req, res) {
    if (req.isAuthenticated()) {
      res.render('compose', {categories:categories});
    } else {
      res.render('login');
    }
  })
  .post(function (req, res) {
    var name = _.camelCase(req.body.name);
    if (req.files) {
      var file = req.files.imgUpload; // file send from compose.ejs
      var fileName = file.name; // name on the file when is uploaded 
      var rawImagePath = path.join("./public/img/fullsize/", fileName);
      var extentionInImage = path.extname(rawImagePath); // this extract the extention in the file uploded 
      var imageName = path.basename(rawImagePath, extentionInImage)
      var lowResolutionPath = "/public/img/forWeb/" + _.camelCase(imageName) + extentionInImage; // to save in public folder after is reduce size
      var imagePathForWeb = "img/forWeb/" + _.camelCase(imageName) + extentionInImage; // path to render pics in templace.
      var imagePathFormated = "/public/img/fullsize/" + _.camelCase(imageName) + extentionInImage;

      file.mv("." + imagePathFormated, function (err) {
        if (!err) {
          sharp(__dirname + imagePathFormated).resize({
            height: 1000
          }).toFile(__dirname + lowResolutionPath);
          var dimensions = sizeOf("." + imagePathFormated);
          const posts = new Post({
            name: req.body.name,
            formatedName: _.camelCase(imageName),
            info: req.body.info,
            imagePath: imagePathFormated,
            imagelowResolutionPath: lowResolutionPath,
            imagePathForWeb: imagePathForWeb,
            width: dimensions.width,
            height: dimensions.height,
            category: _.camelCase(req.body.category),
            tags: req.body.tags.split(' '),
          });
          posts.save();
          res.redirect('/compose');
        }
      });
    } else {
      res.send('didnt work');
    };
  });

app.route('/category/:category')
  .get(function (req, res) {
    const categoryForQuery = req.params.category;
    Post.find({category:_.camelCase(categoryForQuery)}, function(err, posts){
     res.render('postByCategory', {posts:posts});
    })
  });

app.route('/downloading')
  .get((req, res)=>{
  res.render('downloading')
  })
  .post((req, res)=>{
    Post.findById(req.body.id, (err, post)=>{
      
      let picturePath = __dirname + post.imagePath;
      console.log(picturePath);
      
      res.sendFile(picturePath);
      res.redirect('downloading');
    });
  });

app.route('/post/:postid')
  .get(function (req, res) {
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
  
app.route('/delete')
  .get(function (req, res, next) {
    if (req.isAuthenticated()) {
      Post.find({}, function (err, posts) {
        if (!err) {
          res.render('delete', {
            posts: posts
          });
        } else {
          res.send('error');
        }
      });
    } else {
      res.redirect('login');
    }
  })
  .post(function (req, res) {
    const postId = req.body.postId;
    Post.findById(postId, function (err, post) {
      if (!err) {
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
      }
    })
  });

app.route("/login")
  .get(function (req, res) {
    res.render('login');
  })
  .post(function (req, res) {
    const user = new User({
      username: req.body.username,
      passport: req.body.password,
    });
    req.login(user, function (err) {
      if (err) {
        console.log(err)
      } else {
        passport.authenticate("local")(req, res, function () {
          res.redirect('compose');;
        })
      }
    })
  });

app.route('/register')
  .get(function (req, res) {
    const RegisterOpen = false;
    if (RegisterOpen) {
      res.render('register');
    } else {
      if (req.isAuthenticated()) {
        res.render('Register')
      } else {
        res.redirect('login');
      }
    }
  })
  .post(function (req, res) {
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

app.route('/logout')
  .get(function (req, res) {
    req.logOut();
    res.redirect('/');
  });