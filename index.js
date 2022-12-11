const express = require("express");
const exphbs = require("express-handlebars");
const csurf = require("csurf");
const path = require("path");
const multer = require("multer");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const seceret = "noman";
const oneDay = 1000 * 60 * 60 * 24;
const sessions = require("express-session");
const nodemailer = require("nodemailer");
const hbs = require("nodemailer-express-handlebars");
const PORT = 8000;
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const userModel = require("./models/user");
const tokenModel = require("./models/token");
mongoose.set('strictQuery',true);

const saltRounds = 10;
let transporter = nodemailer.createTransport({
  service: "gmail",
  port: 587,
  secure: false,
  auth: {
    user: "markjackman31820@gmail.com",
    pass: "vworktlirikcethu",
  },
});
transporter.use(
  "compile",
  hbs({
    viewEngine: "nodemailer-express-handlebars",
    viewPath: "views/emailTemplates/",
  })
);
const app = express();

const connectToDb = mongoose.connect(
  "mongodb://localhost:27017/pizzaStore",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log(`Database connected sucessfully`);
    }
  }
);
app.use(
  sessions({
    secret: seceret,
    saveUninitialized: true,
    cookie: { maxAge: oneDay },
    resave: false,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// app.use(csrfMiddleware);
app.engine("handlebars", exphbs.engine());
app.set("view engine", "handlebars");
app.set("views", "./views");
app.use(express.static("uploads"));
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "/uploads"));
  },
  filename: function (req, file, cb) {
    fileExtension = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + Date.now() + fileExtension);
  },
});
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype == "image/png" || file.mimetype == "image/jpeg") {
      cb(null, true);
    } else {
      cb(null, false);
      cb(new Error("Only png and jpg formet allowed"));
    }
  },
});
var session;
app.get("/", (req, res) => {
  res.render("login");
});
const uploadSingle = upload.single("avatar");

const folderPath = __dirname + "/uploads";
app.get("/downloadsingle", (req, res) => {
  let username = req.session.username;
  if (username) {
    userModel.findOne({ username: username }, (err, data) => {
      if (err) {
      } else {
        res.download(folderPath + `/${data.image}`, (err) => {
          if (err) {
          }
        });
      }
    });
  } else {
    res.redirect("/login");
  }
});

app.post("/uploadfile", (req, res) => {
  uploadSingle(req, res, (err) => {
    if (err) {
      return res.status(400).send({ message: err.message });
    } else {
      return res.send(req.file);
    }
  });
});
app.get("/login", (req, res) => {
  let auth = req.query.msg ? true : false;
  if (auth) {
    return res.render("login", { error: "Invalid username or password" });
  } else {
    return res.render("login");
  }
});
app.post("/postlogin", (req, res) => {
  let { uname, password } = req.body;
  userModel.findOne({ username: uname }, (err, data) => {
    if (err) {
      return res.redirect("/login?msg=fail");
    } else if (data == null) {
      return res.redirect("/login?msg=fail");
    } else {
      if (bcrypt.compareSync(password, data.password)) {
        session = req.session;
        session.username = uname;
        console.log(req.session);
        return res.redirect("/welcome");
      } else {
        return res.redirect("/login?msg=fail");
      }
    }
  });
});
app.get("/regis", (req, res) => {
  res.render("regis");
});
app.get("/activateaccount/:id", (req, res) => {
  let id = req.params.id;
  userModel.findOne({ _id: id }, (err, data) => {
    if (err) {
      res.send("Some Thing Went Wrong");
    } else {
      userModel
        .updateOne({ _id: id }, { $set: { status: 1 } })
        .then((data1) => {
          res.render("activate", { username: data.username });
        })
        .catch((err) => {
          res.send("Some Thing Went Wrong");
        });
    }
  });
});
app.post("/postregis", (req, res) => {
  uploadSingle(req, res, (err) => {
    if (err) {
      res.render("regis", { error: err.message });
    } else {
      let { email, uname, password,phone,address } = req.body;
      console.log(req.body)
      const hash = bcrypt.hashSync(password, saltRounds);
      userModel
        .create({
          email: email,
          username: uname,
          password: hash,
          phone:phone,
          address:address,
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
app.get("/welcome", (req, res) => {
  //let username=req.cookies.username;
  let username = req.session.username;
  if (username) {
    userModel.findOne({ username: username }, (err, data) => {
      if (err) {
      } else {
        return res.render("welcome", { username: username, path: data.image });
      }
    });
  } else {
    return res.redirect("/login");
  }
});
app.get("/logout", (req, res) => {
  req.session.destroy();
  //res.clearCookie("username");
  return res.redirect("/login");
});
app.get("/resetpassword", (req, res) => {
  res.render("resetpassword");
});
app.get("/resetaccount", (req, res) => {
  res.render("resetaccount", { uid: req.query.id, token: req.query.token });
});
app.post("/postresetpassword", async (req, res) => {
  let { id, token, password } = req.body;

  let passToken = await tokenModel.findOne({ userId: id });
  if (!passToken) {
    return res.render("resetaccount", { errMsg: "Pass : Token Expire" });
  }

  const isValid = await bcrypt.compare(token, passToken.token);
  if (!isValid) {
    return res.render("resetaccount", { errMsg: "Pass 1 :Token Expire" });
  }
  const hash = await bcrypt.hash(password, Number(saltRounds));
  await userModel.updateOne(
    {
      _id: id,
    },
    { $set: { password: hash } },
    { new: true }
  );
  return res.render("resetaccount", { succMsg: "Password Changed" });
});
app.post("/postreset", async (req, res) => {
  let email = req.body.email;
  let user = await userModel.findOne({ email: email });
  if (user) {
    let token = await tokenModel.findOne({ userId: user._id });
    if (token) await tokenModel.deleteOne();
    let restToken = crypto.randomBytes(32).toString("hex");
    const hash = await bcrypt.hash(restToken, Number(saltRounds));
    await new tokenModel({
      userId: user._id,
      token: hash,
      createdAt: Date.now(),
    }).save();
    let mailOptions = {
      from: "markjackman31820@gmail.com",
      to: email,
      subject: "Reset Link",
      template: "resettemp",
      context: {
        token: restToken,
        id: user._id,
        username: user.uname,
      },
    };
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.log(err);
      } else {
        return res.render("resetpassword", {
          succMsg: "Reset Link send to your email",
        });
      }
    });
  } else {
    return res.render("resetpassword", { errMsg: "Email is not exists" });
  }
});
app.listen(PORT, (err) => {
  if (err) throw err;
  else {
    console.log(`Server work on ${PORT}`);
  }
});
