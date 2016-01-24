
var mongoose = require('mongoose');
var schemas = require('./mongoModel/index');

mongoose.connect('mongodb://localhost/videogameInfoPennapps');

function getfastestTime(text, res){
  console.log("inside get fastest time");
  schemas.fastestTime.where({'title':new RegExp('^'+text+'$', 'i')}).exec(function(err, data){
    console.log("err: " + err + " data: "  +data + " typeof: " + typeof(data));
    console.log("data.title: " + data[0].title + " time: " + data[0].time);
    var timeArray = data[0].time.split(':');

    var timeInWords = '';
    if(parseInt(timeArray[0]) > 0) timeInWords += timeArray[0] + " hours ";
    if(parseInt(timeArray[1]) > 0) timeInWords += timeArray[1] + " minutes ";
    timeInWords += timeArray[2] + " seconds";
    res.send("The fastest time it took to complete "+ data[0].title + " was " + timeInWords);
    // res.send(data)
  });
}

function processText(text, res){
  // get fastest time
  console.log("inside the process text: " + text);
  console.log(text.match(/what is the fastest time it took to finish/i));
  if(text.match(/what is the fastest time it took to finish/i) != null){
    console.log("made it in the if statement");
    return getfastestTime(text.substr(43), res);
  }else if(false){}
  else res.send("got nothing man");
}

module.exports = processText;
