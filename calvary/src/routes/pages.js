const router = require("express").Router();

// HTTPS로 리다이렉트
router.get("*", (req, res, next) => {
  if (req.secure) {
    // --- https
    next();
  } else {
    // -- http
    let to = "https://" + req.headers.host + req.url;
    return res.redirect("https://" + req.headers.host + req.url);
  }
});

router.get("/", function (req, res) {
  const user = req.session.user;
  console.log("/", user);
  if (user == null) {
    res.redirect("/login");
  } else {
    res.render("attendance", { user: user });
  }
});

router.get("/attendance", function (req, res) {
  const user = req.session.user;
  res.locals.user = user;
  console.log(user);
  if (user == null) {
    res.redirect("/login");
  }
  res.render("attendance");
});

router.get("/face", function (req, res) {
  const user = req.session.user;
  res.locals.user = user;
  console.log(user);
  if (user == null) {
    res.redirect("/login");
  }
  res.render("face");
});

router.get("/statistics", function (req, res) {
  const user = req.session.user;
  res.locals.user = user;
  console.log(user);
  if (user == null) {
    req.session.before = "/statistics";
    res.redirect("/login");
  }
  res.render("statistics");
});

router.get("/students", function (req, res) {
  const user = req.session.user;
  res.locals.user = user;
  if (user == null) {
    req.session.before = "/students";
    res.redirect("/login");
  }
  res.render("students");
});

router.get("/birth", function (req, res) {
  const user = req.session.user;
  res.locals.user = user;
  if (user == null) {
    req.session.before = "/birth";
    res.redirect("/login");
  }
  res.render("birth");
});

router.get("/media", function (req, res) {
  const user = req.session.user;
  res.locals.user = user;
  if (user == null) {
    req.session.before = "/media";
    res.redirect("/login");
  }
  res.render("media");
});

module.exports = router;
