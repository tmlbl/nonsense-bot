var twitter = require("./twitter"),
    chan = require("./ingest_4chan");

//twitter.ingestTwitter("#blacklivesmatter");
chan.ingest4chan("pol");
twitter.createTweets();
