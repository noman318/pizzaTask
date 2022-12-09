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
app.get("/login", (req, res) => {
  res.render("login");
});
app.get("/register", (req, res) => {
  res.render("regis");
});
app.post("/postregis", (req, res) => {
  uploadSingle(req, res, (err) => {
    if (err) {
      res.render("regis", { error: err.message });
    } else {
      let { email, uname, password } = req.body;
      const hash = bcrypt.hashSync(password, saltRounds);
      userModel
        .create({
          email: email,
          username: uname,
          password: hash,
          image: req.file.filename,
          status: 0,
        })
        .then((data) => {
          let mailOptions = {
            from: "markjackman31820@gmail.com",
            to: email,
            subject: "Activation Account",
            template: "mail",
            context: {
              username: uname,
              id: data._id,
            },
          };
          transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
              console.log(err);
            } else {
              res.redirect("/login");
            }
          });
        })
        .catch((err) => {
          res.render("regis", { error: "User Already Registered" });
        });
    }
  });
});

app.listen(port, (err) => {
  if (err) {
    console.log(err);
  } else {
    console.log(`Server is running ${port}`);
  }
});
