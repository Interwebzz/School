const say = require('say')
const MarkovChain = require('markovchain-generate')
const Twit = require('twit')


var async = require('async');
var whilst = require('async/whilst');

var express = require("express");
var app = express();

var fs = require('fs');
fs.unlinkSync('tweetlijst.txt');

function myWrite(data) {
  fs.appendFile('tweetlijst.txt', data, function (err) {
    if (err) { /* Do whatever is appropriate if append fails*/ }
  });
};

//aanmaken twitter instantie met de nodige waardes
var T = new Twit({
  consumer_key: '', //met eigen info invullen
  consumer_secret: '', //met eigen info invullen
  access_token: '', //met eigen info invullen
  access_token_secret: '', //met eigen info invullen
  // app_only_auth: true,
  timeout_ms: 60 * 1000, // optional HTTP request timeout to apply to all requests.
});


//tweets bron https://github.com/ttezel/twit/issues/338
var count = 0;
var tweets;
var max_id = -1;
var name = "Rosse_tijger";

//alle tweets ophalen van een bepaalde gebruiker zijn tijdlijn
T.get("statuses/user_timeline", {
  screen_name: name,
  count: 200 //Per 200 tweets ophalen
}, function (err, data, response) {
  console.log("Tweets from @" + name);
  printTweets(data);

  max_id = data[data.length - 1].id_str;
  async.whilst(function () {
      return max_id;
    }, function (callback) {
      T.get("statuses/user_timeline", {
          screen_name: name,
          count: 200, //Per 200 tweets ophalen
          max_id: max_id
        },
        function (err, data, response) {
          printTweets(data);
          if (data.length > 1) {
            max_id = data[data.length - 1].id_str;
          } else {
            max_id = 0;
          }
          callback();
        });
    },
    //indien alle tweets zijn opgehaald -> done + aantal tweets weergeven
    function (err) {
      console.log("done" + "\n AANTAL TWEETS: " + count);
    });

  //alle tweets op een nieuwe lijn in een txtbestand zetten
  function printTweets(data) {
    for (var i = 0; i < data.length; i++) {
      //In text file zetten
      myWrite("\n" + data[i].text);
      count++;
    }
  }
});

app.get("/", function (req, res) {

  //https://www.npmjs.com/package/markovchain-generate
  // For an empty chain, use an empty constructor.
  var chain = new MarkovChain()

  //https://stackoverflow.com/questions/12752622/require-file-as-string
  require.extensions[".txt"] = function (module, filename) {
    module.exports = fs.readFileSync(filename, "utf8");
  };

  // de tweet lijst in een markov chain steken
  var tweets = require("./tweetlijst.txt");
  chain.generateChain(tweets);

  //Random tweet genereren
  var fakeTweet = chain.generateString();

  //Ellen -> Belgisch
  say.speak(fakeTweet, "Ellen");

  res.sendfile("index.html");
  res.send('<p class="tekst">' + fakeTweet + '.</p>');

  Post random text on my wall

  //post faketweet op eigen twitter
  T.post('statuses/update', {
    status: fakeTweet
  }, function (err, data, response) {
    console.log(data)
  })

});

//server runnen
var port = process.env.PORT || 5000;
app.listen(port, function () {
  console.log("Listening on " + port);
});