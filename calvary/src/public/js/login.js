$("#metaContainer").hide();
//탈퇴버튼
function unlinkApp() {
  Kakao.API.request({
    url: "/v1/user/unlink",
    success: function (res) {
      alert("success: " + JSON.stringify(res));
    },
    fail: function (err) {
      alert("fail: " + JSON.stringify(err));
    },
  });
}

//서버에 로그인 session을 생성한다.
function CreateSession(kakaoid, name, classno, part, grade, _class, staffcode) {
  console.log(
    "createsession",
    kakaoid,
    name,
    classno,
    part,
    grade,
    _class,
    staffcode
  );
  $.ajax({
    type: "post",
    url: "./createSession",
    async: "false",
    dataType: "json",
    data: {
      kakaoid: kakaoid,
      name: name,
      classno: classno,
      part: part,
      grade: grade,
      class: _class,
      staffcode: staffcode,
    },
    statusCode: {
      200: function (data) {
        if (referer != "") {
          $(location).attr("href", referer);
        } else {
          $(location).attr("href", "/");
        }
      },
      // 세션 생성 실패
      201: function (data) {
        alert("서버 문제로 로그인 할 수 없습니다. 관리자에게 문의해주세요.");
      },
    },
    error: function (err) {
      if (err.status !== 200 && err.status !== 201) {
        alert("서버 응답이 없습니다.");
      }
    },
    cache: false,
  });
}

// 카카오 로그인 시 메타 정보를 체크해서
// 메타정보가 있으면 세션생성을,
// 메타 정보가 없으면 메타 정보 입력을 받는다.
function CheckMetaTable(kakaoid) {
  $.ajax({
    type: "post",
    url: "./getTeacherInfo",
    async: "false",
    dataType: "json",
    data: {
      id: kakaoid,
    },
    statusCode: {
      200: function (data) {
        console.log("data:",data);
        // 매핑 테이블에 정보가 없을 경우
        // 메타 입력을 Show 한다.
        if (data.length == 0) {
          $("#notice").hide();
          $("#metaContainer").show();
          $("#kakaologinContainer").hide();
          $("#kakaoid").val(kakaoid);
        } else {
          //매핑 데이터가 있을 경우, 로그인 처리 한다.
          CreateSession(
            data[0].kakaoid,
            data[0].name,
            data[0].classno,
            data[0].part,
            data[0].grade,
            data[0].class,
            data[0].staffcode
          );
        }
      },
    },
    error: function (err) {
      if (err.status !== 200 && err.status !== 201) {
        alert("서버 응답이 없습니다.");
      }
    },
    cache: false,
  });
}

//login 처리
Kakao.init("12a616e4954f55725a24f79fd77cef3c");
Kakao.Auth.createLoginButton({
  container: "#kakao-login-btn",
  success: function (authObj) {
    Kakao.API.request({
      url: "/v2/user/me",
      success: function (result) {
        kakaoid = result.id;

        /*쓰지 않는 데이터
                connected_at = result.connected_at;
                kakao_account = result.kakao_account;*/

        //메타정보 조회
        CheckMetaTable(kakaoid);
      },
      fail: function (error) {
        alert("카카오로그인을 할 수 없습니다. 관리자에게 문의해주세요.");
      },
    });
  },
  fail: function (err) {
    alert("카카오로그인을 할 수 없습니다. 관리자에게 문의해주세요.");
  },
});

$("#metaForm").on("submit", (e) => {
  e.preventDefault();
  var kakaoid = $("#kakaoid").val();
  var name = $("#name").val();
  var phone = $("#phone").val();
  console.log(kakaoid, name, phone);
  if (name == "") {
    alert("이름을 입력해주세요.");
  } else {
    $.ajax({
      type: "post",
      url: "./addMeta",
      async: "true",
      dataType: "json",
      data: {
        kakaoid: kakaoid,
        name: name,
        phone,
        phone,
      },
      statusCode: {
        200: function (data) {
          //메타 입력 성공
          $(location).attr("href", "/");
        },
        //폰 번호 양식이 잘못 되었을 경우
        201: function (data) {
          alert(data.responseText);
        },
        //입력한 선생님 정보가 없을 경우
        202: function (data) {
          alert(data.responseText);
        },
      },
      error: function (err) {
        if (err.status !== 200 && err.status !== 201 && err.status !== 202) {
          alert("서버 응답이 없습니다.");
        }
      },
      cache: false,
    });
  }
});
