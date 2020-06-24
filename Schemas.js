const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");


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
    category:String,
    tags:[],
    CreatedOn: { type: Date, default: Date.now },
  }

const userSchema = new mongoose.Schema({
    email: String,
    password: String
  });
  userSchema.plugin(passportLocalMongoose);

  exports.postSchema = postSchema
  exports.userSchema = userSchema