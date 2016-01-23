//dependencies
var request = require('request');
var express = require('express');
var cheerio = require('cheerio');

// need to return the url as well
function getRating(jsonObject, name, searchConsole, callback, options){
  if(searchConsole !== undefined){ 
    searchConsole = shortenPlatformname(searchConsole)
    if(searchConsole == undefined){ handleError(jsonObject, callback, 'can not find console in gameradar'); return; }
    searchConsole = searchConsole.toLowerCase(); 
  }
  var url;
  if(searchConsole == undefined) 
    url = 'http://www.gamesradar.com/search/?q='+name+'&platform=all-platforms&content=reviews&order_by=best-match'; 
  else url = 'http://www.gamesradar.com/search/?q='+name+'&platform='+searchConsole.replace(/\s/g, '-')+'&content=reviews&order_by=best-match'; 

  name = name.replace(/\+/g,' ').trim().toLowerCase().replace(':',''); // replace the + in the name with a spacebar
  request(url, function(error, response, html){
    var $ = cheerio.load(html); // gets the jquery

    // go through all the results and find the correct game
    var results = $('.headline'); // updated
    var possibleChoices = [];
    for(var i = 0; i < results.length; i++){
      var curTitle = results.eq(i).text();
      curTitle = curTitle.replace(/(\s+|\n)/g, ' ').trim().toLowerCase();
      curTitle = curTitle.replace('super review', '');
      curTitle = curTitle.replace('review', '').trim().replace(':','');
 
      //found the correct name
      if(curTitle === name){
	//checking if its for a game, and not a movie, TV, 
	var platform = results.eq(i).parent().children('.related_platforms').text();
	if(searchConsole !== undefined){
	  //if the search console is defined and it is not equal to the current platform then just move on
	  if(platform.length !== 0){ 
	    var pos = platform.trim().replace(/\s+\n\s+/g, ',').toLowerCase().split(',').indexOf(searchConsole.replace('-', ' ').toLowerCase());
	    if(pos === -1) continue;
	  }
	}else if(!isGameReview(platform.replace(/\s+/g,''))) continue;

	//go to the link
	var href = results.eq(i).children().attr('href'); 
	var newURL = 'http://www.gamesradar.com'+href;
	getRatingFromPage(jsonObject, newURL, callback, options);
	return;
      } 
    }
    handleError(jsonObject, callback, 'could not find game on gamesradar', possibleChoices);
  });
}

//handle all the error cases
function handleError(jsonObject, callback, message, pc){ 
  jsonObject.result.gamesradar = {criticScore:0, url:message };
  callback(jsonObject); 
}

//get rating from page
function getRatingFromPage(jsonObject, url, callback, options){
  //requesting the url
  request(url, function(error, response, html){
    var $ = cheerio.load(html); // get the dom
    
    if(options == undefined) options = [];
    if(options == 'all') options = ['genre', 'cScore', 'name', 'availablePlatform', 'developer', 'rating', 'publisher', 'reasonForRating', 'rlsdate'];
    else{ options.push('cScore');  }

    var obj = getInformationObject($, options);
    
    //this is the json object that it will return
    jsonObject.result.gamesradar = { 'criticScore':obj.cScore,  'url':url}; 
    jsonObject.result.websites.push('gamesradar');
   
    //this is a list that represents the name in the response object that is corresponds with options
    for(var i = 0; i < options.length; i++){
      if(obj[options[i]] === undefined || options[i] === 'cScore') continue;
      if(jsonObject.result[options[i]] === undefined){//it is undefined meaning it needs to be a string
        jsonObject.result[options[i]] = obj[options[i]];
      }else if(typeof(jsonObject.result[options[i]]) === 'string') continue; // it is a string and already filled in, because its starting value is undefined and not an empty string
      else{ //it is a list
        jsonObject.result[options[i]] = jsonObject.result[options[i]].concat(obj[options[i]].replace(/\s*,\s*/g,',').split(','));
      }
      //if(typeof(obj[options[i]]) === 'string')
	//jsonObject.result[options[i]] = obj[options[i]];
      //else jsonObject.result[options[i]] = jsonObject.result[options[i]].concat(obj[options[i]]);
    }
        //adjust average score
    jsonObject.result.averageScore = jsonObject.result.averageScore + (+obj.cScore/5) + (+obj.cScore/5);
    callback(jsonObject);
  });
}

//gets the information object
function getInformationObject($, options){
  var obj = { };
/*    'cScore':'', 
    'name':'', 
    'availablePlatform':'',
    'developer':'',
    'genre':'',
    'publisher':'',
    'rlsdate':'',
    'rating':'',
    'reasonForRating':'',
  };*/
  
  var allData = $('.gr_content_section.clearfix').children().children();
  for(var i = 0; i < allData.length; i++){
    //get the title of the category
    var category = convertWebsiteCategoryToResponseCategory(allData.eq(i).children().eq(0).text());
    var value =  allData.eq(i).children().eq(1).text()
    if(value == undefined) continue;
    value = value.replace(/\s+/g, ' ').trim();
    obj[category] = value;
  }
  
  //get the name
  obj['name'] = $('.review_header').children().eq(1).text();
  if(obj['name'] !== undefined)
    obj['name'] = obj['name'].replace('super review', '').replace('review', '').trim();

  //fix the releasedate
  if(obj['rlsdate'] !== undefined){
    obj['rlsdate'] = obj['rlsdate'].split('-')[0].trim();
  }
  //fix the reason for rating and rating
  if(obj['rating'] !== undefined){
    obj['reasonForRating'] = obj['rating'];
    obj['rating'] = obj['rating'].split(':')[0].trim();
    obj['rating'] = convertRatingToShortForm(obj['rating']);
  }

  //convert the necessary things to a list
  
  //var convertToList = ['developer', 'genre', 'availablePlatform'];
  //for(var i = 0; i < convertToList.length; i++){
    //if(obj[convertToList[i]]=== ''){ obj[convertToList[i]] = []; continue }
    //obj[convertToList[i]] = obj[convertToList[i]].replace(/\s*,\s*/g, ',').trim();
    //obj[convertToList[i]] = obj[convertToList[i]].split(',');
  //}
   
  //get the score
  obj.cScore =  $('.review_stars').children().attr('content');
  if(obj.cScore === undefined) return '';
  else obj.cScore = obj.cScore.split(' ')[0];  

  var retObj = {};
  for(var i = 0; i < options.length; i++){
    if(obj[options[i]] === undefined) continue; // if it doesnt exit move on
    retObj[options[i]] = obj[options[i]];
    //retObj[options[i]] = obj[options[i]]($); //get the appropriate information
     
    if(typeof(retObj[options[i]]) === 'string')
      retObj[options[i]] = retObj[options[i]].replace(/\s+/g,' ').trim(); // reformat the data, remove blank spaces

  } 
  return retObj;
}


//--------------------------------------------------------------------------start search name----------------------------------------------------------------------------
// need to return the url as well
function searchForname(info, name, searchConsole, callback, options){
  if(searchConsole !== undefined){ 
    searchConsole = shortenPlatformname(searchConsole)
    if(searchConsole == undefined){ 
      callback(info);
      return; 
    }
    searchConsole = searchConsole.toLowerCase(); 
  }
  var url;
  if(searchConsole == undefined) 
    url = 'http://www.gamesradar.com/search/?q='+name+'&platform=all-platforms&content=reviews&order_by=best-match'; 
  else url = 'http://www.gamesradar.com/search/?q='+name+'&platform='+searchConsole.replace(/\s/g, '-')+'&content=reviews&order_by=best-match'; 

  name = name.replace(/\+/g,' ').trim().toLowerCase().replace(':',''); // replace the + in the name with a spacebar
  request(url, function(error, response, html){
    var $ = cheerio.load(html); // gets the jquery

    // go through all the results and find the correct game
    var results = $('.headline'); // updated
    var possibleChoices = [];
    for(var i = 0; i < results.length; i++){
      var curTitle = results.eq(i).text();
      curTitle = curTitle.replace(/(\s+|\n)/g, ' ').trim().toLowerCase();
      curTitle = curTitle.replace('super review', '');
      curTitle = curTitle.replace('review', '').trim().replace(':','');

      //checking if its for a game, and not a movie, TV, 
      var platform = results.eq(i).parent().children('.related_platforms').text();
      if(searchConsole !== undefined){
	//if the search console is defined and it is not equal to the current platform then just move on
	if(platform.length !== 0){ 
	  var pos = platform.trim().replace(/\s+\n\s+/g, ',').toLowerCase().split(',').indexOf(searchConsole.replace('-', ' ').toLowerCase());
	  if(pos === -1) continue;
	}
      }else if(!isGameReview(platform.replace(/\s+/g,''))) continue;

      //add it to the list
      possibleChoices.push(curTitle);
    }
    info.obj = info.obj.concat(possibleChoices);
    callback(info);
  });
}
//--------------------------------------------------------------------------done search name----------------------------------------------------------------------------


//--------------------------------------------------------------------------START HELPER FUnCTIOnS----------------------------------------------------------------------------

//is the thing a game review
function isGameReview(platforms){
  return !( platforms === 'TV' || platforms === 'Movie');
  //if(platforms === 'TV' || platforms === 'Movie') return false;
  //return true;
}

//shortens the platform name
function shortenPlatformname(platform){
  if(platform === undefined) return platform;
  //get rid of all whitespace
  platform = platform.toLowerCase().replace(/ /g, '').trim();
  
  //wiiu
  var data = {
    'xbox360':'Xbox-360', 
    'xboxone':'xbox-one', 
    'ps4':'PS4', 
    'playstation4':'PS4', 
    'playstation3':'PS3', 
    'ps3':'ps3',
    'playstationvita':'PSVita', 
    'psvita':'psvita',
    '3ds':'3DS', 
    'wiiu':'WII U', 
    'wii':'Wii'
  };
  return data[platform];
}

//convert the category on the website to the category that will be returned
function convertWebsiteCategoryToResponseCategory(websiteCategory){
  websiteCategory = websiteCategory.replace(/:/g, '').replace(/\s+/g, '').trim().toLowerCase();
  var responseCategory = { 
    'franchise':'name', 
    'availableplatforms':'availablePlatform',
    'developedby':'developer',
    'genre':'genre',
    'publishedby':'publisher',
    'releasedate':'rlsdate',
    'esrbrating':'rating',
    'reasonForRating':'',
  }[websiteCategory];
  return responseCategory;
}

//converts the long name to short form for example it will convert Teen to T
function convertRatingToShortForm(name){
  if(name === 'earlyChildhood') return 'EC';
  return name[0].toUpperCase();
}

//--------------------------------------------------------------------------End Of HELPER FUnCTIOnS----------------------------------------------------------------------------

module.exports.getRating = getRating;
module.exports.searchForname = searchForname;
