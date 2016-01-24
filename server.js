//dependencies
var express = require('express');
var fs = require('fs');
// var scraper = require('./infoController');
var processText = require('./processText');
// var http = require('http');


var request = require('request');
var cheerio = require('cheerio');
var model = require('./model/model.js');
var app = express();

//"hound" module contains both client-side ("Hound") and server-side ("HoundNode") parts of SDK
var hound = require('hound').HoundNode;

//parse arguments
var argv = require('minimist')(process.argv.slice(2));

//config file
var configFile = argv.config || 'config';
var config = require(__dirname + '/' + configFile);

//express app
var app = express();
var publicFolder = argv.public || 'public';
app.use(express.static(__dirname + '/' + publicFolder));


//authenticates voice search requests
app.get('/voiceSearchAuth', hound.createVoiceAuthHandler({
  clientId:  config.clientId,
  clientKey: config.clientKey
}));

//sends the request to Hound backend with authentication headers
app.get('/textSearchProxy', hound.createTextProxyHandler({
  clientId:  config.clientId,
  clientKey: config.clientKey
}));

app.post("/processText", function(req, res){
  console.log("got some input");
  var inputText = '';
  req.on("data", function(data){ inputText += data });
  req.on("end", function(){
    console.log("finished getting input - inputText:-" + inputText+"-");
    console.log("going to the process text")
    processText(inputText, res);
  });
});



//ssl credentials
// var privateKey = fs.readFileSync(config.sslKeyFile);
// var certificate = fs.readFileSync(config.sslCrtFile);
// var credentials = { key: privateKey, cert: certificate };

////https server
//var httpServer = http.createServer(app);
//var port = config.port || 8446;
//httpServer.listen(port, function() {
//  console.log("HTTP server running on port", port);
//  console.log("Open https://localhost:" + port, "in the browser to view the Web SDK demo");
//});

var port = config.port || 8446;
app.listen(port);
console.log("running server on port " + port);

