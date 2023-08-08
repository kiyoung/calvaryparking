const api = require("express").Router();
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const utf8 = require("utf8");
const scoreTable = require("./score.json");
var db = require("./db.js");

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, done) {
      var now = Date.now();
      if (!fs.existsSync(path)) {
        fs.mkdirSync("./src/upload/" + now);
      }
      done(null, "./src/upload/" + now);
    },
    filename: function (req, file, done) {
      file.originalname = utf8.decode(file.originalname);
      const ext = path.extname(file.originalname);
      done(null, path.basename(file.originalname, ext + Date.now() + ext));
    },
  }),
  limits: { fileSize: 1 * 1024 * 1024 * 1024 }, //1GB
});

api.post(
  "/changeAvatar",
  upload.array("file", 1), //파일 하나만 다룰 것이기 때문에 1
  async function (req, res, next) {
    const params = req.body;
    //후처리 과정을 거친 최종 얼굴 파일명. 얼굴이 없으면 ""
    var facefilepath = "";
    if (req.files.length > 0) {
      facefilepath =
        req.files[0].destination + "/" + "resized_" + req.files[0].filename;
      sharp(req.files[0].path, { failOnError: false }) // 리사이징할 파일의 경로
        .resize({ width: 320 }) // 원본 비율 유지하면서 width 크기만 설정
        .withMetadata()
        .toFile(facefilepath, (err, info) => {
          if (err) throw err;
          fs.unlink(req.files[0].path, (err) => {
            // 원본파일은 삭제
            if (err) throw err;
            var query = `update studentsinfo set face='${facefilepath}' where no='${req.body.studentsno}'`;
            var classno = 0;
            db.connection.query(query, (error, rows) => {
              res.send(facefilepath);
            });
          });
        });
    }
  }
);

api.post("/deleteAvatar", async function (req, res, next) {
  console.log(req.body);
  var query = `update studentsinfo set face='' where no='${req.body.no}'`;
  console.log(query);
  db.connection.query(query, (error, rows) => {
    res.send();
  });
});

api.post(
  "/add_student",
  upload.array("file", 1), //파일 하나만 다룰 것이기 때문에 1
  async function (req, res, next) {
    const params = req.body;

    //후처리 과정을 거친 최종 얼굴 파일명. 얼굴이 없으면 ""
    var facefilepath = "";

    if (req.files.length > 0) {
      facefilepath =
        req.files[0].destination + "/" + "resized_" + req.files[0].filename;
      sharp(req.files[0].path, { failOnError: false }) // 리사이징할 파일의 경로
        .resize({ width: 320 }) // 원본 비율 유지하면서 width 크기만 설정
        .withMetadata()
        .toFile(facefilepath, (err, info) => {
          if (err) throw err;
          fs.unlink(req.files[0].path, (err) => {
            // 원본파일은 삭제
            if (err) throw err;
          });
        });
    }

    //class no를 구함
    var query = `select * from classinfo where part='${params.part}' and grade='${params.grade}' and class='${params.class}'`;
    var classno = 0;
    db.connection.query(query, (error, rows) => {
      console.log(rows);
      if (rows.length > 0) {
        classno = rows[0].no;
        //classno를 구할 수 있으면, 학생정보를 입력하고,
        query = `
            INSERT INTO studentsinfo
            (name,birth,address,phone1,phone2,gender,face, is_show)
            Values (
            '${params.name}',
            '${params.birth}',
            '${params.address}',
            '${params.phone1}',
            '${params.phone2}',
            '${params.gender}',
            '${facefilepath}',
            'Y');`;
        console.log("query :", query);
        db.connection.query(query, (error, rows) => {
          if (error) {
            res.status(202);
            res.send(error);
          }
          var studentno = rows.insertId;
          db.connection.query(
            `
              INSERT INTO studentclassmap
              (studentsno, classno)
              Values ('${studentno}','${classno}');`,
            (error, rows) => {
              if (error) {
                res.status(202);
                res.send(error);
              }
              res.status(200);
              res.send();
            }
          );
        });
      } else {
        res.status(201);
        res.send("입력한 부서, 학년, 반이 없습니다.");
      }
    });
  }
);

api.get("/api_student/:key", async (req, res) => {
  var key = req.params.key;
  // 반 리스트
  if (key == "class") {
    db.connection.query(
      "SELECT part,grade,class from studentsmaps group by part,grade,class order by part, grade, class",
      (error, rows) => {
        res.send(rows);
      }
    );
  }

  //학생 감추기
  if (key == "showhide") {
    var params = req.query;
    query = `UPDATE studentsinfo set is_show='${params.is_show}' where no='${params.no}'`;

    db.connection.query(query, (error, rows) => {
      if (error) res.send(error);
      res.send();
    });
  }

  //학생정보 업데이트
  if (key == "update_info") {
    var params = req.query;
    console.log(params);
    // class no 가져오기
    var query = `select * from classinfo where part='${params.part}' and grade='${params.grade}' and class='${params.class}'`;
    var classno = 0;
    db.connection.query(query, (error, rows) => {
      if (rows.length > 0) {
        classno = rows[0].no;
        query = `
          UPDATE studentsinfo
            SET
              name = '${params.name}',
              birth = '${params.birth}',
              address = '${params.address}',
              phone1 = '${params.phone1}',
              phone2 = '${params.phone2}',
              gender = '${params.gender}'
            where no = '${params.row}'
          `;
        console.log(query);
        db.connection.query(query, (error, rows) => {
          query = `
              UPDATE studentclassmap
                SET classno = '${classno}'
              where studentsno = '${params.row}';
            `;
          db.connection.query(query, (error, rows) => {
            res.send();
          });
        });
      }
    });
    res.send();
  }

  if (key == "student") {
    var params = req.query;
    var where_part;
    var where_grade;
    var where_class;
    if (params.part == null || params.part == "전체") {
      where_part = "and 1 ";
    } else {
      where_part = `and part='${params.part}'`;
    }
    if (params.grade == null || params.part == "전체") {
      where_grade = "and 1 ";
    } else {
      where_grade = `and grade='${params.grade}'`;
    }
    if (params.class == null || params.part == "전체") {
      where_class = "and 1 ";
    } else {
      where_class = `and class='${params.class}'`;
    }

    var query = `SELECT * from studentsmaps where 1
      ${where_part}
      ${where_grade}
      ${where_class}
      
      order by part,grade,class
      `;
    db.connection.query(query, (error, rows) => {
      res.send(rows);
    });
  }
});

api.get("/api_birth/:key", (req, res) => {
  var key = req.params.key;
  if (key == "student") {
    var query =
      "select * from studentsmaps where is_show='Y' order by part,grade,class";
    db.connection.query(query, (error, rows) => {
      res.send(rows);
    });
  }
});

api.get("/api_attendance/:key", (req, res) => {
  var key = req.params.key;
  //학생 리스트를 부, 학년, 반을 통해 조회

  if (key == "scoreTable") {
    /*var query = "SELECT * from scoreTabel";
    db.connection.query(query, (error, rows) => {
      res.send(rows);
    });*/
    res.json(scoreTable);
  }

  if (key == "student") {
    var params = req.query;
    var where_part;
    var where_grade;
    var where_class;
    if (params.part == null || params.part == "전체") {
      where_part = "and 1 ";
    } else {
      where_part = `and part='${params.part}'`;
    }
    if (params.grade == null || params.part == "전체") {
      where_grade = "and 1 ";
    } else {
      where_grade = `and grade='${params.grade}'`;
    }
    if (params.class == null || params.part == "전체") {
      where_class = "and 1 ";
    } else {
      where_class = `and class='${params.class}'`;
    }

    var query = `SELECT * from studentsmaps where is_show='Y' 
      ${where_part}
      ${where_grade}
      ${where_class}
      
      order by part,grade,class
      `;
    db.connection.query(query, (error, rows) => {
      res.send(rows);
    });
  }
  // 반 리스트
  if (key == "class") {
    db.connection.query(
      "SELECT part,grade,class from studentsmaps group by part,grade,class order by part,grade,class",
      (error, rows) => {
        res.send(rows);
      }
    );
  }
  // 입력 가능 날짜 리스트
  if (key == "dates") {
    db.connection.query(
      "SELECT * from date order by no desc",
      (error, rows) => {
        res.send(rows);
      }
    );
  }
  //학생 점수 업데이트
  if (key == "scoreInput") {
    var params = req.query;
    var score = JSON.stringify(params.score);
    var query = `INSERT INTO attendance (student_no, date_no, score) VALUES ('${params.student_no}', '${params.date_no}', '${score}') ON DUPLICATE KEY UPDATE score='${score}';`;
    db.connection.query(query, (error, rows) => {
      var query = `select * from score where no='${params.student_no}'`;
      db.connection.query(query, (error, rows) => {
        res.send(rows);
      });
    });
  }
  //해당 날짜, 부, 학년, 반 학생의 점수 테이블 가져오기
  if (key == "GetScore") {
    var params = req.query;

    //22.08.09 항상 모든 데이터를 가지고 오게 변경
    //상단 통계 출력을 위해.
    params.part = "전체";
    var where_part;
    var where_grade;
    var where_class;
    if (params.part == null || params.part == "전체") {
      where_part = "and 1 ";
    } else {
      where_part = `and part='${params.part}'`;
    }
    if (params.grade == null || params.part == "전체") {
      where_grade = "and 1 ";
    } else {
      where_grade = `and grade='${params.grade}'`;
    }
    if (params.class == null || params.part == "전체") {
      where_class = "and 1 ";
    } else {
      where_class = `and class='${params.class}'`;
    }

    var query = `SELECT * from attendance A
      LEFT JOIN studentsmaps S ON A.student_no=S.studentsno 
      where 1
      ${where_part}
      ${where_grade}
      ${where_class}
      and A.date_no='${params.date_no}'`;
    db.connection.query(query, (error, rows) => {
      res.send(rows);
    });
  }
});

api.get("/score", (req, res) => {
  var query = "select * from score";
  db.connection.query(query, (error, rows) => {
    res.send(rows);
  });
});

api.get("/getTeachersInfo", (req, res) => {
  var query = "select * from teachermaps";
  db.connection.query(query, (error, rows) => {
    res.send(rows);
  });
});

api.get("/scoreStatistics", (req, res) => {
  var query = `SELECT S.no AS no,CI.part AS part,CI.grade AS grade,CI.class AS class,S.name AS name,D.date AS date,
  sum(if(cast(json_extract(A.score,'$."출석"."score"') as SIGNED),cast(json_extract(A.score,'$."출석"."score"') as signed),0)) AS 출석,
  sum(if(cast(json_extract(A.score,'$."설교노트"."score"') as signed),cast(json_extract(A.score,'$."설교노트"."score"') as signed),0)) AS 설교노트,
  sum(if(cast(json_extract(A.score,'$."성경지참"."score"') as signed),cast(json_extract(A.score,'$."성경지참"."score"') as signed),0)) AS 성경지참,
  sum(if(cast(json_extract(A.score,'$."순전지참"."score"') as signed),cast(json_extract(A.score,'$."순전지참"."score"') as signed),0)) AS 순전지참,
  sum(if(cast(json_extract(A.score,'$."큐티"."score"') as signed),cast(json_extract(A.score,'$."큐티"."score"') as signed),0)) AS 큐티,
  sum(if(cast(json_extract(A.score,'$."미션"."score"') as signed),cast(json_extract(A.score,'$."미션"."score"') as signed),0)) AS 미션,
  sum(if(cast(json_extract(A.score,'$."전도"."score"') as signed),cast(json_extract(A.score,'$."전도"."score"') as signed),0)) AS 전도,
  sum(if(cast(json_extract(A.score,'$."특새"."score"') as signed),cast(json_extract(A.score,'$."특새"."score"') as signed),0)) AS 특새,
  sum(if(cast(json_extract(A.score,'$."보너스"."score"') as signed),cast(json_extract(A.score,'$."보너스"."score"') as signed),0)) AS 보너스,
  sum(if(cast(json_extract(A.score,'$."기도위원"."score"') as signed),cast(json_extract(A.score,'$."기도위원"."score"') as signed),0)) AS 기도위원,
  sum(if(cast(json_extract(A.score,'$."특송위원"."score"') as signed),cast(json_extract(A.score,'$."특송위원"."score"') as signed),0)) AS 특송위원,
  sum(if(cast(json_extract(A.score,'$."헌금위원"."score"') as signed),cast(json_extract(A.score,'$."헌금위원"."score"') as signed),0)) AS 헌금위원,
  sum(if(cast(json_extract(A.score,'$."성경필사"."score"') as signed),cast(json_extract(A.score,'$."성경필사"."score"') as signed),0)) AS 성경필사 ,
  sum((((((((((((if(cast(json_extract(A.score,'$."출석"."score"') as signed),cast(json_extract(A.score,'$."출석"."score"') as signed),0) +
                         if(cast(json_extract(A.score,'$."설교노트"."score"') as signed),cast(json_extract(A.score,'$."설교노트"."score"') as signed),0)) +
                          if(cast(json_extract(A.score,'$."성경지참"."score"') as signed),cast(json_extract(A.score,'$."성경지참"."score"') as signed),0)) +
                           if(cast(json_extract(A.score,'$."순전지참"."score"') as signed),cast(json_extract(A.score,'$."순전지참"."score"') as signed),0)) +
                            if(cast(json_extract(A.score,'$."큐티"."score"') as signed),cast(json_extract(A.score,'$."큐티"."score"') as signed),0)) +
                             if(cast(json_extract(A.score,'$."미션"."score"') as signed),cast(json_extract(A.score,'$."미션"."score"') as signed),0)) +
                              if(cast(json_extract(A.score,'$."전도"."score"') as signed),cast(json_extract(A.score,'$."전도"."score"') as signed),0)) +
                               if(cast(json_extract(A.score,'$."특새"."score"') as signed),cast(json_extract(A.score,'$."특새"."score"') as signed),0)) +
                                if(cast(json_extract(A.score,'$."보너스"."score"') as signed),cast(json_extract(A.score,'$."보너스"."score"') as signed),0)) +
                                 if(cast(json_extract(A.score,'$."기도위원"."score"') as signed),cast(json_extract(A.score,'$."기도위원"."score"') as signed),0)) +
                                  if(cast(json_extract(A.score,'$."특송위원"."score"') as signed),cast(json_extract(A.score,'$."특송위원"."score"') as signed),0)) + 
                                  if(cast(json_extract(A.score,'$."헌금위원"."score"') as signed),cast(json_extract(A.score,'$."헌금위원"."score"') as signed),0)) +
                                  if(cast(json_extract(A.score,'$."성경필사"."score"') as signed),cast(json_extract(A.score,'$."성경필사"."score"') as signed),0)) AS total,sum(if(cast(json_extract(A.score,'$."출석"."score"') as signed),1,0)) AS 출석개수 from ((((studentsinfo S left join studentclassmap SM on((S.no = SM.studentsno))) left join classinfo CI on((SM.classno = CI.no))) left join attendance A on((S.no = A.student_no))) left join date D on((A.date_no = D.no))) WHERE D.date IS NOT null AND S.is_show = "Y"
  group BY D.date, CI.part, CI.grade, CI.class, S.no order BY D.date,CI.part`;
  console.log(query);
  db.connection.query(query, (error, rows) => {
    res.send(rows);
  });
});

module.exports = api;
