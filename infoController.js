module.exports = {

}


function jsonObjectGetReview(){
  return {
    result:{
      websites:[],
      genre: [],
      developer:[],
      availablePlatform:[],
      publisher:[],
      averageScore:0
    },
    possibleChoices:[] // if the game does not exist it gives you other possible choices
  };
}

//the get function
app.get('/api/v1/information', function(req, res){ //gets all the information
  review(res, req.query.game_name, req.query.console, 'all', req.query.websites);
});
app.get('/api/v1/reviews', function(req, res){//only gets the specified information
  review(res, req.query.game_name, req.query.console, req.query.options, req.query.websites);
});
function review(res, name, searchConsole, options, websitesToScrape){
  //if the name was not specified then send an error response
  if(name == undefined){ res.status(401).send({'message':'ERROR: next time pass in the name of the game in the variable game_name as a url parameter' }); return; }
  name = name.toLowerCase(); // convert it to lower case
  name = name.replace(/ /g, '+'); //replace the spaces with a plus

  //console
  if(searchConsole !== undefined) searchConsole = searchConsole.replace(/\+/g, ' ').toLowerCase();//replace the plus with a spacebar

  if(options != undefined){
    options = options.replace(/\+/g, ' ');//replace the pluses with spaces
    options = options.replace(/(\s*|\n)/g, ''); //remove empty spaces
    options = options.split(',');//split the string by commas
  }else options = [];

  var optionsObj = {};

  //make the empty json object so it can be accessed anywhere
  var jsonObject = jsonObjectGetReview(); // create an empty json object with the appropriate data

  //get all the data from the models
  if(websitesToScrape === undefined) websitesToScrape = model.websitenames;
  else websitesToScrape = websitesToScrape.split(',');
  jsonObject.num = websitesToScrape.length;  //this variable is used to count how many website to scrape, and will run the callback function after all of them are finished
  var allObj = getSiteOptions(options, websitesToScrape);
  var websitesExists = false;
  for(var i = 0; i < websitesToScrape.length; i++){
    var curOpts = allObj[websitesToScrape[i]];
    if(allObj[websitesToScrape[i]] !== undefined){
      websitesExists = true;
      model.getWebsiteScraper[websitesToScrape[i]].getRating(jsonObject, name, searchConsole, reviewCallback(res, options), curOpts);
    }else jsonObject.num -= 1;
  }
  if(websitesExists === false) res.status(200).send({ message:'please enter a valid console next time' });
  //the rest will be called in the callback function
}

//this function will take in a list of options the user wants
function getSiteOptions(options, websites){
  //if(options === [])
  if(websites.length > 1){
    return {
      'ign':[ 'name', 'genre' ],
      'metacritic':['genre', 'cScore', 'uScore', 'name', 'platform', 'thumbnail', 'summary', 'developer', 'rating', 'publisher', 'rlsdate'],
      'gamesradar':['genre', 'name', 'availablePlatform', 'developer', 'rating', 'publisher', 'reasonForRating'],
      'gamespot':[]
    }
  }
  //if it does not want all
  var obj = {};
  obj.ign = 'all';
  obj.metacritic = 'all';
  obj.gamesradar = 'all';
  obj.gamespot = 'all';//[];
  return obj;
}
function reviewCallback(res, options){
  return function(jsonObject){
    //if the other functions are not done yet then just end the function
    if(jsonObject.num > 1){
      jsonObject.num = jsonObject.num-1;
      return;
    }
    if(0 == jsonObject.result.websites.length){
      var responseObj = { 'message':'result not found', possibleChoices:jsonObject.possibleChoices };
      if(jsonObject.name != undefined) responseObj.name = jsonObject.name;
      res.status(200).send(responseObj);
      return;
    }

    //calculate the average score
    jsonObject.result.averageScore = (Math.round(jsonObject.result.averageScore * 100000)/1000)/(jsonObject.result.websites.length*2);

    jsonObject.result.genre = arrayUnique(jsonObject.result.genre);
    jsonObject.result.developer = arrayUnique(jsonObject.result.developer);
    jsonObject.result.publisher = arrayUnique(jsonObject.result.publisher);
    jsonObject.result.averageScore = Math.round(jsonObject.result.averageScore * 100) / 100; //round it to 2 decimal places

    //return the json object since now we know the other three functions are done
    delete jsonObject.num;
    delete jsonObject.err;
    delete jsonObject.possibleChoices;
    res.status(200).send(jsonObject)
  }//end function
}

app.get('/api/v1/images', function(req, res){

});



app.get('/api/v1/trailer', function(req, res){

});



app.get('/api/v1/search/', function(req, res){
  var name = req.query.game_name;
  var searchConsole = req.query.console;

  if(name === undefined){ res.status(401).send({'message':'ERROR: next time pass in the name of the game in the variable game_name as a url parameter' }); return; }
  name = name.toLowerCase(); // convert it to lower case
  name = name.replace(/ /g, '+'); //replace the spaces with a plus

  //console
  if(searchConsole !== undefined) searchConsole= searchConsole.replace(/\+/g, ' ').toLowerCase();//replace the plus with a spacebar
  var numWebsitesToScrape = model.websitenames.length;
  var websitesToScrape = model.websitenames;
  var obj = [];
  var info = {'obj':obj, 'numWebsitesToScrape':numWebsitesToScrape};
  for(var i = 0; i < websitesToScrape.length; i++){
    //calls all the websites
    model.getWebsiteScraper[websitesToScrape[i]].searchForname(info, name, searchConsole, searchCallback(res));
  }
});
function searchCallback(res){
  return function(info){
     //if the other functions are not done yet then just end the function
    if( info.numWebsitesToScrape > 1){
      info.numWebsitesToScrape= info.numWebsitesToScrape- 1;
      return;
    }

    info.obj = arrayUnique(info.obj);
    res.status(200).send({ 'result':info.obj } );
  }
}

//------------------------------------------- Helper Functions ---------------------------------------------------------

//removes duplicates in an array
function arrayUnique(array) {
  var a = array.concat();
  for(var i=0; i<a.length; ++i) {
    for(var j=i+1; j<a.length; ++j) {
      if(a[i] === a[j])
       	a.splice(j--, 1);
    }
  }

  return a;
};


//------------------------------------------- end of HELPER FUnctions --------------------------------------------------------


