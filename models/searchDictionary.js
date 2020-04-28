const mongoose = require("mongoose");


const searchTermSchema = new mongoose.Schema({
  term: String,
  si: Number
});

const SearchTerm = mongoose.model("SearchTerm", searchTermSchema);

module.exports = SearchTerm;
