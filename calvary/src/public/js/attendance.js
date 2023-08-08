//반선택을 부, 학년, 반 으로 하도록 한다
//날짜와 반이 선택 되면 해당 날짜의 점수 현황을 보여준다
//점수 현황을 터치 및 클릭으로 수정하면
//실시간 업데이트 한다.
var selectlist = ["part", "grade", "class"];
var selectname = ["부", "학년", "반"];
var part_list = new Set(); //DB에 존재하는 부 리스트 (2부, 3부...)
var grade_list = new Set(); //DB에 존재하는 학년 리스트
var class_list = new Set(); //DB에 존재하는 반 리스트
var lists = [part_list, grade_list, class_list];
var scoreJson = new Object(); //조회 된 날짜, 반의 점수 현황
var teachers;

var dates = new Set();

//selection 정보
var date_no; //선택 된 날짜
var date_n; //총 날짜 개수 (총 출석 개수를 구하기 위함)
var date_score_list; //선택 된 날짜의 입력 받을 항목 리스트
var selected_part; //선택 된 부
var selected_grade; //선택 된 학년
var selected_class; //선택 된 반

var scoreTable; // 항목별 타입 및 점수표 JSON,  DB의 score 테이블
var scoreStatus; // 현재 학생 별 점수 현황

var btnClass = "selectUI btn btn-sm fw-bold border-secondary ";
var inputClass = "form-control fw-bold inputUI ";

///////////// 여기서 부터 필터 생성 함수

$(document).ready(function () {
  //반 선택 UI
  jQuery.ajaxSetup({ async: false });

  $.get("/api_attendance/scoreTable", (data) => {
    scoreTable = data;
  });

  $.get("/getTeachersInfo", (data) => {
    teachers = data;
  });

  $.get("/api_attendance/class", (data) => {
    //모든 부, 모든 학년, 모든 반을 구한다
    part_list.add("전체");
    for (var i = 0; i < data.length; i++) {
      part_list.add(data[i].part);
      grade_list.add(data[i].grade);
      class_list.add(data[i].class);
    }

    let uiIdx = 0;
    //모든 부, 학년, 반을 기반으로 3단 선택 생성
    lists.forEach((list) => {
      let index = 0;
      list.forEach((value) => {
        index++;
        var _id = selectlist[uiIdx] + index;
        $("#ui_" + selectlist[uiIdx]).append(`
                <div class="form-check">
                    <input 
                        class="form-check-input"
                        type="radio"
                        name="${selectlist[uiIdx]}"
                        id="${_id}"
                        value="${value}"
                        onclick="MakeStudentListUI()"></input>
                    <label 
                        class="form-check-label"
                        for="${_id}">${value}${selectname[uiIdx]}</label>
                </div>
            `);
      });
      uiIdx++;
    });
  });

  //날짜 선택 UI
  //DB에 생성 된 날짜를 구해 온다.
  $.get("/api_attendance/dates", (data) => {
    var ui_date = document.getElementById("ui_date");
    ui_date.addEventListener("change", MakeStudentListUI);
    date_n = data.length;
    for (var i = 0; i < data.length; i++) {
      //score = 해당 날짜가 입력받아야 할 항목을 정의
      //항목의 정의는 scoreTable 변수에 Type과 점수가 기록 됨
      $("#ui_date").append(`
                <option
                    value=${data[i].no}
                    data-score='${data[i].score}'
                    >
                    ${data[i].date}
                </option>
            `);
      dates.add(data[i].date);
      $("#ui_date option:eq(0)").prop("selected", true);
    }
  });

  // 첫 로딩 시 아무 필터 없이 전체 학생을 가지고 오기 위해 콜
  MakeStudentListUI();
});

//일단 SSL이 아니기 때문에 쿠키 대신 로컬스토리지를 활용한다.

/** 쿠키 가져오기
 * @param {string} name
 * @returns 쿠키네임의 값을 문자로 리턴
 */
function getCookie(name) {
  /*let matches = document.cookie.match(
    new RegExp(
      "(?:^|; )" +
        name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, "\\$1") +
        "=([^;]*)"
    )
  );
  return matches ? decodeURIComponent(matches[1]) : undefined;*/
  return localStorage.getItem(name);
}

/** 쿠키 name에 value를 세팅
 * @param {string} name
 * @param {string} value
 * @param {object} option
 */
function setCookie(name, value, options = {}) {
  /*options = {
    path: "/",
    // 필요한 경우, 옵션 기본값을 설정할 수도 있습니다.
    ...options,
  };
 
  if (options.expires instanceof Date) {
    options.expires = options.expires.toUTCString();
  }
 
  let updatedCookie =
    encodeURIComponent(name) + "=" + encodeURIComponent(value);
 
  for (let optionKey in options) {
    updatedCookie += "; " + optionKey;
    let optionValue = options[optionKey];
    if (optionValue !== true) {
      updatedCookie += "=" + optionValue;
    }
  }
  var domain = window.location.href;
  domain = domain.replace("http://", "");
  domain = domain.replace("https://", "");
  domain = domain.split(":")[0];
 
  updatedCookie += ";" + "domain=" + domain;
  document.cookie = updatedCookie;
  */
  localStorage.setItem(name, value);
}

/** 쿠키 삭제
 * @params {string} name  해당 name의 쿠키 삭제
 */
function deleteCookie(name) {
  /*setCookie(name, "", {
    "max-age": -1,
  });*/
  localStorage.removeItem(name);
}

/** cookie로 부터 마지막 필터 옵션 가져온다
 *
 */
function makeFilterOptionByCookie() {
  if (
    selected_part === undefined &&
    selected_grade === undefined &&
    selected_class === undefined
  ) {
    selected_part = /*getCookie("selected_part") ??*/ user.part;
    selected_grade = /*getCookie("selected_grade") ??*/ user.grade;
    selected_class = /*getCookie("selected_class") ??*/ user.class;

    $("input[name='part'][value='" + selected_part + "']").prop(
      "checked",
      true
    );
    $("input[name='grade'][value='" + selected_grade + "']").prop(
      "checked",
      true
    );
    $("input[name='class'][value='" + selected_class + "']").prop(
      "checked",
      true
    );
  }
}

/////////여기서부터 점수 입력판 생성 함수

/** 학생의 점수 입력판 UI생성함수
 * @param {string} type 생성할 점수 타입 (select, input...)
 * @param {number} student_no 학생의 DB no
 * @param {string} student_name 학생 이름
 * @param {number} date_no 날짜 DB의 no
 * @returns type에 맞는 점수판 UI 생성해서 Returnsection
 */
function makeScoreInputUI(type, student_no, student_name, date_no) {
  var returnUI = "";
  var scoreData = scoreTable[type];
  //버튼을 터치 할 때 마다 값이 로테이션 되는 형태의 UI
  if (scoreData.type == "select") {
    var sel_idx = 0; // 버튼의 현재 입력 된 index
    //기존 입력 된 것이 있다면 idx를 가져와 해당 버튼으로 생성
    if (scoreJson[student_no] != null) {
      if (scoreJson[student_no][type] != null) {
        sel_idx = scoreJson[student_no][type].idx;
      }
    }

    //23년 6월 이 후, 6월 이전 값은 입력못하도록 하기 위한 코드.
    var ui_date = $("#ui_date option:selected").text();
    var isDisabled = "";
    ui_date = ui_date.replace(/\s/g, "");
    if (new Date(ui_date) < new Date("2023-06-01")) {
      isDisabled = " disabled";
    }

    var ui_class = scoreData.option[sel_idx].class;
    var ui_name = scoreData.option[sel_idx].name;
    returnUI = `
            <div class="bottonContainer">
              <button
                  class="${btnClass} ${ui_class}"
                  data-type="${type}"
                  data-idx="${sel_idx}"
                  data-student_no="${student_no}"
                  data-student_name="${student_name}"
                  data-date_no="${date_no}" ${isDisabled}>
                      ${ui_name}
              </button>
            </div>
        `;
  }
  //직접 수를 조정해서 입력하는 UI
  if (scoreData.type == "input") {
    var score = 0;
    //기존 입력 된 값이 있다면 score에 할당
    if (scoreJson[student_no] != null) {
      if (scoreJson[student_no][type] != null) {
        score = scoreJson[student_no][type].score;
      }
    }
    returnUI = `
            <div class="inputContainer">
                <div class="labelContainer">
                    <span class="inputLabel">${type}</span>
                </div>
                <div class="input-group">
                    <input
                        id="floatingInput"
                        placeholder="${type}"
                        class="${inputClass}"
                        data-type="${type}"
                        data-student_no="${student_no}"
                        data-student_name="${student_name}"
                        data-date_no="${date_no}"
                        type="number"
                        readonly  
                        value="${score}"
                        min="${scoreData.min}" max="${scoreData.max}" step="1" ${isDisabled}>
                </div>
            </div>
        `;
  }
  return returnUI;
}

//서버에서 현재 선택 된 필터에 해당하는 학생들의
//선택 된 날짜의 점수판을 불러온다
function GetScoreData() {
  $.get(
    "/api_attendance/GetScore",
    {
      date_no: date_no,
      part: selected_part,
      grade: selected_grade,
      class: selected_class,
    },
    (data) => {
      scoreJson = new Object();
      console.log(data);
      for (var i = 0; i < data.length; i++) {
        var row = data[i];
        scoreJson[row.student_no] = JSON.parse(row.score);
      }
    }
  );
  $.get("/score", {}, (data) => {
    scoreStatus = new Array();
    data.forEach((row) => {
      scoreStatus[row.no] = row;
    });
    console.log(scoreStatus);
  });
}

//현재 입력 된 필터 정보를 가져와 업데이트 하는 함수
function UpdateSelectedUI() {
  date_no = $("#ui_date option:selected").val();
  date_score_list = $("#ui_date option:selected").data("score");

  if (selected_part != $("input[name='part']:checked").val()) {
    $("input[name='grade']:checked").prop("checked", false);
    $("input[name='class']:checked").prop("checked", false);
  }
  if (selected_grade != $("input[name='grade']:checked").val()) {
    $("input[name='class']:checked").prop("checked", false);
  }
  selected_part = $("input[name='part']:checked").val();
  selected_grade = $("input[name='grade']:checked").val();
  selected_class = $("input[name='class']:checked").val();

  if (selected_part == "전체") {
    $("input[name='grade']").each(function (i) {
      $(this).attr("disabled", "true");
    });
    $("input[name='class']").each(function (i) {
      $(this).attr("disabled", "true");
    });
  } else {
    $("input[name='grade']").each(function (i) {
      $(this).removeAttr("disabled");
    });
    $("input[name='class']").each(function (i) {
      $(this).removeAttr("disabled");
    });
  }

  if (selected_part == "") {
    deleteCookie("selected_part");
  } else {
    setCookie("selected_part", selected_part, {
      secure: true,
      "max-age": 86400 * 365,
    });
  }
  if (selected_grade == "") {
    deleteCookie("selected_grade");
  } else {
    setCookie("selected_grade", selected_grade, {
      secure: true,
      "max-age": 86400 * 365,
    });
  }
  if (selected_class == "") {
    deleteCookie("selected_class");
  } else {
    setCookie("selected_class", selected_class, {
      secure: true,
      "max-age": 86400 * 365,
    });
  }
}

//필터에 따른 학생 리스트와 점수 입력판을 생성하는 함수
async function MakeStudentListUI() {
  makeFilterOptionByCookie();
  UpdateSelectedUI();
  if (
    1
    /*selected_part != null &&
    selected_grade != null &&
    selected_class != null*/
  ) {
    //UI를 생성하기 전 DB에서 기존 입력 된 데이터를 가져온다.
    GetScoreData();
    $.get(
      "/api_attendance/student",
      {
        part: selected_part,
        grade: selected_grade,
        class: selected_class,
      },
      (data) => {
        //필터 변동 시 기존 학생리스트를 지운 후
        $("#ui_student_list").empty();
        if (data.length == 0) {
          var _grade = selected_grade.replace("학년", "");
          var _class = selected_class.replace("반", "");
          $("#ui_student_list").append(
            `${selected_part}부 ${_grade} - ${_class} 에는 학생이 없습니다.`
          );
        }
        //신규 학생리스트를 생성한다.
        var current_part = "";
        var current_grade = "";
        var current_class = "";
        for (var i = 0; i < data.length; i++) {
          var row = data[i];
          if (
            row.part != current_part ||
            row.grade != current_grade ||
            row.class != current_class
          ) {
            current_part = row.part;
            current_grade = row.grade;
            current_class = row.class;

            var teacher = teachers.filter((e) => {
              return (
                e.part === row.part &&
                e.grade === row.grade &&
                e.class === row.class
              );
            });
            var teacherName = "";
            var teacherPhone = "";
            if (teacher.length > 0) {
              teacherName = teacher[0].name;
              teacherPhone = teacher[0].cellphone;
            }
            $("#ui_student_list").append(
              `<div class="teacherContainer"><span class="teacher"><span class="teacher-name">${row.part}부 ${row.grade}-${row.class} ${teacherName}</span> <span class="teacher-info"><a class="TeacherSmsLink" href="tel:${teacherPhone}">연락하기</a></span></div>`
            );
          }

          // 섹션 별로 버튼식 입력만 모을 배열
          var sectionSelectUI = new Array();
          // 섹션 별로 인풋스피너 식 입력만 모을 배열
          var sectionInputUI = new Array();

          // 섹션별로 입력방식 별 div 생성
          scoreTable["색션정의"].forEach((row, idx) => {
            sectionSelectUI[idx] = $("<div class='row inputGroup'></div>");
            sectionInputUI[idx] = $("<div class='row' inputGroup'></div>");
          });

          // 인풋들의 종류 별로 분류해서 배열에 담기
          date_score_list.forEach((toInput) => {
            if (scoreTable[toInput].type == "select") {
              sectionSelectUI[scoreTable[toInput].sectionNO].append(
                makeScoreInputUI(toInput, row.studentsno, row.name, date_no)
              );
            }
            if (scoreTable[toInput].type == "input") {
              sectionInputUI[scoreTable[toInput].sectionNO].append(
                makeScoreInputUI(toInput, row.studentsno, row.name, date_no)
              );
            }
          });
          // 최종 UI 생성 DIV
          var inputUI = $("<div></div>");
          for (var idx = 0; idx < scoreTable["색션정의"].length; idx++) {
            //section 타이틀 추가
            //버튼 먼저 추가
            const SelectChildCount = sectionSelectUI[idx].children().length;
            const InputChildCount = sectionInputUI[idx].children().length;
            var Col = "col";

            if (SelectChildCount < 5) {
              Col = "col-" + 12 / SelectChildCount;
            }
            sectionSelectUI[idx].children().addClass(Col);

            // Input 방식은 한 줄에 2개 기본,  1개 일 때는 한 줄을 다 씀, 최대 한줄에 3개 까지.
            Col = "col-6";
            if (InputChildCount == 1) {
              Col = "col-12";
            }
            if (InputChildCount == 2) {
              Col = "col-6";
            }
            if (InputChildCount == 3) {
              Col = "col-4";
            }
            var sectionBody = $("<div class='sectionBody'></div>");
            sectionInputUI[idx].children().addClass(Col);
            if (SelectChildCount + InputChildCount > 0) {
              inputUI.append(
                `<div class="sectionContainer"><span class="section">${scoreTable["색션정의"][idx]}</span></div>`
              );
              sectionBody.append(sectionSelectUI[idx]);
              //인풋 추가
              if (InputChildCount > 0) {
                sectionBody.append(sectionInputUI[idx]);
              }
              inputUI.append(sectionBody);
            }
          }

          //성별이 있으면 성별 표시
          var gender = "";
          if (row.gender != null) gender = `[${row.gender}]`;

          //점수판
          var _grade = row.grade.replace("학년", "");
          var _class = row.class.toString().replace("반", "");
          var birth = row.birth;
          var isBirthMonth = "";
          if (/^\d{4}-\d{2}-\d{2}$/.test(birth)) {
            birth = new Date(birth);
            var now = new Date();
            if (now.getMonth() == birth.getMonth()) {
              isBirthMonth = "birthMonth";
            }
          }
          var dates_after_regdate = 0;
          dates.forEach((date) => {
            if (date >= row.regdate) {
              dates_after_regdate++;
            }
          });
          var 출석개수 = 0;
          var total = 0;
          if (scoreStatus[row.studentsno]){
            출석개수 = scoreStatus[row.studentsno].출석개수;
            total = scoreStatus[row.studentsno].total;
          }
          
          $("#ui_student_list").append(`
          <div class="container col-xxl-4 col-xl-4 col-lg-6 col-md-6 col-sm-12 col-xs-12"> 
            <div class="card mb-4">
              <div class="card-header text-center">
                <img src="${row.face ? row.face : "/public/noface.png"
            }" alt="face" class="rounded-circle shadow avatar" id="avatar_${row.studentsno
            }" data-no="${row.studentsno}">
                <div class="info">
                  <div class="birth text-left ${isBirthMonth}">
                    ${isBirthMonth == "birthMonth"
              ? '<i class="fa-solid fa-cake-candles"></i>'
              : ""
            } 생일:${row.birth}
                  </div>
                  <div class="name">
                    [${row.part}부 ${_grade}-${_class}]${row.name}
                    <span class="text-primary"> ${gender}</span>
                  </div>              
                  <div class="status">
                    출석률:<span class="statusItem" id="attendanceRate_${row.studentsno
            }">${Math.round(
              (출석개수 / dates_after_regdate) * 100
            )}%</span>
                    달란트:<span class="statusItem" id="talents_${row.studentsno
            }">${total}</span>
                  </div>
                </div>
              </div>
              <div class="card-body">
                ${inputUI[0].innerHTML}
              </div>
              <div class="card-footer">
                <div class="col-6 phone">
                  ${row.phone1
              ? `<a class="smsLink" href="sms:${row.phone1}">학생 : ${row.phone1}</a>`
              : "미입력"
            }
                </div>
                <div class="col-6 phone">
                  ${row.phone2
              ? `<a class="smsLink" href="sms:${row.phone2}">부모 : ${row.phone2}</a>`
              : "미입력"
            }
                </div>
              </div>
            </div>
          </div>
          `);
        }
      }
    );
    //숫자 조절 버튼 추가
    //$("input[type='number']").each(function (index, item) {
    //  $(this).inputSpinner();
    //});
    // 숫자 조절 컨트롤이 미리 있으면 스크롤에 방해가 됨
  }
}

//////여기서부터 EVENT처리 함수

//점수 JSON을 생성 또는 업데이트 한다.
function UpdateScore(
  type,
  type_name,
  idx,
  student_no,
  student_name,
  date_no,
  score
) {
  var json = scoreJson[student_no];
  var inputType = scoreTable[type].type;
  if (json == null) {
    scoreJson[student_no] = new Object();
  }
  if (scoreJson[student_no][type] == null) {
    scoreJson[student_no][type] = new Object();
  }
  if (inputType == "select") {
    scoreJson[student_no][type].score = score;
    scoreJson[student_no][type].idx = idx;
  }
  if (inputType == "input") {
    if (scoreJson[student_no][type] == null) {
      scoreJson[student_no][type] = new Object();
    }
    scoreJson[student_no][type].score = score;
  }
  //DB update
  $.get(
    "/api_attendance/scoreInput",
    {
      student_no: student_no,
      date_no: date_no,
      score: scoreJson[student_no],
    },
    (data) => {
      if (data != "" && data != null && data != undefined) {
        scoreStatus[data[0].no] = data[0];
        $(`#attendanceRate_${data[0].no}`).text(
          `${Math.round((data[0].출석개수 / date_n) * 100)}%`
        );
        $(`#talents_${data[0].no}`).text(`${data[0].total}`);
        $(`#attendanceRate_${data[0].no}`).addClass("changed");
        $(`#talents_${data[0].no}`).addClass("changed");
        setTimeout(() => {
          $(`#attendanceRate_${data[0].no}`).removeClass("changed");
          $(`#talents_${data[0].no}`).removeClass("changed");
        }, 1000);
        $.toast({
          text: `<p class="text_toast"> ${student_name} ${type}을(를) ${score}점으로 변경 </p > `,
          showHideTransition: "slide",
          bgColor: "#3c454d",
          textColor: "#FFF",
          stack: 1,
          hideAfter: 2000,
          position: "top-center",
        });
      }
    }
  );
}

//Select 타입의 입력, 즉 버튼 UI가 눌렸을 때 이벤트 처리
$(document).on("click", ".selectUI", (event) => {
  //눌린 버튼의 정보 가져오기
  var type = event.target.dataset.type;
  var idx = event.target.dataset.idx;
  var student_no = event.target.dataset.student_no;
  var student_name = event.target.dataset.student_name;
  var date_no = event.target.dataset.date_no;

  // 다음 버튼 타입으로 넘어감. 결석->현장->온라인->결석....
  idx++;
  var optionLength = scoreTable[type].option.length;
  if (idx == optionLength) {
    idx = 0;
  }
  var NextBtn = scoreTable[type].option[idx];
  var score = NextBtn.score;
  event.target.setAttribute("class", btnClass + NextBtn.class);
  event.target.innerText = NextBtn.name;
  event.target.setAttribute("data-idx", idx);

  //점수 현황 JSON 업데이트 및 DB동기화
  UpdateScore(
    type,
    NextBtn.name,
    idx,
    student_no,
    student_name,
    date_no,
    score
  );
});

var inputspinner = undefined;

//input타입, 기타 클릭 시 스피너 UI추가 (+-버튼)
$(document).on("mouseup", "input[type='number']", function () {

  //23년 6월 이전 것 입력 못하도록 막는 코드.
  var ui_date = $("#ui_date option:selected").text();
  ui_date = ui_date.replace(/\s/g, "");
  if (new Date(ui_date) < new Date("2023-06-01")) {
    return;
  }

  //$("input[type='number'].input-spinner").each(function (index, item) {
  //  $(this).inputSpinner("destroy");
  //  $(this).attr("readonly", true);
  if (inputspinner != undefined) {
    inputspinner.inputSpinner("destroy");
    inputspinner.attr("readonly", true);
  }
  //});
  $(this).attr("readonly", false);
  $(this).inputSpinner({ autoInterval: 100 });
  inputspinner = $(this);
});

//input타입 점수가 변동 되었을 때
$(document).on("change", "input[type='number']", function (event) {
  var type = event.target.dataset.type;
  var idx = event.target.dataset.idx;
  var student_no = event.target.dataset.student_no;
  var student_name = event.target.dataset.student_name;
  var date_no = event.target.dataset.date_no;
  //점수 현황 JSON 업데이트 및 DB동기화
  UpdateScore(
    type,
    "",
    idx,
    student_no,
    student_name,
    date_no,
    event.target.value
  );
});

$(document).on("click", "#filterToggle", (event) => {
  if ($("#filterToggle").text() == "필터 열기") {
    $("#filter").show(500);
    $("#filterToggle").text("필터 닫기");
  } else {
    $("#filter").hide(500);
    $("#filterToggle").text("필터 열기");
  }
});

//avatar 클릭 처리
$(document).on("click", ".avatar", (event) => {
  const studentsno = event.target.dataset.no;
  const avatarUpload = $("#avatarUpload");
  avatarUpload.attr("data-no", studentsno);
  avatarUpload.click();
});

$(document).on("change", "#avatarUpload", (event) => {
  const studentsno = event.target.dataset.no;

  formData = new FormData();
  formData.append("studentsno", studentsno);
  formData.append("file", $("#avatarUpload")[0].files[0]);
  $.ajax({
    type: "post",
    url: "./changeAvatar",
    async: "true",
    data: formData,
    processData: false,
    contentType: false,
    success: function (data) {
      $("#avatar_" + studentsno).attr("src", data);
    },
  });
  event.target.value = "";
});
