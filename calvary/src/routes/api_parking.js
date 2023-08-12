const api_parking = require("express").Router();
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const utf8 = require("utf8");
var db = require("./db.js");
var CryptoJS = require("crypto-js");
var SHA256 = require("crypto-js/sha256");
var Base64 = require("crypto-js/enc-base64");
const request = require("request");

api_parking.post("/sendmessage", async (req, res) => {
  const date = Date.now().toString();
  const uri = "ncp:kkobizmsg:kr:3109616:calvary"; //알림톡 프로젝트에서 표시되는 서비스 ID
  const accessKey = "RpaBaxO9zsVB4zJpiabI"; //API ACESS KEY
  const secretKey = "07YrxxMP7tDNxatqHgnC75yupr2xqaeew0MTfW4Z"; //API SECRET KEY
  const method = "POST";
  const space = " ";
  const newLine = "\n";
  const url = `https://sens.apigw.ntruss.com/alimtalk/v2/services/${uri}/messages`;
  const url2 = `/alimtalk/v2/services/${uri}/messages`;

  var name = req.body.name;
  var carnumber = req.body.carnumber;
  var receiver = req.body.cellphone;
  receiver = receiver.replace(/-/g, "");

  console.log(name, carnumber, receiver);
  if (carnumber === "" || carnumber === undefined) {
    return;
  }
  if (receiver === "" || receiver === undefined) {
    return;
  }

  const hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, secretKey);

  hmac.update(method);
  hmac.update(space);
  hmac.update(url2);
  hmac.update(newLine);
  hmac.update(date);
  hmac.update(newLine);
  hmac.update(accessKey);

  const hash = hmac.finalize();
  const signature = hash.toString(CryptoJS.enc.Base64);
  var response = "";
  await request(
    {
      method: method,
      json: true,
      uri: url,
      headers: {
        "Content-type": "application/json; charset=utf-8",
        "x-ncp-apigw-timestamp": date,
        "x-ncp-iam-access-key": accessKey,
        "x-ncp-apigw-signature-v2": signature,
      },
      body: {
        plusFriendId: "@merecalvary", //카카오톡 채널 이름
        templateCode: "moveyourcar", //승인된 템플릿의 템플릿 코드
        messages: [
          {
            to: receiver,
            content: `안녕하세요. ${name} 성도님\n갈보리 차량봉사회 입니다. \n${carnumber} 차량으로 인해 다른 차량의 주차와 운행이 어려우니 다른 곳으로 이동 주차해주시기 바랍니다.\n\n감사합니다.`,
            buttons: [
              {
                type: "MD",
                name: "확인했습니다.",
              },
            ],
          },
        ],
      },
    },
    function (err, res, html) {
      response = res;
    }
  );
  res.send(response);
});

api_parking.post("/search", (req, res) => {
  var digits = req.body.digits;
  var query = `select * from parking_members where car_number_4digit = '${digits}'`;
  console.log(query);
  db.connection.query(query, (error, rows) => {
    res.send(rows);
  });
});

module.exports = api_parking;