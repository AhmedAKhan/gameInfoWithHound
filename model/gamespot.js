//dependencies
var request = require('request');
var express = require('express');
var cheerio = require('cheerio');

// need to return the url as well
function getRating(jsonObject, name, searchConsole, callback, options){
  url = 'http://www.gamespot.com/search/?indices%5B0%5D=game&indices%5B1%5D=hub&indices%5B2%5D=videoshow&indices%5B3%5D=platform&q='+name;// the url it will search
  name = name.replace(/\+/g,' ').trim().replace(':',''); // replace the + in the name with a spacebar
  if(searchConsole !== undefined){ 
    searchConsole = shortenPlatformname(searchConsole)
    if(searchConsole == undefined){ handleError(jsonObject, callback, 'can not find console in gamepot'); return; }
    searchConsole = searchConsole.toLowerCase(); 
  }
  request(url, function(error, response, html){
    var $ = cheerio.load(html); // gets the jquery
    
    // go through all the results and find the correct game
    var results = $('.media-title');
    var possibleChoices = [];
    for(var i = 0; i < results.length; i++){
      var curTitle = results.eq(i).text();
      curTitle = curTitle.replace(/(\s+|\n)/g, ' ').trim().toLowerCase().replace(':','');
      
      //found the correct name
      if(curTitle === name){
	var href = results.eq(i).children().attr('href'); 
	var newURL = 'http://www.gamespot.com'+href; //+'/reviews/';
	getRatingFromPage(jsonObject, newURL,callback, options);
	return;
      }      
    }
    handleError(jsonObject, callback, 'could not find game on gamespot', possibleChoices);
  });
}
function handleError(jsonObject, callback, message, pc){ 
  //console.log('message: ' + message);
  jsonObject.result.gamespot = { userScore:0, criticScore:0, url:message };
  callback(jsonObject); 
}

function getInformationObject($, options){
  var obj = {};
  
  obj.cScore = function(){ return $('.gs-score__cell').first().text(); }; // updated //get the critic score
  obj.uScore = function(){ return $('.reviewObject__userAvg').children().eq(1).text(); }; // updated
  obj.name = function(){ return $('.gameObject__title').children().text();    }; // updated 
  obj.platform = function(){ return $('.system.system--x360-color ').text();       }; // updated 
  obj.pic = function(){ return $('.img.imgflare--boxart').children().attr('src')   }; // updated 

  //not used yet
  obj.summary = function(){ return $('.pod-objectStats-info__deck').text();                               }; // updated
  obj.developer = function(){ return $('.pod-objectStats-additional').children().eq(1).text();/*.replace(/\s+/g,'').split(',');*/  }; // updated 
  obj.genre = function(){ return $('.pod-objectStats-additional').children().eq(5).text()/*.replace(/\s+/g,'').split(','); */      }; // updated 
  obj.theme = function(){ return $('.pod-objectStats-additional').children().eq(7).text()/*.replace(/\s+/g,'').split(','); */      }; // updated 
  obj.publisher = function(){ return $('.pod-objectStats-additional').children().eq(3).text()/*.replace(/\s+/g,'').split(',')*/    }; //updated 
  obj.releaseDate = function(){ return $('.pod-objectStats-info__release').children().children().first().text(); }; // updated 
  
  //since different versions of the game have different ratings then we need to find the rating that corrseponds to ours
  if(console != undefined){
    var ratings = $('.summary_detail.product_rating').children('.data').text();
    for(var i = 0; i < ratings.length; i++){
      var currentRating = ratings.first().children().eq(i).children('dd').first().text().toLowerCase()
      if(currentRating.includes(console)){
  	obj.rating = ratings.first().children().eq(i).children().first().text();   //updated
  	obj.ratingExplanation = ratings.first().children().eq(1).children().eq(2).text(); // updated
      }//if statement
    }// for loop
  }//if statement

  var retObj = {};
  for(var i = 0; i < options.length; i++){
    if(obj[options[i]] == undefined) continue;
    retObj[options[i]] = obj[options[i]]($);
    retObj[options[i]] = retObj[options[i]].replace(/\s+/g,' ').replace(/\s*,\s*/g,',').trim();
  }

   
  return retObj;
}

function getRatingFromPage(jsonObject, url, callback, options){
  //requesting the url
  request(url, function(error, response, html){
    var $ = cheerio.load(html); // get the dom

    if(options == undefined) options = [];
    if(options == 'all') options = ['genre', 'cScore', 'uScore', 'name', 'platform', 'thumbnail', 'summary', 'developer', 'rating', 'publisher', 'rlsDate'];
    else{ options.push('cScore'); options.push('uScore'); }
     
    var obj = getInformationObject($, options);
    //this is the json object that it will return
    jsonObject.result.gamespot = { 'criticScore':obj.cScore, 'userScore':obj.uScore, 'url':url}; 
    jsonObject.result.websites.push('gamespot');

    //this is a list that represents the name in the response object that is corresponds with options
    for(var i = 0; i < options.length; i++){
      if(obj[options[i]] === undefined) continue;
      if(jsonObject.result[options[i]] === undefined){
	jsonObject.result[options[i]] = obj[options[i]];
      }else if(typeof(jsonObject.result[options[i]]) === 'string'){ 
	continue;
      }
      else{//if(jsonObject.result[options[i]].length == 0){
	jsonObject.result[options[i]] = jsonObject.result[options[i]].concat(obj[options[i]].split(','));
      }
    }//end of for loop


    delete jsonObject.result.cScore;
    delete jsonObject.result.uScore; 
    //adjust average score
    jsonObject.result.averageScore = jsonObject.result.averageScore + (+obj.cScore/10) + (+obj.uScore/10);
    callback(jsonObject);
  });
}



//------------------------------------------- start of search --------------------------------------------------------
// need to return the url as well
function searchForname (info, name, searchConsole, callback, options){
  url = 'http://www.gamespot.com/search/?indices%5B0%5D=game&indices%5B1%5D=hub&indices%5B2%5D=videoshow&indices%5B3%5D=platform&q='+name;// the url it will search
  name = name.replace(/\+/g,' ').trim().replace(':',''); // replace the + in the name with a spacebar
  if(searchConsole !== undefined){ 
    searchConsole = shortenPlatformname(searchConsole)
    if(searchConsole == undefined){ 
      callback(info);
      return; 
    }
    searchConsole = searchConsole.toLowerCase(); 
  }
  request(url, function(error, response, html){
    var $ = cheerio.load(html); // gets the jquery
    
    // go through all the results and find the correct game
    var results = $('.media-title');
    var possibleChoices = [];
    for(var i = 0; i < results.length; i++){
      if(i > 0 && i < 5) continue;
      var curTitle = results.eq(i).text();
      curTitle = curTitle.replace(/(\s+|\n)/g, ' ').trim().toLowerCase().replace(':','');
      
      //add it to the current title
      //is it a game
      possibleChoices.push(curTitle);
    }
    info.obj = info.obj.concat(possibleChoices);
    callback(info);
  });
}
//------------------------------------------- end of search --------------------------------------------------------



//-------------------------------------------HELPER FUnCTIOns--------------------------------------------------------

//get the platform name
function shortenPlatformname(name){
  name = name.toLowerCase().replace(/\s+/g, '');
  return {
    'playstation3':'ps3',
    'playstation4':'ps4',
    'ps3':'ps3',
    'ps4':'ps4',
    'xboxone':'xbox one',
    'xbox360':'xbox 360',
    'wii':'wii',
    'wiiu':'wii u'
  }[name];
}

//-------------------------------------------end of helper functions--------------------------------------------------------

module.exports.getRating = getRating;
module.exports.searchForname = searchForname;
