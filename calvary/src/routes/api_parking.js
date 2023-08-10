const api_parking = require("express").Router();
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const utf8 = require("utf8");
var db = require("./db.js");

api.get("/getMembers", (req, res) => {
  var query = "select * from parking";
  db.connection.query(query, (error, rows) => {
    res.send(rows);
  });
});

module.exports = api_parking;
