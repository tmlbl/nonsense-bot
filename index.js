var Twitter = require("twitter"),
    fs = require("fs"),
    wordMap = require("./wordMap");

var config = JSON.parse(fs.readFileSync("config.json"));
var client = new Twitter(config);
var SOURCE_TAG = "#" + config.tag;

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

// Ingest words from incoming tweets
client.stream("statuses/filter", {track: SOURCE_TAG},  function (stream) {
  stream.on("data", function (tweet) {
    wordMap.train(tweet.text);
  });

  stream.on("error", function (error) {
    console.log(error);
  });
});

setInterval(function () {
  console.log(wordMap.tweet());
}, 1000);
