var request = require("request");
var htmlparser = require("htmlparser2");
var wordMap = require("./wordMap");

const FETCH_INTERVAL = 1000 * 10;

function parsePage(content) {
  var in_post = false,
      in_datetime = false,
      capture = {
        text: "",
        utc: 0
      },
      captures = [];

  var parser = new htmlparser.Parser({
    onopentag: function (name, attribs) {
      if (attribs.class && attribs.class.indexOf("postMessage") != -1) {
        in_post = true;
      }
      if (attribs.class && attribs.class == "dateTime") {
        capture.utc = new Date(parseInt(attribs["data-utc"]));
      }
    },
    ontext: function (text) {
      if (in_post && isNaN(text)) {
        capture.text += text.replace(/>/g, "");
      }
    },
    onclosetag: function (tagname) {
      if (in_post && tagname == "blockquote") {
        in_post = false;
        captures.push(capture);
        capture = {
          text: "",
          utc: 0
        };
      }
    }
  }, {decodeEntities: true});
  parser.write(content);
  captures.forEach(function (c) {
    wordMap.train(c.text);
  });
  parser.end();
}

function getandtrain(board) {
  request.get("http://4chan.org/" + board, function (err, response, body) {
    parsePage(body);
  });
}

module.exports.ingest4chan = function (board) {
  getandtrain(board);
  setInterval(function () {
    getandtrain(board);
  }, FETCH_INTERVAL);
}
