// 부트스트랩 등 vendors를 추가하기 위한 라우터

var express = require("express");
var vendorsRouter = express.Router();
var path = require("path");
const cors = require("cors");
vendorsRouter.use(cors());
vendorsRouter.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});
vendorsRouter.use(
  "/bootstrap",
  express.static(path.join(__dirname, "../node_modules/bootstrap/dist"))
);
vendorsRouter.use(
  "/jquery",
  express.static(path.join(__dirname, "../node_modules/jquery/dist"))
);
vendorsRouter.use(
  "/jqueryui",
  express.static(path.join(__dirname, "../node_modules/jqueryui"))
);

vendorsRouter.use(
  "/jquerytoast",
  express.static(
    path.join(__dirname, "../node_modules/jquery-toast-plugin/dist")
  )
);

vendorsRouter.use(
  "/bootstrap-input-spinner",
  express.static(
    path.join(__dirname, "../node_modules/bootstrap-input-spinner/src")
  )
);

vendorsRouter.use(
  "/fontawesome",
  express.static(
    path.join(__dirname, "../node_modules/@fortawesome/fontawesome-free/")
  )
);

vendorsRouter.use(
  "/faceapi",
  express.static(
    path.join(__dirname, "../node_modules/face-api.js/dist/")
  )
);

vendorsRouter.use(
  "/chartjs",
  express.static(
    path.join(__dirname, "../node_modules/chart.js/dist/")
  )
);

module.exports = vendorsRouter;
