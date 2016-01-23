//dependencies
var request = require('request');
var express = require('express');
var cheerio = require('cheerio');

function getRating(name, console, callback){
  url = 'http://www.imdb.com/find?ref_=nv_sr_fn&q='+name+'&s=all';
  
  request(url, function(error, response, html){
    if(error){ console.log('got an error: ' + error); return; }
    
    var $ = cheerio.load(html);

    getRatingFromPage($, callback);

    //var data = $('#navbar-form').serializeArray();
    //data[1].value = "The hunger games";
    //$('#navbar-submit-button').submit();
  });
}

function getRatingFromPage($, callback){ 
  //go to first link
  var href = $('.result_text').first().children().attr('href')
  var newURL = 'http://www.imdb.com' + href;
  request(newURL, function(error, response, html2){
    //handle the error
    if(error){ console.log('error2: ' + error); return; }

    //get the jquery object
    var $ = cheerio.load(html2);

    var title, release, rating;
    //made an empty json object to put data in
    var json = { title:"", release:"", criticScore:0, userScore:0};

    //user to get the title and the release date of the game
    $('.header').filter(function(){
      var data = $(this); //gets the data
      //get the title and the release
      title = data.children().first().text();
      release = data.children().last().children().text();

      //format the data
      title = title.replace(/  |\n/g,'').trim();
      releae = release.replace(/  |\n/g,'').trim();

      //add it to the json object
      json.title = title;
      json.release = release;
    });

    //this is for getting the json rating
    $('.star-box-giga-star').filter(function(){
      var data = $(this);
      var criticScore  = data.text();
      criticScore = criticScore.replace(/  |\n/g,'').trim();
      json.criticScore = criticScore;
    });

    //make the json that we will send back equal to the json with the information we need
    jsonObject.result.imdb = json;
    jsonObject.result.websites.push('imdb');

    //add to the average score
    jsonObject.result.averageScore = jsonObject.result.averageScore + (criticScore)/10;

    //call the callback function
    callback();
  }); 
}

module.exports.getRating = getRating;
