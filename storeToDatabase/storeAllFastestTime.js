var request = require('request');
var cheerio = require('cheerio');
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/videogameInfoPennapps');


function start(){
  console.log("start storing times for video games .\n.\n.");

  var url = "http://speeddemosarchive.com/gamelist/FullList.html";
  request(url, function(err, res, html){
    if(err){ console.log(err); return; }
    var $ = cheerio.load(html);
    for(var i=o; i < $('ul').children().length; i++){
      var time = $('ul').children().eq(i).text().match('\\(.*\\)')[0];
      var name = $('ul').children().eq(i).children().eq(0).text();

    }

  });
};




start();
