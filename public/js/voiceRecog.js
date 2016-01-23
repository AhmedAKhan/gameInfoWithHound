

//HTML ELEMENTS FOR DISPLAYING RESPONSE AND INFO JSON's
var jsonElet = document.getElementById("responseJSON");
var infoElet = document.getElementById("infoJSON");


// all the consts
var BASE_URL = "localhost:8446"


//REQUEST INFO JSON
var requestInfo = {
  PartialTranscriptsDesired: true,
  ClientID: "lno-EUOsnuI2ouN476d2FA=="
};

function gotResponseFromHoundify(text){
  var parsedResult = text;

  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (xhttp.readyState == 4 && xhttp.status == 200) {
      console.log("responseText: " + xhttp.responseText);
      responsiveVoice.speak(parsedResult);
    }
  };
  xhttp.open("POST", BASE_URL+"/processText", true);
  xhttp.send();

}
function onResponseFun(response, info){
  if (response.AllResults && response.AllResults[0] !== undefined) {
    jsonElet.value = JSON.stringify(response, undefined, 2);
    jsonElet.parentNode.hidden = false;
    infoElet.value = JSON.stringify(info, undefined, 2);
    infoElet.parentNode.hidden = false;

    // call the server now
    gotResponseFromHoundify(response.AllResults[0].SpokenResponse)
  }
}

//INITIALIZE COMMON CONVERSATION OBJECT FOR STORING CONVERSATION STATE
var myConversation = new Hound.Conversation();


//INITIALIZE VOICE SEARCH OBJECT
var voiceSearch = new Hound.VoiceSearch({
  authenticationURI: "/voiceSearchAuth",
  conversation: myConversation,
  enableVAD: true,

  onTranscriptionUpdate: function(trObj) {
    var transcriptElt = document.getElementById("query");
    transcriptElt.value = trObj.PartialTranscript;
  },

  onResponse: onResponseFun,

  onAbort: function(info) {},

  onError: function(err, info) {
    jsonElet.parentNode.hidden = true;
    infoElet.value = JSON.stringify(info, undefined, 2);
    infoElet.parentNode.hidden = false;
    document.getElementById("voiceIcon").className = "unmute big icon";
  },

  onRecordingStarted: function() {
    document.getElementById("voiceIcon").className = "selected radio icon big red";
  },

  onRecordingStopped: function(recording) {
    document.getElementById("voiceIcon").className = "unmute big icon";
    document.getElementById("textSearchButton").disabled = false;
    document.getElementById("query").readOnly = false;
  },

  onAudioFrame: function(frame) {}
});

//START OR STOP VOICE SEARCH
function startStopVoiceSearch() {
  if (voiceSearch.isState("streaming")) {
    voiceSearch.stop();
  } else {
    voiceSearch.start(requestInfo);
    document.getElementById("voiceIcon").className = "loading circle notched icon big";
    document.getElementById("textSearchButton").disabled = true;
    document.getElementById("query").readOnly = true;
  }
}

//UPLOAD AUDIO FILE
function onFileUpload() {
  var fileElt = document.getElementById("file");
  var file = fileElt.files[0];
  if (!file) return;

  var reader = new FileReader();
  reader.onload = function(){
    var arrayBuffer = reader.result;
    voiceSearch.upload(arrayBuffer, requestInfo);
  };
  reader.readAsArrayBuffer(file);
}

//START TEXT SEARCH
function doTextSearch() {
  var query = document.getElementById('query').value;
  // textSearch.search(query, requestInfo);
}

