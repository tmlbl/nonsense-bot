var twitter = require("./twitter"),
    chan = require("./4chan");

twitter.ingestTwitter("#blacklivesmatter");
chan.ingest4chan("pol");
twitter.createTweets();
