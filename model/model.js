
//removed imdb because they dont have any gaming info
module.exports = [
//  require('./gamespot'),
//  require('./ign.js'),
//  require('./metacritic.js'),
  require('./gamesradar')
//  require('./imdb.js')
];

module.exports.websitenames = ['ign', 'gamespot', 'gamesradar', 'metacritic'];
module.exports.getWebsiteScraper = {
  'ign':require('./ign.js'),
  'gamespot':require('./gamespot.js'),
  'metacritic':require('./metacritic.js'),
  'gamesradar':require('./gamesradar.js')
}


