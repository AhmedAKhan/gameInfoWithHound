//get express
var request = require('request');
var express = require('express');
var cheerio = require('cheerio');

//------------------------------------------- start for information of games   ---------------------------------------------------------
//find the game and then call getRatingFromPage
function getRating(jsonObject, searchname, searchConsole, callback, options){
  //var url = 'http://ca.ign.com/search?q=' + searchname;
  var url = 'http://ca.ign.com/search?q='+searchname+'&page=0&count=10&type=object&objectType=game&filter=games&';
  searchname = searchname.replace(/\+/g, ' ').trim().replace(':', '');

  request(url, function(error, response, html){
    var $ = cheerio.load(html);

    var searchResults = $('.search-item-title');
    var possibleChoices = [];
    for( var i = 0; i < searchResults.length; i++){
      //gets the name of the current item and then removes extra white space 
      var currentname = searchResults.eq(i).children().text();
      currentname = currentname.replace(/  |\n/g,'').trim();
      currentname = currentname.toLowerCase().replace(':', '');; //make it lower case

      if(currentname === searchname ){
        if(searchConsole === undefined){
	  //this gets the url of the next page item that corresponds to this link
	  var nextUrl = $('.search-item-title').eq(i).children().attr('href')
	  getRatingFromPage(jsonObject, nextUrl, callback, options); // gets the proper info from that page
	  return;
	}

	searchConsole = convertConsole(searchConsole);
	//find the proper link corresponding to the console
	var consoles = $('.search-item-sub-title').eq(i).children();
	var possibleConsoles = []; 
	//this loop is starting at 1 because the first element represents the company that is publishing the game
	for(var j = 1; j < consoles.length; j++){
	  var currentConsole = consoles.eq(j).text().replace(/\+/g, ' ').trim().toLowerCase();
	  possibleConsoles.push(currentConsole);
	  if(currentConsole === searchConsole){
	    var nextUrl = consoles.eq(j).attr('href');
	    getRatingFromPage(jsonObject, nextUrl, callback, options);
	    return;
	  }
	} //end of for getting the correct console

	handleError(jsonObject, callback, 'found the game but not for the console. The game is available for the consoles', possibleConsoles, currentname);
	
	return;
       } // end of done search console
      //this item is not what was asked, add it to the possible choices
      possibleChoices.push(currentname);
    }
    handleError(jsonObject, callback, 'could not find game on ign', possibleChoices);
  });
}

//called whenever an error is detected
function handleError(jsonObject, callback, errorMessage, possibleChoices, title){
  //in case if jsonObject has not been defined yet
  if(jsonObject.possibleChoices == undefined) jsonObject.possibleChoices = [];
  
  //make the error response 
  jsonObject.result.ign = {criticScore:0, userScore:0, 'url':errorMessage, 'possibleChoices':possibleChoices};
  jsonObject.possibleChoices = possibleChoices;

  if(title != undefined) jsonObject.name = title; 
  callback(jsonObject);
}

//gets the information needed
function getInformationObject($, options){
  var obj = {}; 
  //get the appropriate data
  obj.cScore = function($){ return $('.ratingValue').first().text(); };
  obj.uScore = function($){ return $('.ratingValue').eq(1).text();};
  obj.name = function($){ return $('.contentTitle').text();};
  obj.genre = function($){ 
    return $('.gameInfo-list').filter(function(index){ return $(this).attr("class").trim() == "gameInfo-list";  })
    .children()
    .eq(0)
      .children()
	.first()
	.remove()
	.end()
      .end()
    .text()
    .replace(':', '');
  };
  obj.reasonForRating = function($){ 
    var temp = $('.gameInfo-list.leftColumn').children();//.eq(2).text();
    return temp.eq(temp.length-1).text();
  };

  //reformat the date appropriately by removing the new line and all the white space
  var retObj = {}; 
  for(var i = 0; i < options.length; i++){
    if(obj[options[i]] === undefined){  continue;}
    retObj[options[i]] = obj[options[i]]($);
    retObj[options[i]] = retObj[options[i]].replace(/\s+/g,' ').trim();
  }

  return retObj;
}

//found the game page now extract all the information
function getRatingFromPage(jsonObject, nextUrl, callback, options){
  request(nextUrl, function(error, response, html){
    //get the dom object, and return the cheerio which is basically the same as jquery
    var $ = cheerio.load(html);

    //get the apropriate information
    //var params = ['cScore', 'uScore', 'name', 'platform', 'thumbnail', 'summary', 'developer', 'genres', 'rating', 'publisher', 'rlsDate'];
    if(options ===undefined) options = []; 
    if(options === 'all') options = ['cScore', 'uScore', 'name', 'genre', 'reasonForRating'];
    else{ options.push('cScore'); options.push('uScore'); }
     
    var obj = getInformationObject($, options);

    //this is the json object that it will return
    jsonObject.result.ign = { 'criticScore':obj.cScore, 'userScore':obj.uScore, 'url':nextUrl};
    jsonObject.result.websites.push('ign');

    //this is a list that represents the name in the response object that is corresponds with options
    for(var i = 0; i < options.length; i++){
      /*if(obj[options[i]] === undefined) continue;
      if(typeof(obj[options[i]]) === 'string')
	jsonObject.result[options[i]] = obj[options[i]];
      else jsonObject.result[options[i]].concat(obj[options[i]]); */
      if(obj[options[i]] === undefined || options[i] === 'cScore') continue;
      if(jsonObject.result[options[i]] === undefined){//it is undefined meaning it needs to be a string
        jsonObject.result[options[i]] = obj[options[i]];
      }else if(typeof(jsonObject.result[options[i]]) === 'string') continue; // it is a string and already filled in, because its starting value is undefined and not an empty string
      else{ //it is a list
        jsonObject.result[options[i]] = jsonObject.result[options[i]].concat(obj[options[i]].replace(/\s*,\s*/g,',').split(','));
      } 
    }
    delete jsonObject.result.uScore;
    delete jsonObject.result.cScore;
    
    //adjust average score
    jsonObject.result.averageScore = jsonObject.result.averageScore + (+obj.cScore/10) + (+obj.uScore/10);
 
    //call the callback function
    callback(jsonObject);
  });
}
//------------------------------------------- end for informatio of games   ---------------------------------------------------------





//------------------------------------------- start of search games  ---------------------------------------------------------
//find the game and then call getRatingFromPage
function searchForname(info, searchname, searchConsole, callback){
  var url = 'http://ca.ign.com/search?q='+searchname+'&page=0&count=10&type=object&objectType=game&filter=games&';
  searchname = searchname.replace(/\+/g, ' ').trim().replace(':', '');

  request(url, function(error, response, html){
    var $ = cheerio.load(html);

    var searchResults = $('.search-item-title');
    var results = [];
    for( var i = 0; i < searchResults.length; i++){
      //gets the name of the current item and then removes extra white space 
      var currentname = searchResults.eq(i).children().text();
      currentname = currentname.replace(/  |\n/g,'').trim();
      currentname = currentname.toLowerCase().replace(':', '');; //make it lower case

      if(searchConsole === undefined){
	//this gets the url of the next page item that corresponds to this link
	results.push(currentname);
	continue;
      }

      searchConsole = convertConsole(searchConsole);
      //find the proper link corresponding to the console
      var consoles = $('.search-item-sub-title').eq(i).children();
      //this loop is starting at 1 because the first element represents the company that is publishing the game
      for(var j = 1; j < consoles.length; j++){
	var currentConsole = consoles.eq(j).text().replace(/\+/g, ' ').trim().toLowerCase();
	if(currentConsole === searchConsole){
	  results.push(currentname);
	  break;//break out of the inner loop
	}
      } //end of for getting the correct console
     } // end of the for loop of search results

     info.obj = info.obj.concat(results);
    callback(info);
  });//end of requests
}
//------------------------------------------- end for search games   ---------------------------------------------------------





//------------------------------------------- helper functions ---------------------------------------------------------

function convertConsole (name){
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


//------------------------------------------- end of helper functions---------------------------------------------------------


module.exports.getRating = getRating;
module.exports.searchForname = searchForname;
