//반선택을 부, 학년, 반 으로 하도록 한다
//날짜와 반이 선택 되면 해당 학생 정보를 보여준다.
//학생 정보를 수정하면 실시간으로 수정한다.
//필터 쿠키는 출석 체크와 공유하도록 한다.
var selectlist = ["part", "grade", "class"];
var selectname = ["부", "학년", "반"];
var part_list = new Set(); //DB에 존재하는 부 리스트 (2부, 3부...)
var grade_list = new Set(); //DB에 존재하는 학년 리스트
var class_list = new Set(); //DB에 존재하는 반 리스트
var lists = [part_list, grade_list, class_list];

//selection 정보
var selected_part; //선택 된 부
var selected_grade; //선택 된 학년
var selected_class; //선택 된 반

///////////// 여기서 부터 필터 생성 함수
$(document).ready(function () {
  //반 선택 UI
  jQuery.ajaxSetup({ async: false });

  $.get("/api_student/class", (data) => {
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

  // 첫 로딩 시 아무 필터 없이 전체 학생을 가지고 오기 위해 콜
  MakeStudentListUI();
});

//일단 SSL이 아니기 때문에 쿠키 대신 로컬스토리지를 활용한다.
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

function deleteCookie(name) {
  /*setCookie(name, "", {
    "max-age": -1,
  });*/
  localStorage.removeItem(name);
}

///////// cookie로 부터 마지막 필터 옵션 가져온다
function makeFilterOptionByCookie() {
  if (
    selected_part === undefined &&
    selected_grade === undefined &&
    selected_class === undefined
  ) {
    /*selected_part = getCookie("selected_part");
    selected_grade = getCookie("selected_grade");
    selected_class = getCookie("selected_class");*/
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

//현재 입력 된 필터 정보를 가져와 업데이트 하는 함수
function UpdateSelectedUI() {
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

/////////여기서부터 학생 수정UI 생성 함수
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
    $.get(
      "/api_student/student",
      {
        part: selected_part,
        grade: selected_grade,
        class: selected_class,
      },
      (data) => {
        //필터 변동 시 기존 학생리스트를 지운 후
        $("#ui_student_add").empty();
        $("#ui_student_list").empty();
        if (data.length == 0) {
          var _grade = selected_grade.replace("학년", "");
          var _class = (selected_class.toString()).replace("반", "");
          $("#ui_student_list").append(
            `${selected_part}부 ${_grade} - ${_class} 에는 학생이 없습니다.`
          );
        }
        //신규 학생리스트를 생성한다.
        for (var i = 0; i < data.length; i++) {
          var row = data[i];
          console.log(row);
          var inputUI = "";

          var lastType = "";
          var isDivOpen = false;
          //성별이 있으면 성별 표시
          var gender = "";
          if (row.gender != null) gender = `[${row.gender}]`;

          //수정 UI
          var _grade = row.grade.replace("학년", "");
          var _class = row.class.toString().replace("반", "");
          $("#ui_student_list").append(
            `
            <div class="card border-dark text-dark mt-4 shadow 
            ${row.is_show == "N" ? "opacity-50" : ""}">
                <h5 class="card-header fw-bolder" id = "label_${row.studentsno}">
                    <span class="text-primary">
                        [${row.part}부 ${_grade}-${_class}]
                    </span>
                    ${row.name}
                    <span class="text-info">
                        ${gender}
                    </span>
                </h5>
                <div class="card-body">
                  <div class="input-group mb-1">
                    <span class="input-group-text mb-1 addon">부&nbsp;&nbsp;서</span>
                    <select 
                      name="i_part_${row.studentsno}" 
                      id="i_part_${row.studentsno}" 
                      class="form-select form-select mb-1" aria-label=".form-select">
                      <option
                        value="2"
                        ${row.part == "2" ? "selected" : ""}>2부
                      </option>
                      <option
                        value="3"
                        ${row.part == "3" ? "selected" : ""}>3부
                      </option>
                    </select>
                  </div>
                  <div class="input-group mb-1">
                    <span class="input-group-text mb-1 addon">학&nbsp;&nbsp;년</span>
                    <select 
                      name="i_grade_${row.studentsno}" 
                      id="i_grade_${row.studentsno}"
                      class="form-select form-select mb-1" aria-label=".form-select">
                      <option
                        value="4"
                        ${row.grade == "4" ? "selected" : ""}>4학년
                      </option>
                      <option
                        value="5"
                        ${row.grade == "5" ? "selected" : ""}>5학년
                      </option>
                      <option
                        value="6"
                        ${row.grade == "6" ? "selected" : ""}>6학년
                      </option>
                    </select>
                  </div>
                  <div class="input-group mb-1">
                    <span class="input-group-text mb-1 addon">학&nbsp;&nbsp;반</span>
                    <select 
                      name="i_class_${row.studentsno}"
                       id="i_class_${row.studentsno}"
                       class="form-select form-select mb-1" aria-label=".form-select">
                      <option
                        value="1"
                        ${row.class == "1" ? "selected" : ""}>1반
                      </option>
                      <option
                        value="2"
                        ${row.class == "2" ? "selected" : ""}>2반
                      </option>
                      <option
                        value="3"
                        ${row.class == "3" ? "selected" : ""}>3반
                      </option>
                      <option
                        value="4"
                        ${row.class == "4" ? "selected" : ""}>4반
                      </option>
                      <option
                        value="5"
                        ${row.class == "5" ? "selected" : ""}>5반
                      </option>
                    </select>
                  </div>
                  <div class="input-group mb-1">
                    <span class="input-group-text mb-1 addon">성&nbsp;&nbsp;별</span>
                    <select 
                      name ="i_gender_${row.studentsno}"
                      id="i_gender_${row.studentsno}"
                      class="form-select form-select mb-1" aria-label="" required >
                        <option
                          value="" 
                          ${row.gender ? "" : "selected"} disabled>미입력</option>
                        <option
                          value="남"
                          ${row.gender == "남" ? "selected" : ""}>남
                        </option>
                        <option
                          value="여"
                          ${row.gender == "여" ? "selected" : ""}>여
                        </option>
                    </select>
                  </div>
                  <div class="input-group mb-1">
                    <span class="input-group-text addon" id="i_name">이름</span>
                    <input
                      id="i_name_${row.studentsno}"
                      name="i_name_${row.studentsno}"
                      type="text" class="form-control" placeholder="미입력" aria-label="이름" aria-describedby="i_name"
                      value="${row.name ? row.name : ""}">
                  </div>
                  <div class="input-group mb-1">
                    <span class="input-group-text addon" id="i_birth">생년월일</span>
                    <input
                      id="i_birth_${row.studentsno}"
                      name="i_birth_${row.studentsno}"
                      type="text" class="form-control birthpicker" placeholder="미입력" aria-label="생년월일" aria-describedby="i_birth"
                      value="${row.birth ? row.birth : ""}">
                  </div>
                  <div class="input-group mb-1">
                    <span class="input-group-text addon">주&nbsp;&nbsp;소</span>
                    <textarea 
                    id="i_address_${row.studentsno}" 
                    name="i_address_${row.studentsno}" 
                    class="form-control resizeable"
                    placeholder="미입력"
                    >${row.address ? row.address : ""}</textarea>
                  </div>
                  <div class="input-group mb-1">
                    <span class="input-group-text addon" id="i_phone1">학생번호</span>
                    <input
                      id="i_phone1_${row.studentsno}"
                      name="i_phone1_${row.studentsno}"
                      type="text" class="form-control" placeholder="미입력" aria-label="학생번호" aria-describedby="i_phone1"
                      value="${row.phone1 ? row.phone1 : ""}">
                  </div>
                  <div class="input-group mb-1">
                    <span class="input-group-text addon" id="i_phone2">부모번호</span>
                    <input
                      id="i_phone2_${row.studentsno}"
                      name="i_phone2_${row.studentsno}"
                      type="text" class="form-control" placeholder="미입력" aria-label="부보번호" aria-describedby="i_phone2"
                      value="${row.phone2 ? row.phone2 : ""}">
                  </div>
                  <div class="card-footer">
                    <button 
                    id="delete_${row.studentsno}"
                    value="${row.studentsno}"
                    class="btn 
                    ${row.is_show == "Y"
              ? "btn-danger deleteStudent"
              : "btn-info showStudent"
            }"> 
                    ${row.is_show == "Y" ? "숨기기" : "보이기"}
                    </button>
                    <button
                    id="submit_${row.studentsno}"
                    value="${row.studentsno}"
                    type="submit" class="btn btn-secondary saveChangeButton" disabled>변경사항 저장</button>
                  </div>
                <div>                
            </div>`
          );
        }
      }
    );
  }
}

//////여기서부터 EVENT처리 함수
$(document).on("click", "#filterToggle", (event) => {
  if ($("#filterToggle").text() == "필터 열기") {
    $("#filter").show(500);
    $("#filterToggle").text("필터 닫기");
  } else {
    $("#filter").hide(500);
    $("#filterToggle").text("필터 열기");
  }
});

//textarea 수정 시 자동 줄 높이 조절
$(document).on("change keyup focus clear", ".resizeable", (event) => {
  event.target.style.overflow = "hidden";
  event.target.style.height = 0;
  event.target.style.height = event.target.scrollHeight + "px";
});

//수정이 이루어지면 저장 버튼 활성화
$(document).on(
  "change keyup clear",
  "input[type='text'],textarea,select",
  function (event) {
    var row = event.target.id.split("_").pop();
    $("#submit_" + row).prop("disabled", false);
    $("#submit_" + row).removeClass("btn-secondary");
    $("#submit_" + row).addClass("btn-primary");
  }
);

// 저장버튼 누르면 DB 업데이트
$(document).on("click", ".saveChangeButton", (event) => {
  var row = event.target.value;
  var new_part = $("#i_part_" + row).val();
  var new_grade = $("#i_grade_" + row).val();
  var new_gender = $("#i_gender_" + row).val();
  var new_class = $("#i_class_" + row).val();
  var new_name = $("#i_name_" + row).val();
  var new_address = $("#i_address_" + row).val();
  var new_phone1 = $("#i_phone1_" + row).val();
  var new_phone2 = $("#i_phone2_" + row).val();
  var new_birth = $("#i_birth_" + row).val();
  $.get(
    "/api_student/update_info",
    {
      row: row,
      part: new_part,
      grade: new_grade,
      gender: new_gender,
      class: new_class,
      name: new_name,
      address: new_address,
      phone1: new_phone1,
      phone2: new_phone2,
      birth: new_birth,
    },
    (data) => {
      if (data.code != null) {
        $.toast({
          text: `<p class="text_toast"> 업데이트 실패 </p>`,
          showHideTransition: "slide",
          bgColor: "#FF3333",
          textColor: "#FFF",
          hideAfter: 3000,
          position: "top-center",
        });
      } else {
        $.toast({
          text: `<p class="text_toast"> ${new_part}부 ${new_grade}학년 ${new_class}반 ${new_name} <br> 변경 완료</p>`,
          showHideTransition: "slide",
          bgColor: "#3c454d",
          textColor: "#FFF",
          hideAfter: 2000,
          stack: 1,
          position: "top-center",
        });
        MakeStudentListUI();
      }
    }
  );
});

// 삭제버튼 누르면 is_show를 N으로 변경하고 리스트에 나타나지 않게 함.
$(document).on("click", ".deleteStudent,.showStudent", (event) => {
  var row = event.target.value;
  var text = event.target.innerText;
  var del_part = $("#i_part_" + row).val();
  var del_grade = $("#i_grade_" + row).val();
  var del_class = $("#i_class_" + row).val();
  var del_name = $("#i_name_" + row).val();
  var result = false;
  var is_show = "";
  if (text == "숨기기") {
    result = true;
    /*= confirm(
      del_name + "을 출석체크에서 숨길까요? 데이터는 삭제되지 않고, 보이기를 누르면 복구 됩니다."
    );*/
    is_show = "N";
  } else {
    result = true;
    is_show = "Y";
  }
  if (result) {
    $.get(
      "/api_student/showhide",
      {
        no: row,
        is_show: is_show,
      },
      (data) => {
        if (data.code != null) {
          $.toast({
            text: `<p class="text_toast"> ${del_name} ${text} 실패 </p>`,
            showHideTransition: "slide",
            bgColor: "#FF3333",
            textColor: "#FFF",
            hideAfter: 3000,
            position: "top-center",
          });
        } else {
          $.toast({
            text: `<p class="text_toast"> ${del_part} ${del_grade} ${del_class} ${del_name} <br> 출석체크에서 ${text} 완료</p>`,
            showHideTransition: "slide",
            bgColor: "#3c454d",
            textColor: "#FFF",
            hideAfter: 5000,
            stack: 1,
            position: "top-center",
          });
          MakeStudentListUI();
        }
      }
    );
  }
});

// 신규 추가 버튼
$(document).on("click", "#add_student", () => {
  $("#ui_student_add").fadeIn(1500);
  $("#ui_student_add").empty();

  // 부 옵션
  var part_select_string = "";
  for (var i = 2; i <= 3; i++) {
    part_select_string += `
      <option value="${i}"
        ${selected_part == i ? "selected" : ""}>${i}부
      </option>
    `;
  }

  // 학년 옵션 생성
  var grade_select_string = "";
  for (var i = 4; i <= 6; i++) {
    grade_select_string += `
      <option value="${i}"
      ${selected_grade == i ? "selected" : ""}>${i}학년</option>
    `;
  }

  //반 출력
  var class_select_string = "";
  for (var i = 1; i <= 5; i++) {
    class_select_string += `
      <option value="${i}" ${selected_class == i ? "selected" : ""}>${i}반</option>
    `;
  }

  $("#ui_student_add").append(
    `<div class="card border-dark text-dark mt-4 shadow">
          <h5 class="card-header fw-bolder" id = "label">
              <span class="text-primary">
                  신규학생 정보 입력
              </span>
          </h5>
          <div class="card-body">
            <div class="input-group mb-1">
              <span class="input-group-text addon">얼굴사진</span>
              <input
                id="i_face"
                name="i_face"
                type="file" class="form-control" placeholder="사진업로드" aria-label="사진" aria-describedby="i_face"
                accept="image/*"
                value="">
            </div>

            <div class="input-group mb-1">
              <span class="input-group-text mb-1 addon">부&nbsp;&nbsp;서</span>
              <select 
                name="i_part" 
                id="i_part" 
                class="form-select form-select mb-1" aria-label=".form-select">
                ${part_select_string}
              </select >
            </div >
            <div class="input-group mb-1">
              <span class="input-group-text mb-1 addon">학&nbsp;&nbsp;년</span>
              <select 
                name="i_grade" 
                id="i_grade"
                class="form-select form-select mb-1" aria-label=".form-select">
                ${grade_select_string}
              </select>
            </div>
            <div class="input-group mb-1">
              <span class="input-group-text mb-1 addon">학&nbsp;&nbsp;반</span>
              <select
                name="i_class"
                  id="i_class"
                  class="form-select form-select mb-1" aria-label=".form-select">
                ${class_select_string}
              </select>
            </div>
            <div class="input-group mb-1">
              <span class="input-group-text mb-1 addon">성&nbsp;&nbsp;별</span>
              <select 
                name ="i_gender"
                id="i_gender"
                class="form-select form-select mb-1" aria-label="" required >
                  <option value="남"}>남</option>
                  <option value="여"}>여</option>
              </select >
            </div >
            <div class="input-group mb-1">
              <span class="input-group-text addon">이름</span>
              <input
                id="i_name"
                name="i_name"
                type="text" class="form-control" placeholder="미입력" aria-label="이름" aria-describedby="i_name"
                value="">
            </div>
            <div class="input-group mb-1">
              <span class="input-group-text addon">생년월일</span>
              <input
                id="i_birth"
                name="i_birth"
                type="text" class="form-control birthpicker" placeholder="미입력" aria-label="생년월일" aria-describedby="i_birth"
                value="">
            </div>
            <div class="input-group mb-1">
              <span class="input-group-text addon">주&nbsp;&nbsp;소</span>
              <textarea 
              id="i_address" 
              name="i_address" 
              class="form-control resizeable"
              placeholder="미입력"
              ></textarea>
            </div>
            <div class="input-group mb-1">
              <span class="input-group-text addon">학생번호</span>
              <input
                id="i_phone1"
                name="i_phone1"
                type="text" class="form-control" placeholder="미입력" aria-label="학생번호" aria-describedby="i_phone1"
                value="">
            </div>
            <div class="input-group mb-1">
              <span class="input-group-text addon">부모번호</span>
              <input
                id="i_phone2"
                name="i_phone2"
                type="text" class="form-control" placeholder="미입력" aria-label="부보번호" aria-describedby="i_phone2"
                value="">
            </div>
          <div>
          <div class="card-footer">
          <button
            id="submit_NEW"
            type="submit" class="btn btn-primary mb-3">추가</button>
            <button
            id="student_add_cancel"
            type="submit" class="btn btn-danger mb-3">취소</button>
          </div>
      </div>`
  );
});

$(document).on("click", "#student_add_cancel", (event) => {
  $("#ui_student_add").fadeOut(300, function () {
    $("#ui_student_add").empty();
  });
});

// 저장버튼 누르면 DB 업데이트
$(document).on("click", "#submit_NEW", (event) => {
  event.preventDefault();
  var formData = new FormData();
  const new_part = $("#i_part").val();
  const new_grade = $("#i_grade").val();
  const new_class = $("#i_class").val();
  const new_name = $("#i_name").val();
  formData.append('part', new_part);
  formData.append('grade', new_grade);
  formData.append('class', new_class);
  formData.append('name', new_name);
  formData.append('gender', $("#i_gender").val());
  formData.append('address', $("#i_address").val());
  formData.append('phone1', $("#i_phone1").val());
  formData.append('phone2', $("#i_phone2").val());
  formData.append('birth', $("#i_birth").val());
  formData.append('file', $('#i_face')[0].files[0]);
  $.ajax({
    type: "post",
    url: "./add_student",
    async: "true",
    data: formData,
    processData: false,
    contentType: false,
    statusCode: {
      200: function (data) {
        if (data.code != null) {
          $.toast({
            text: `<p class="text_toast"> 추가 실패 </p> `,
            showHideTransition: "slide",
            bgColor: "#FF3333",
            textColor: "#FFF",
            hideAfter: 3000,
            position: "top-center",
          });
        } else {
          $.toast({
            text: `<p class="text_toast"> ${new_part}부 ${new_grade}학년 ${new_class}반 ${new_name} <br> 추가 완료</p>`,
            showHideTransition: "slide",
            bgColor: "#3c454d",
            textColor: "#FFF",
            hideAfter: 2000,
            stack: 1,
            position: "top-center",
          });
          MakeStudentListUI();
        }
      },
    },
    error: function (err) {
      if (err.status !== 200 && err.status !== 201) {
        alert('서버 응답이 없습니다.');
      }
    },
    cache: false,
  });
});
