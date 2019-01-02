require('dotenv').config();


const axios = require('axios');
const parseString = require('xml2js').parseString;



const ShelfURL = 'https://www.goodreads.com/review/list/' + process.env.GOODREADS_USER_ID + '.xml';

axios.get(ShelfURL, {
    params: {
        key: process.env.GOODREADS_API_KEY, 
        shelf: 'read',
        per_page: '2',
        v: '2' 
    }
})
.then(function (response) {
  parseString(response.data, function (err, jsonResponse) {
      jsonResponse.GoodreadsResponse.reviews[0].review.forEach(review => {   
        // things to track: authors, title, date added, average rating
        // book image, book url? Look up additional information?
        // rating I gave it

        console.log(review.book[0].title);
        console.log(review.book[0].image_url);
        console.log(review.book[0].average_rating);
        console.log(review.book[0].authors[0].author[0].name); // add array parsing
        console.log(review.rating);
        console.log(review.date_added);


      });



      //console.log(JSON.stringify(jsonResponse.GoodreadsResponse.reviews, null, 2));
  });
  })
  .catch(function (error) {
    console.log(error);
  })
  .then(function () {
    // always executed, saving for later
  }); 
