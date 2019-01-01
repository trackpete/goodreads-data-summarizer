require('dotenv').config();


const axios = require('axios');
const parseString = require('xml2js').parseString;



const ShelfURL = 'https://www.goodreads.com/review/list/' + process.env.GOODREADS_USER_ID + '.xml';

axios.get(ShelfURL, {
    params: {
        key: process.env.GOODREADS_API_KEY, 
        shelf: 'read',
        per_page: '10',
        v: '2' 
    }
})
.then(function (response) {
  parseString(response.data, function (err, jsonResponse) {
      jsonResponse.GoodreadsResponse.reviews.array.forEach(element => {
          
      });



      console.log(JSON.stringify(jsonResponse, null, 2));
  });
  })
  .catch(function (error) {
    console.log(error);
  })
  .then(function () {
    // always executed, saving for later
  }); 
