// 클라이언트

const http = require("http");
const https = require("https");
const express = require("express");
const fs = require("fs");
const cors = require("cors");
var path = require("path");
const bodyparser = require("body-parser");
const session = require("express-session");
const MemoryStore = require("memorystore")(session);

//const privateKey = fs.readFileSync("/etc/letsencrypt/live/calcho.org-0002/privkey.pem");
//const certificate = fs.readFileSync("/etc/letsencrypt/live/calcho.org-0002/cert.pem");
//const ca = fs.readFileSync("/etc/letsencrypt/live/calcho.org-0002/chain.pem");
//const credentials = { key: privateKey, cert: certificate, ca: ca };

let corsOptions = {
  origin: "*",
  credentials: true,
};

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Session 설정
const maxAge = 1000 * 60 * 60 * 24;
const sessionObj = {
  secret: "calvaryparking15091oijfwlkjse2",
  resave: false,
  saveUninitialized: true,
  store: new MemoryStore({ checkPeriod: maxAge }),
  cookie: {
    maxAge: maxAge,
  },
};
app.use(session(sessionObj));

//cors 설정
app.use(cors(corsOptions));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

//파비콘 제거
function ignoreFavicon(req, res, next) {
  if (req.originalUrl.includes("favicon.ico")) {
    res.status(204).end();
  }
  next();
}
app.use(ignoreFavicon);

//public 폴더 설정
app.use("/.well-known", express.static(__dirname + "/.well-known"));
app.use("/public", express.static(__dirname + "/public"));
app.use("/src/upload", express.static(__dirname + "/upload"));

//EJS 엔진
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");

//vendors 라우터
//bootstrap, jquery, etc.
var vendorsRouter = require("./routes/vendors.js");
app.use("/vendors", vendorsRouter);

//라우터 includes
const routes = require("./routes/pages.js");
const api = require("./routes/api.js");
const api_login = require("./routes/api_login.js");
const db = require("./routes/db.js");
const api_parking = require("./routes/api_parking.js");

app.use(db);
app.use(routes);
app.use(api);
app.use(api_parking);
app.use(api_login);

// DB Connection 유지.
setInterval(function () {
  db.connection.query("SELECT 1");
}, 5000);

//Create Server
const httpServer = http.createServer(app);
//const httpsServer = https.createServer(credentials, app);

const handleListen = () => console.log(`Listening on http://127.0.0.1:8080`);
httpServer.listen(8080, handleListen);
//https.createServer(credentials, app).listen(443);
