
var mongoose = require('mongoose');
var schemas = require('./mongoModel/index');

mongoose.connect('mongodb://localhost/videogameInfoPennapps');

function getfastestTime(text, res){
  schemas.fastestTime.where({'title':new RegExp('^'+text+'$', 'i')}).exec(function(err, data){
    console.log("err: " + err + " data: "  +data);
    return data;
  });
}

function processText(text, res){
  // get fastest time
  if(text.match(/'what is the fastest time it took to finish'/i) != null){ return getfastestTime(text.substr(43), res); }
  else if(false){}

  return ""
}

module.exports = processText;
