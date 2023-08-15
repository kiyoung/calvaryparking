const api_login = require("express").Router();
var db = require("./db.js");

api_login.get("/login", function (req, res) {
  res.locals.before = req.session.before;
  res.render("login");
});

api_login.get("/logout", function (req, res) {
  req.session.destroy();
  res.redirect("login");
});

api_login.post("/login", (req, res) => {
  try {
    res.locals.before = req.session.before;
    var password = req.body.password;
    if (password === "calpark3101") {
      req.session.user = {
        login: true,
      };
      res.status(200);
      res.redirect("/search");
    } else {
      res.status(202);
      res.render("login", { message: "로그인 실패" });
    }
  } catch (e) {
    //세션 생성 실패.
    res.status(201);
    res.send();
  }
});

module.exports = api_login;
