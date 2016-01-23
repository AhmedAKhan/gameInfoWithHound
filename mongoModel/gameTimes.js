var mongoose = require('mongoose');

var Schema = mongoose.Schema;
var gameTimesSchema= new Schema({
  title : String,
  time  : String
});


var gameTime = mongoose.model("gameTimes", gameTimesSchema);


module.exports = gameTime;
