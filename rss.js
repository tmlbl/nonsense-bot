var feed = require("feed-read");
var db = require("./wordMap");
var async = require("async");

function ingest(feedUrl) {
  console.log("Loading", feedUrl, "...");
  feed(feedUrl, function (err, articles) {
    if (err) {
      return console.error("Error getting feed", feedUrl, ": ", err.message);
    }
    async.forEach(articles, function (art, next) {
      var content = unescape(art.content.replace(/(<([^>]+)>)/ig, ""));
      db.train(content);
      next();
    }, db.save);
  });
}

ingest("http://www.forbes.com/technology/index.xml");
ingest("http://feeds.venturebeat.com/VentureBeat");

exports.ingest = ingest;
