const express = require("express");
app = express();
const cors = require("cors");
const fetch = require("node-fetch");
const imgData = require("./imgData");
const multer = require("multer");
const SearchTerm = require('./models/searchDictionary');
const mongoose = require("mongoose");


const siKey = process.env.DATA_GOV_API_KEY;
const database = process.env.SLIDESHOW_DATABASE_URL
mongoose.connect(database, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(cors());
app.use(multer().none());

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.post("/", (req, res) => {
  let numPics = 10;
  let imageArray = [];
  let startRow = 0;

  SearchTerm.findOne({ term: req.body.searchTerm }).then((search) => {
    if (!search) search = new SearchTerm({ term: req.body.searchTerm });
    if (search.si > numPics) startRow = getRandomInt(search.si - numPics - 1); // Grab a random starting row that won't go over the number of returned rows

    fetch(
      `https://api.si.edu/openaccess/api/v1.0/category/art_design/search?api_key=${siKey}&rows=${numPics}&start=${startRow}&q=${req.body.searchTerm}[online_media_type:%20Images]`
    )
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        
        search.si = data.response.rowCount; // Saves the total number of results for future searches
        let placeholder = "Unknown";
        for (let i = 0; i < Math.min(data.response.rowCount, numPics); i++) {
          let record = data.response.rows[i];

          let artist = placeholder; //Assign these two to placeholder here because I can't get to their indexed positions without a fatal error if the key doesn't exist
          let date = placeholder;
          let url;
          // Assign data
          if(record.content.descriptiveNonRepeating.online_media) url = record.content.descriptiveNonRepeating.online_media.media[0].content;
          let title = record.title || placeholder;
          if (record.content.indexedStructured.name)
            artist = record.content.indexedStructured.name[0];
          let source = record.unitCode || placeholder;
          let usage =
            record.content.descriptiveNonRepeating.metadata_usage.access ||
            placeholder;
          if (record.content.indexedStructured.date)
            date = record.content.indexedStructured.date[0];
          // try {
          let newImage = new imgData(url, title, artist, source, usage, date);
          imageArray.push(newImage);
          // } catch (e) {
          //   console.log(e)
          //   continue;
          // }
        }

        res.send(imageArray.filter((value) => value.url != undefined));
        search.save();
      });
  });
});

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}



app.listen(3000, () => {
  console.log("listening on port 3000");
});
