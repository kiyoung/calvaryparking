var students;
var sel_month;

$(document).ready(function () {
  jQuery.ajaxSetup({ async: false });

  $.get("/api_birth/student", (data) => {
    students = data;
    console.log(students);
  });

  // 1~6 월 출력
  $("#monthFilter").append(
    `<div>
    <button type="button" class="btn btn month btn" id="month0" value="0">전체보기</button>
    <button type="button" class="btn btn month btn" id="monthno" value="-1">미입력자</button>
    </div>`
  );
  for (var i = 1; i <= 6; i++) {
    var pre = "";
    if (i < 10) pre = "0";
    $("#monthFilter1").append(`
        <div class="col-2">
            <button type="button" class="btn btn-sm month w-100 btn" id="month${i}" value="${i}">${pre}${i}월</button>
        </div>
      `);
  }
  // 7~12 출력
  for (var i = 7; i <= 12; i++) {
    var pre = "";
    if (i < 10) pre = "0";
    $("#monthFilter2").append(`
        <div class="col-2">
            <button type="button" class="btn btn-sm month w-100 btn" id="month${i}" value="${i}">${pre}${i}월</button>
        </div>
      `);
  }
  var date = new Date();
  sel_month = date.getMonth() + 1;
  $("#month" + sel_month).click();
});

$(document).on("click", ".month", (event) => {
  sel_month = event.target.value;
  $("#birthList").empty();
  if (sel_month == 0) {
    $("#titletext").text("전체 생일자 명단");
  } else if (sel_month == -1) {
    $("#titletext").text("생일 미입력자 명단");
  } else {
    $("#titletext").text(sel_month + "월 생일자 명단");
  }
  var cnt = 0;
  for (i = 0; i < students.length; i++) {
    if (students[i].birth == null || students[i].birth == "") {
      birth = "미입력";
    } else {
      birth = students[i].birth;
    }
    var s_birth = new Date(students[i].birth);
    var gender = "";
    if (
      /*전체보기 또는 특정 월 선택*/
      (birth != "미입력" &&
        (s_birth.getMonth() + 1 == sel_month || sel_month == 0)) ||
      /*미입력자 보기*/
      (sel_month == -1 && birth == "미입력")
    ) {
      cnt++;
      if (students[i].gender != null) {
        gender = `[${students[i].gender}]`;
      }
      $("#birthList").append(`
        <li class="list-group-item">
          <span class="text-secondary fw-bold ml-4 s_cnt">${cnt}.</span>
          <span class="text-primary fw-bold s_class">
          ${students[i].part}부 ${students[i].grade}-${students[i].class}</span>
          <span class="fw-bold s_name">${students[i].name}${gender}</span>
          <span class="fw-bold text-success s_birth">${birth}</span>
        </li>`);
    }
  }
});

$(document).on("click", "#copybtn", (event) => {
  var text = "";
  if (sel_month == 0) {
    text += "전체 생일자 명단\r\n";
  } else if (sel_month == -1) {
    text += "생일 미입력자 명단\r\n";
  } else {
    text += sel_month + "월 생일자 명단\r\n";
  }
  var cnt = 0;
  for (i = 0; i < students.length; i++) {
    if (students[i].birth == null) {
      birth = "미입력";
    } else {
      birth = students[i].birth;
    }
    var s_birth = new Date(students[i].birth);
    var gender = "";
    if (
      /*전체보기 또는 특정 월 선택*/
      (birth != "미입력" &&
        (s_birth.getMonth() + 1 == sel_month || sel_month == 0)) ||
      /*미입력자 보기*/
      (sel_month == -1 && birth == "미입력")
    ) {
      cnt++;
      if (students[i].gender != null) {
        gender = `[${students[i].gender}]`;
      }
      var _grade = students[i].grade;
      var _class = students[i].class;
      text += `${cnt}. ${students[i].part} ${_grade}-${_class} ${students[i].name}${gender} ${birth}\r\n`;
    }
  }

  const textArea = document.createElement("textarea"); // 임시 textarea 생성

  textArea.textContent = text; // textarea에 pre text를 넣음
  document.body.append(textArea); // body에 textarea 그리기, 그리지 않으면 복사 안됌
  textArea.select();
  document.execCommand("copy");
  textArea.remove(); // 임시 textarea 제거

  alert("클립보드에 복사되었습니다.");
});
