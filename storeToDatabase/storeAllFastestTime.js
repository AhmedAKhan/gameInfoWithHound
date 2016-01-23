var request = require('request');
var cheerio = require('cheerio');
var mongoose = require('mongoose');

var schemas = require('../mongoModel/index');
var nums = 0; // variable to determine when to close the connection
console.log(typeof(schemas.fastestTime));

mongoose.connect('mongodb://localhost/videogameInfoPennapps');

function save(name, time){
  console.log("name: " + name + " time: " + time);
  var obj = new schemas.fastestTime({'title':name, 'time':time});
  obj.save(function(err, object){
    if(err){ console.log("an error has occured"); }
    nums--;
    if(nums <= 0) mongoose.connection.close();
  });
}


function start(){
  console.log("start storing times for video games .\n.\n.");

  var url = "http://speeddemosarchive.com/gamelist/FullList.html";
  request(url, function(err, res, html){
    if(err){ console.log(err); return; }
    var $ = cheerio.load(html);
    var i = 0;
    nums = $('ul').children().length;
    for(var i=0; i < $('ul').children().length; i++){
      var time = $('ul').children().eq(i).text().match('\\(.*\\)')[0];
      var name = $('ul').children().eq(i).children().eq(0).text();
      time = time.substr(1, time.length-2);// get rid of the openning and ending brackets
      save(name, time);
    }
  });
};





start();
