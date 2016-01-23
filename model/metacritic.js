//dependencies
var request = require('request');
var cheerio = require('cheerio');
var superagentRequest = require('superagent');

function getRatingFromSuperagent(jsonObject, name, searchConsole, callback, options){ 
  var url = 'http://www.metacritic.com/search/game/'+name+'/results'; // the url it will search 
  var name = name.replace(/\+/g,' ').trim().replace(':',''); // replace the + in the name with a spacebar

  if(searchConsole !== undefined){ 
    searchConsole = shortenPlatformname(searchConsole)
    if(searchConsole == undefined){ handleError(jsonObject, callback, 'can not find console in metacritic'); return; }
    searchConsole = searchConsole.toLowerCase(); 
  }
  
  superagentRequest
  .get(url)
  .end(function(req2, res2){
    var $ = cheerio.load(res2.text);
     
    // go through all the results and find the correct game
    var results = $('.product_title');
    var possibleChoices = [];

    for(var i = 0; i < results.length; i++){
      var curTitle = $('.product_title').eq(i).children().text();
      curTitle = curTitle.replace(/  |\n/g,' ').trim().toLowerCase().replace(':', '');
      
      var consolename = $('.platform').eq(i).text().toLowerCase();
      possibleChoices.push(curTitle + ' ' + consolename);//add the possible choinces to the current title

      //found the correct name
      if(curTitle === name){        
	//if the console is not undefined then check if it is equal to what we want
	if(searchConsole !== undefined){
	  //check if it is equal to what we want
	  var platform = $('.platform').eq(i).text().toLowerCase();
	  if(platform !== searchConsole){
	    continue;
	  }
	}

	var href = results.eq(i).children().attr('href'); 
	var newURL = 'http://www.metacritic.com'+href;
	getRatingFromPageFromSuperagent(jsonObject, newURL, callback, options);
	return;
      }      
   }
    handleError(jsonObject, callback, 'could not find game on metacritic', possibleChoices);
  });
}

function handleError(jsonObject, callback, message, pc){ 
  //if(jsonObject.possibleChoices == undefined) jsonObject.possibleChoices = [];
  //for(var i = 0; i < pc.length; i++){
  //  jsonObject.possibleChoices.push(pc[i]);
  //}
  jsonObject.result.metcritic = { userScore:0, criticScore:0, url:message };
  callback(jsonObject); 
}

function getInformationObject($, options){
  var obj = {}; 
  obj.cScore = function($){ return $('.metascore_w').first().children('span').text(); };//get the critic score
  obj.uScore = function($){ return $('.metascore_w').eq(1).text(); }; // get the user score
  obj.name = function($){ return $('.product_title').first().children().children().first().text();};
  obj.platform = function($){ return $('.product_title').first().children().children().eq(1).text();};
  obj.thumbnail = function($){ return $('.product_image').first().children().attr('src')};
 
  //not used yet
  //obj.summary = function($){ return $('.blurb_expanded').text()};
  
  obj.developer = function($){ return $('.developer.summary_detail').children('.data').text(); };
  obj.genre = function($){ return $('.summary_detail.product_genre').children('.data').text()};
  obj.rating = function($){ return $('.summary_detail.product_rating').children('.data').text()};
  obj.publisher = function($){ return $('.summary_detail.publisher').children('.data').children().text()};
  obj.rlsdate = function($){ 
    return $('.summary_detail.release_data').children('.data').text().replace(',', '').replace('  ', ' 0');
  };
  
  var retObj = {};
  //reformat the date appropriately by removing the new line and all the white space
  for(var i = 0; i < options.length; i++){
    if(obj[options[i]] == undefined) continue;
    retObj[options[i]] = obj[options[i]]($);
    retObj[options[i]] = retObj[options[i]].replace(/\s+/g,' ').replace(/\s*,\s*/g,',').trim();
    //if(options[i] === 'developer') retObj[options[i]] = retObj[options[i]].split(',');
  }
  return retObj;
}

function getRatingFromPageFromSuperagent(jsonObject, url, callback, options){
   superagentRequest
   .get(url)
   .end(function(req2, res2){
     getRatingFromPageFromHtml(jsonObject, res2.text, callback, options, url);
   });
}
function getRatingFromPageFromHtml(jsonObject, html, callback, options, url){
  var $ = cheerio.load(html); // get the dom
  //get the apropriate information
  //var params = ['cScore', 'uScore', 'name', 'platform', 'thumbnail', 'summary', 'developer', 'genres', 'rating', 'publisher', 'rlsdate'];
  if(options == undefined) options = [];
  if(options == 'all') options = ['genre', 'cScore', 'uScore', 'name', 'platform', 'thumbnail', 'summary', 'developer', 'rating', 'publisher', 'rlsdate'];
  else{ options.push('cScore'); options.push('uScore'); }
  
  var obj = getInformationObject($, options);
 
  //this is the json object that it will return
  jsonObject.result.metacritic = { 'criticScore':obj.cScore, 'userScore':obj.uScore, 'url':url}; 
  jsonObject.result.websites.push('metacritic');

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
  jsonObject.result.averageScore = jsonObject.result.averageScore + (+obj.cScore/100) + (+obj.uScore/10);

  callback(jsonObject);
}





//------------------------------------------- start of search games ---------------------------------------------------------

function  searchForname(info, name, searchConsole, callback){
  var url = 'http://www.metacritic.com/search/game/'+name+'/results'; // the url it will search 
  var name = name.replace(/\+/g,' ').trim().replace(':',''); // replace the + in the name with a spacebar

  if(searchConsole !== undefined){ 
    searchConsole = shortenPlatformname(searchConsole)
    if(searchConsole == undefined){ callback(info); return; }
    searchConsole = searchConsole.toLowerCase(); 
  }
  
  superagentRequest
  .get(url)
  .end(function(req2, res2){
    var $ = cheerio.load(res2.text);
     
    // go through all the results and find the correct game
    var results = $('.product_title');
    var possibleChoices = [];

    for(var i = 0; i < results.length; i++){
      var curTitle = $('.product_title').eq(i).children().text();
      curTitle = curTitle.replace(/  |\n/g,' ').trim().toLowerCase().replace(':', '');
      
      var consolename = $('.platform').eq(i).text().toLowerCase();

      //if the console is not undefined then check if it is equal to what we want
      if(searchConsole !== undefined){
	//check if it is equal to what we want
	var platform = $('.platform').eq(i).text().toLowerCase();
	if(platform !== searchConsole) continue;
	possibleChoices.push(curTitle);// + ' ' + consolename);//add the possible choinces to the current title
      }

      possibleChoices.push(curTitle);// + ' ' + consolename);//add the possible choinces to the current title
    }//end of for loop
    info.obj = info.obj.concat(possibleChoices);
    callback(info);
  });
}
//------------------------------------------- end of the search games ---------------------------------------------------------





//--------------------------------------------- Start helper functions------------------------------------------------------

//shortens the platform name
function shortenPlatformname(platform){
  if(platform === undefined) return platform;
  //get rid of all whitespace
  platform = platform.toLowerCase().replace(/ /g, '').trim();
  //if(platform.length <= 4) return platform;
  
  //wiiu
  var data = {
    'xbox360':'X360',
    'xboxone':'XONE',
    'ps4':'PS4',
    'playstation4':'PS4',
    'playstation3':'PS3',
    'ps3':'ps3',
    'playstationvita':'VITA',
    'psvita':'VITA',
    '3ds':'3DS',
    'wiiu':'WIIU',
    'wii':'Wii'
  }
  return data[platform];
}

//--------------------------------------------- end helper functions ------------------------------------------------------

//module.exports.getRating = getRating;
module.exports.getRating = getRatingFromSuperagent;
module.exports.searchForname = searchForname;

