var fs = require("fs");

// Track most common neighbors of words for sentence generation

var wordMap = {};
var starters = [];

var mapFile = "/tmp/map.json";
var startFile = "/tmp/starters.json";

// Load word maps from file
if (fs.existsSync(mapFile)) {
  console.log("Loading data files...");
  wordMap = JSON.parse(fs.readFileSync(mapFile));
  starters = JSON.parse(fs.readFileSync(startFile));
  console.log("Loaded", Object.keys(wordMap).length, "word trees");
}

// Save word map and starters on shutdown
process.on("SIGINT", function () {
  console.log("\nSaving in-memory databases...");
  fs.writeFileSync(mapFile, JSON.stringify(wordMap));
  fs.writeFileSync(startFile, JSON.stringify(starters));
  process.exit();
});

// Remove noise from tweets
function lint(text) {
  var parts = text.split(" ");
  var keep = [];
  parts.forEach(function (w) {
    // Remove mentions
    // if (w[0] == "@") return;
    // Remove retweets
    if (w == "RT") return;
    // Remove URLs
    // if (w.indexOf("http") != -1) return;

    keep.push(w);
  });
  return keep.join(" ");
}

// My own tokenizer
function tokenize(text) {
  return text.replace("\n", " ").split(" ");
}

// Random element from the given array
function rand(arr) {
  return arr[Math.floor(Math.random()*arr.length)];
}

// Add element if not already present
function add(el, arr) {
  var found = false;
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] == el) {
      found = true;
    }
  }
  if (!found) arr.push(el);
}

function getStartWord(text) {
  var words = tokenize(text);
  for (var i = 0; i < words.length; i++) {
    if (words[i][0] != "@" && words[i] != "RT") {
      add(words[i], starters);
      wordMap[words[i]] = {
        next: []
      };
      break;
    }
  }
}

exports.train = function (text) {
  // console.log("Training text:", text);
  var words = tokenize(lint(text));
  if (words.length == 0) return;
  getStartWord(text);

  for (var i = 0; i <= words.length; i++) {
    // Check if word is in the map
    if (Object.keys(wordMap).indexOf(words[i]) == -1) {
      wordMap[words[i]] = {
        next: []
      };
    }
    // Add neighbors
    if (words[i + 1]) {
      wordMap[words[i]].next.push(words[i + 1]);
    }
  }
};

exports.tweet = function () {
  var word = rand(starters);
  if (!word) return "";
  var tweet = word;
  var done = false;

  while (!done) {
    tweet += " ";
    word = rand(wordMap[word].next);
    if (word == undefined || (tweet + word).length > 140) {
      break;
    }
    tweet += word;
  }
  return tweet.replace("\n", " ");
}
