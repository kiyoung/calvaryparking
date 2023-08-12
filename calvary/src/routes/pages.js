const router = require("express").Router();

// HTTPS로 리다이렉트
router.get("*", (req, res, next) => {
  next();
  /*if (req.secure) {
    // --- https
    next();
  } else {
    // -- http
    let to = "https://" + req.headers.host + req.url;
    return res.redirect("https://" + req.headers.host + req.url);
  }*/
});

router.get("/", function (req, res) {
  //const user = req.session.user;
  //console.log("/", user);
  //if (user == null) {
  //res.redirect("/login");
  //} else {
  res.render("search");
  //}
});

router.get("/search", function (req, res) {
  //const user = req.session.user;
  //res.locals.user = user;
  //console.log(user);
  //if (user == null) {
  //    res.redirect("/login");
  //}
  res.render("search");
});

module.exports = router;
