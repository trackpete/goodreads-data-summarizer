const parseXML = require("xml2js").parseString;
const sqlite3 = require("sqlite3").verbose();
const async = require("async");

const parseHTML = require("node-html-parser").parse;

const db = new sqlite3.Database("cache/localdb.sqlite");
// So, in theory we should locally have:
//
// 1. The original shelf response
// 2. Each book API response from Goodreads
// 3. The resulting Amazon digital product page for most books
//
// We'll start by pulling in that original shelf/review response, then reading
// in the book API and Amazon digital product page stuff for the information we
// want to learn about the specific books.
//
// Stuff we probably want to extract from things:
//
// Review/Shelf API:
// * Book Title
// * Authors array
// * my rating
// * date_added
//
// GR Book API:
// * image_url
// * publication_year
// * num_pages
// * description (maybe for a word cloud or similar? teehee)
// * average_rating
// * series_works title
// * series_works primary_work_count
//
// Amazon:
// * rank in categories?
// * image_url that isn't crap?

db.run(
  "CREATE TABLE IF NOT EXISTS bookData (grid TEXT PRIMARY KEY, amz_asin TEXT, title TEXT, myRating TEXT, date_added INTEGER, image_url TEXT, publication_year TEXT, num_pages TEXT, description TEXT, average_rating TEXT, series_title TEXT, series_count TEXT)"
);

db.get(
  "SELECT rawData from responseData where name = 'shelfData'",
  (err, row) => {
    if (err) {
      throw err;
    }
    parseXML(row.rawData, function(err, shelfjs) {
      //console.log(JSON.stringify(shelfjs, null, 2));
      async.eachLimit(shelfjs.GoodreadsResponse.reviews[0].review, 1, function(
        review,
        callback
      ) {
        if (review.date_added[0].match(/ 2018$/)) {
          // Look up additional information from gr book api that's saved in db
          db.get(
            "SELECT rawData from responseData where name = ?",
            [review.book[0].id[0]._],
            (err, grbookdata) => {
              if (err) {
                throw err;
              }
              parseXML(grbookdata.rawData, function(err, grbookjs) {
                // Grab the AMZ data
                var thisBookImage =
                  grbookjs.GoodreadsResponse.book[0].image_url[0];
                var thisReviewDate = Date.parse(review.date_added[0]) / 1000;
                db.get(
                  "SELECT rawData from responseData where name = ?",
                  [grbookjs.GoodreadsResponse.book[0].kindle_asin[0]],
                  (err, amzbookhtml) => {
                    if (amzbookhtml) {
                      var amzHtml = parseHTML(amzbookhtml.rawData);
                      thisBookImage = amzHtml.querySelector(
                        "#ebooksImgBlkFront"
                      ).rawAttributes.src;
                      //console.log(thisBookImage);
                      // This should be a function
                      if (
                        typeof grbookjs.GoodreadsResponse.book[0]
                          .series_works[0].series_work === "object"
                      ) {
                        //console.log(JSON.stringify(grbookjs.GoodreadsResponse.book[0].series_works[0].series_work[0].series[0].title[0]));
                        var thisSeriesTitle =
                          grbookjs.GoodreadsResponse.book[0].series_works[0]
                            .series_work[0].series[0].title[0];
                        thisSeriesTitle = thisSeriesTitle.replace(
                          /^\s+|\s+$/g,
                          ""
                        );
                        var thisSeriesCount =
                          grbookjs.GoodreadsResponse.book[0].series_works[0]
                            .series_work[0].series[0].primary_work_count[0];
                      }
                      db.run(
                        "INSERT OR REPLACE INTO bookData (grid, title, amz_asin, myRating, date_added, image_url, publication_year, num_pages, description, average_rating, series_title, series_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                        [
                          review.book[0].id[0]._,
                          review.book[0].title[0],
                          grbookjs.GoodreadsResponse.book[0].kindle_asin[0],
                          review.rating[0],
                          thisReviewDate,
                          thisBookImage,
                          grbookjs.GoodreadsResponse.book[0].publication_year[0],
                          grbookjs.GoodreadsResponse.book[0].num_pages[0],
                          grbookjs.GoodreadsResponse.book[0].description[0],
                          grbookjs.GoodreadsResponse.book[0].average_rating[0],
                          thisSeriesTitle,
                          thisSeriesCount
                        ]
                      );
                    } else {
                      // This should be a function
                      if (
                        typeof grbookjs.GoodreadsResponse.book[0]
                          .series_works[0].series_work === "object"
                      ) {
                        //console.log(JSON.stringify(grbookjs.GoodreadsResponse.book[0].series_works[0].series_work[0].series[0].title[0]));
                        var thisSeriesTitle =
                          grbookjs.GoodreadsResponse.book[0].series_works[0]
                            .series_work[0].series[0].title[0];
                        thisSeriesTitle = thisSeriesTitle.replace(
                          /^\s+|\s+$/g,
                          ""
                        );
                        var thisSeriesCount =
                          grbookjs.GoodreadsResponse.book[0].series_works[0]
                            .series_work[0].series[0].primary_work_count[0];
                      }
                      db.run(
                        "INSERT OR REPLACE INTO bookData (grid, title, amz_asin, myRating, date_added, image_url, publication_year, num_pages, description, average_rating, series_title, series_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                        [
                          review.book[0].id[0]._,
                          review.book[0].title[0],
                          grbookjs.GoodreadsResponse.book[0].kindle_asin[0],
                          review.rating[0],
                          thisReviewDate,
                          thisBookImage,
                          grbookjs.GoodreadsResponse.book[0]
                            .publication_year[0],
                          grbookjs.GoodreadsResponse.book[0].num_pages[0],
                          grbookjs.GoodreadsResponse.book[0].description[0],
                          grbookjs.GoodreadsResponse.book[0].average_rating[0],
                          thisSeriesTitle,
                          thisSeriesCount
                        ]
                      );
                    }
                  }
                );
              });
            }
          );
        }
        callback();
      });
    });
  }
);
