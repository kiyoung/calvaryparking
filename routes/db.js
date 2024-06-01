var mysql = require("mysql");
const db = require("express").Router();

db.connection = mysql.createConnection({
    host: "db.calvary.gabia.io",
    user: "calvary",
    password: "rkfqhflryghl1!", //갈보리교회1!
    database: "dbcalvary",
    timezone: "Asia/Seoul",
});

db.connection.connect(function (error) {
    if (!!error) {
        console.log(error);
    } else {
        console.log("Connected!:)");
    }
});

module.exports = db;