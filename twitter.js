var Twitter = require("twitter"),
    fs = require("fs"),
    wordMap = require("./wordMap");

var config = JSON.parse(fs.readFileSync("config.json"));
var client = new Twitter(config);
const POST_INTERVAL = 1000 * 60 * 60 // One hour

// Make an actual tweet
function tweet(text) {
  client.post("statuses/update", {status: text}, function (error, tweet, response) {
    if (!error) {
      console.log(tweet);
    } else {
      throw error[0].message;
    }
  });
}

module.exports.ingestTwitter = function (tag) {
  // Ingest words from incoming tweets
  client.stream("statuses/filter", {track: tag},  function (stream) {
    stream.on("data", function (tweet) {
      wordMap.train(tweet.text);
    });

    stream.on("error", function (error) {
      console.log(error);
    });
  });
}

module.exports.createTweets = function () {
  if (process.env.NODE_ENV == "prod") {
    setInterval(function () {
      tweet(wordMap.tweet());
    }, POST_INTERVAL);
  } else {
    setInterval(function () {
      console.log(wordMap.tweet());
    }, 1000);
  }
}
