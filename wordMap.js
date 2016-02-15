var fs = require("fs");

// Track most common neighbors of words for sentence generation

var db = {
  map: {},
  starters: []
};

var dbFile = "/tmp/nonsense.json";

// Load word maps from file
if (fs.existsSync(dbFile)) {
  console.log("Loading data...");
  db = JSON.parse(fs.readFileSync(dbFile));
  console.log("Loaded", Object.keys(db.map).length, "word trees");
}

// Save word map and starters on shutdown
process.on("SIGINT", function () {
  persist();
  process.exit();
});

// Remove noise from tweets
function lint(text) {
  var parts = text.split(" ");
  var keep = [];
  parts.forEach(function (w) {
    // Remove escaped characters
    if (w.indexOf("&") != -1) return;
    // Remove retweets
    if (w == "RT") return;
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
      add(words[i], db.starters);
      db.map[words[i]] = {
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
    if (Object.keys(db.map).indexOf(words[i]) == -1) {
      db.map[words[i]] = {
        next: []
      };
    }
    // Add neighbors
    if (words[i + 1]) {
      db.map[words[i]].next.push(words[i + 1]);
    }
  }
};

exports.tweet = function () {
  var char_limit = 90 + (50 * Math.random());
  var word = rand(db.starters);
  if (!word) return "";
  var tweet = word;
  var done = false;

  while (!done) {
    tweet += " ";
    word = rand(db.map[word].next);
    if (word == undefined || (tweet + word).length > char_limit) {
      break;
    }
    tweet += word;
    if (word[word.length - 1] == ".") break;
  }
  return tweet.replace("\n", " ");
}

function persist() {
  console.log("\nSaving data...");
  fs.writeFileSync(dbFile, JSON.stringify(db));
}

exports.save = persist;
