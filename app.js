const express = require("express");
const app = express();
const expHbs = require("express-handlebars");
// const multer = require("multer");
// const mime = require("mime-types");
const port = 8000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.engine("handlebars", expHbs.engine());
app.set("view engine", "handlebars");
app.set("views", "./views");

app.get("/", (req, res) => {
  res.render("index");
});
app.listen(port, (err) => {
  if (err) {
    console.log(err);
  } else {
    console.log(`Server is running ${port}`);
  }
});
