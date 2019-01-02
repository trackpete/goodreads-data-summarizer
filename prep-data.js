require("dotenv").config();

const axios = require("axios");
const axiosRetry = require('axios-retry');
axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });
const parseString = require("xml2js").parseString;
const sqlite3 = require("sqlite3").verbose();
const async = require("async");

const db = new sqlite3.Database("cache/localdb.sqlite");
const ShelfURL =
  "https://www.goodreads.com/review/list/" +
  process.env.GOODREADS_USER_ID +
  ".xml";

// Here's a basic overview of what we're doing here:
//
// 1. Get reviews for the env specified shelf ID from the goodreads API
//    a. Store a copy of the full shelf response in XML and JSON in sqlite
//    b. Extract the GR ID from each item in the shelf to do #2
// 2. For each book on the shelf, with a delay, hit the GR Book API for that book
//    a. Store a copy of the book API response in XML and JSON
//    b. Extract the ASIN from the book API response to do #3
// 3. Make an Amazon request to get the web page for this ASIN
//    a. Save an HTML copy in the db
//
// This overall populates or re-populates the database with a bunch of rawish data.
// A separate script will then process the rawish data from the DB so I don't have to
// keep calling out to APIs and web pages while tweaking it. From a practical end/final
// use perspective, this is more complicated than it needs to be but it's much more
// convenient from a dev perspective.
//
// (it may be worth noting this isn't intended to store data in a way to track updates,
// only fetch deltas, etc. - it's gonna be run very rarely so just builds everything)

db.run(
  "CREATE TABLE IF NOT EXISTS responseData (name TEXT PRIMARY KEY, source TEXT, rawData TEXT, jsData TEXT, altName TEXT)"
);
db.run(
  "CREATE TABLE IF NOT EXISTS missingASIN (gid TEXT PRIMARY KEY, url TEXT)"
);

axios
  .get(ShelfURL, {
    params: {
      key: process.env.GOODREADS_API_KEY,
      shelf: "read",
      per_page: "200",
      v: "2"
    }
  })
  .then(function(response) {
    // convert from XML to JS
    parseString(response.data, function(err, jsonResponse) {
      db.run(
        "INSERT OR REPLACE INTO responseData (name, source, rawData, jsData) VALUES (?, ?, ?, ?)",
        [
          "shelfData",
          "gr_shelf_api",
          response.data,
          JSON.stringify(jsonResponse)
        ]
      );
      
      // need this to be synchronous to avoid spamming the GR API
      //jsonResponse.GoodreadsResponse.reviews[0].review.forEach(review => {
      async.eachLimit(jsonResponse.GoodreadsResponse.reviews[0].review, 1, function(review, callback) {
        // Get goodreads ID to send to API for lookup
        var thisGID = review.book[0].id[0]._;
        var thisBookURL =
          "https://www.goodreads.com/book/show/" + thisGID + ".xml";
        delayedGoodreadsBookLookup(thisBookURL, thisGID, callback);
      });
      //console.log(JSON.stringify(jsonResponse.GoodreadsResponse.reviews, null, 2));
    });
  })
  .catch(function(error) {
    //console.log(error);
    console.log("!! There was an error fetching the Shelf URL!");
  })
  .then(function() {
    // eh nothing here right now
  });

async function delayedGoodreadsBookLookup(thisBookURL, thisGID, callback) {
  console.log(" *BOOKAPI:* Will fetch information shortly for:", thisBookURL);
  await delay(2000);
  axios
    .get(thisBookURL, {
      params: {
        key: process.env.GOODREADS_API_KEY
      }
    })
    .then(function(response) {
      parseString(response.data, function(err, jsonResponse) {
        var thisASIN = jsonResponse.GoodreadsResponse.book[0].kindle_asin[0];
        db.run(
          "INSERT OR REPLACE INTO responseData (name, source, rawData, jsData, altName) VALUES (?, ?, ?, ?, ?)",
          [thisGID, "gr_book_api", response.data, JSON.stringify(jsonResponse), thisASIN]
        );
        
        if (typeof thisASIN !== 'undefined' && thisASIN) {
          console.log("          > Kindle ASIN:", thisASIN);
        var thisAmazonURL = "https://www.amazon.com/dp/" + thisASIN;        
        axios.get(thisAmazonURL, {})
        .then(function(response) {
            console.log("          > Saving", thisAmazonURL);
            //console.log(response.data);
            db.run(
                "INSERT OR REPLACE INTO responseData (name, source, rawData, altName) VALUES (?, ?, ?, ?)",
                [thisASIN, "amz_dp", response.data, thisGID]
              );            

        }).catch(function(error) {
          console.log("!! There was an error fetching the amazon URL!");
          //console.log(error);
       }).then(function() {
        callback();
      });
    } else {
      console.log("!! ERROR - ASIN undefined!");
      db.run("INSERT OR REPLACE INTO missingASIN (gid, url) VALUES (?, ?)", [thisGID, thisBookURL]);
      callback();
    }



      });
    })
    .catch(function(error) {
      console.log("!! There was an error fetching the book api data from gr!");
      //console.log(error);
    });

}

async function delay(msec) {
  return new Promise(resolve => setTimeout(resolve, msec));
}
