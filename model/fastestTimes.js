module.exports = {};


module.exports.getTimeForGame = function getTime(name){
  var i = 0;
  var time = $('ul').children().eq(i).text().match('\\(.*\\)')[0]
  var name = $('ul').children().eq(i).children().eq(0).text()
};






