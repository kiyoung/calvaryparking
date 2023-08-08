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

api_login.post("/getTeacherInfo", (req, res) => {
  var id = req.body.id;
  res.status(200);
  var query = `select * from kakaoteachermap where kakaoid='${id}'`;
  db.connection.query(query, (error, rows) => {
    console.log(error);
    if (error){
      res.send(undefined);  
    }
    else{
      res.send(rows);
    }
  });
});

function formatPhoneNumber(phoneNumber) {
  // 기존의 값을 제거하고 숫자만 남기기 위해 정규 표현식을 사용합니다.
  const digits = phoneNumber.replace(/\D/g, "");
  // 입력된 숫자가 11자리가 아니면 null을 반환합니다.
  if (digits.length !== 11) return null;

  const areaCode = digits.substring(0, 3);
  const prefix = digits.substring(3, 7);
  const lineNumber = digits.substring(7);

  return `${areaCode}-${prefix}-${lineNumber}`;
}

//최초 로그인 시 선생님의 메타를 받아 메칭하는 함수
api_login.post("/addMeta", (req, res) => {
  // 폰번호에 -를 입력하지 않았을 경우 ###-####-#### 형태로 포멧변경
  var phone = formatPhoneNumber(req.body.phone);
  console.log(phone);
  if (phone == null) {
    //휴대전화번호를 잘못 입력했을 경우
    res.status(201);
    res.send("폰 번호 양식이 잘못되었습니다.");
  } else {
    var query = `select * from teachermaps where name='${req.body.name}' and cellphone='${phone}';`;
    
    console.log(query);
    var teacherno = null;
    db.connection.query(query, (error, rows) => {
      console.log(rows[0]);
      var part = '';
      var grade = '';
      var _class = '';
      if (rows.length > 0) {
        teacherno = rows[0].no;
        if (rows[0]&&rows[0].part) part=rows[0].part;
        if (rows[0]&&rows[0].grade) grade=rows[0].grade;    
        if (rows[0]&&rows[0].class) _class=rows[0].class;
      }

      console.log("tn:", teacherno);
      if (teacherno == null) {
        res.status(202);
        res.send("선생님 정보가 없습니다. 관리자에게 문의해주세요");
      } else {
        query = `insert into kakaoteachermap (kakaoid,name,cellphone, teacherno, part, grade, class) VALUES ('${req.body.kakaoid}','${req.body.name}','${req.body.phone}', '${teacherno}', '${part}', '${grade}', '${_class}');`;
        console.log(query);
        res.status(200);
        req.session.user = {
          kakaoid: req.body.kakaoid,
          name: req.body.name,
          part:  part,
          grade: grade,
          class: _class,
        };
        db.connection.query(query, (error, rows) => {});
        res.send("성공");
      }
    });
  }
});

api_login.post("/createSession", (req, res) => {
  try {
    req.session.user = {
      kakaoid: req.body.kakaoid,
      name: req.body.name,
      classno: req.body.classno,
      part: req.body.part,
      grade: req.body.grade,
      class: req.body.class,
      staffcode: req.body.staffcode,
    };
    res.status(200);
    res.send();
  } catch (e) {
    //세션 생성 실패.
    res.status(201);
    res.send();
  }
});

module.exports = api_login;
