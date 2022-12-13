const mongoose = require("mongoose");
const pizzaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  size: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  },
});
module.exports = mongoose.model("pizza", pizzaSchema);
