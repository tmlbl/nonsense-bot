var request = require("request");
var htmlparser = require("htmlparser2");
var fs = require("fs");

const FETCH_INTERVAL = 1000 * 10;

function downloadImage(url) {
  console.log("Downloading", url);
  var r = request(url);
  r.on('response',  function (res) {
    var ctyp = res.headers["content-type"].split("/")[1];
    var filename = "images/" + res.headers["etag"].replace(/['"]+/g, '') + "." + ctyp;
    if (!fs.existsSync(filename)) {
      res.pipe(fs.createWriteStream(filename));
    }
  });
}

function parsePage(content) {
  var parser = new htmlparser.Parser({
    onopentag: function (name, attribs) {
      if (attribs.class && attribs.href && attribs.class == "fileThumb") {
        downloadImage("http:" + attribs.href);
      }
    },
    ontext: function (text) {

    },
    onclosetag: function (tagname) {

    }
  }, {decodeEntities: true});

  parser.write(content);
  parser.end();
}

function scrapePage(url) {
  console.log("Scraping", url);
  request.get(url, function (err, response, body) {
    if (err) throw err;
    parsePage(body);
  });
}

function getThreads(content) {
  var tlink = "";
  var tlinks = [];
  var parser = new htmlparser.Parser({
    onopentag: function (name, attribs) {
      if (attribs.class && attribs.class == "replylink") {
        // downloadImage("http:" + attribs.href);
        tlink = attribs.href;
      }
    },
    ontext: function (text) {
      if (tlink && text == "Reply") {
        tlinks.push(tlink);
        tlink = "";
      }
    },
    onclosetag: function (tagname) {

    }
  }, {decodeEntities: true});

  parser.write(content);
  parser.end();
  return tlinks;
}

function doThread(url, threads) {
  var t = threads.pop();
  if (t) {
    scrapePage(url + "/" + t);
  }
}

function scrapeBoard(board) {
  var url = "http://boards.4chan.org/" + board;
  request.get(url, function (err, res, body) {
    var threads = getThreads(body);
    doThread(url, threads);
    setInterval(function () {
      doThread(url, threads);
    }, 10000);
  });
}

scrapeBoard("gif");
