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

//selection 정보
var selected_part = "전체"; //선택 된 부
var selected_grade; //선택 된 학년
var selected_class; //선택 된 반
var teachers;
var scoreStatus; // 현재 학생 별 점수 현황

///////////// 여기서 부터 필터 생성 함수

$(document).ready(async function () {
    //반 선택 UI
    jQuery.ajaxSetup({ async: false });
    //날짜 선택 UI
    //DB에 생성 된 날짜 개수를 구한다 (출석률 계산용)
    $.get("/api_attendance/dates", (data) => {
        date_n = data.length;
    });

    $.get("/getTeachersInfo", (data) => {
        teachers = data;
    });

    $.get(
        "/score",
        {
        },
        (data) => {
            scoreStatus = new Array();
            data.forEach((row) => {
                scoreStatus[row.no] = row;
            });
        }
    );

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

    // 첫 로딩 시 아무 필터 없이 전체 학생을 가지고 오기 위해 콜
    MakeStudentListUI();
});

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
}

//필터에 따른 학생 리스트와 점수 입력판을 생성하는 함수
async function MakeStudentListUI() {
    UpdateSelectedUI();
    //UI를 생성하기 전 DB에서 기존 입력 된 데이터를 가져온다.
    $.get(
        "/api_attendance/student",
        {
            part: selected_part,
            grade: selected_grade,
            class: selected_class,
        },
        async (data) => {
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

            // 부학년반 변화를 감지하기위한 변수;
            var current_part = "";
            var current_grade = "";
            var current_class = "";
            for (var i = 0; i < data.length; i++) {
                var row = data[i];
                //성별이 있으면 성별 표시
                var gender = "";
                if (row.gender != null) gender = `[${row.gender}]`;
                if (row.part != current_part ||
                    row.grade != current_grade ||
                    row.class != current_class) {
                    current_part = row.part;
                    current_grade = row.grade;
                    current_class = row.class;

                    var teacher = teachers.filter((e) => {
                        return e.part === row.part && e.grade === row.grade && e.class === row.class;
                    });
                    var teacherName = "";
                    var teacherPhone = "";
                    if (teacher.length > 0) {
                        teacherName = teacher[0].name;
                        teacherPhone = teacher[0].cellphone;
                    }
                    $("#ui_student_list").append(`<div class="teacherContainer"><span class="teacher"><span class="teacher-name">${row.part}부 ${row.grade}-${row.class} ${teacherName}</span> <span class="teacher-info"><a class="TeacherSmsLink" href="tel:${teacherPhone}">연락하기</a></span></div>`);
                }
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
                var 출석개수;
                var total;
                if (scoreStatus[row.studentsno]){
                    출석개수 = scoreStatus[row.studentsno].출석개수;
                    total = scoreStatus[row.studentsno].total;
                }
                $("#ui_student_list").append(`
                        <div class= "container col-xxl-4 col-xl-4 col-lg-6 col-md-6 col-sm-12 col-xs-12">
                        <div class="card mb-4">
                            <div class="card-header text-center">
                                <div class="info">
                                    <div class="birth text-left ${isBirthMonth}">
                                        ${isBirthMonth == "birthMonth" ? '<i class="fa-solid fa-cake-candles"></i>' : ''} 생일:${row.birth}
                                    </div>
                                    <div class="name">
                                        [${row.part}부 ${_grade}-${_class}]${row.name}
                                        <span class="text-primary"> ${gender}</span>
                                    </div>
                                    <div class="status">
                                        출석률:<span class="statusItem" id="attendanceRate_${row.studentsno}">${(Math.round(출석개수 / date_n * 100))}%</span>
                                        달란트:<span class="statusItem" id="talents_${row.studentsno}">${total}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="card-body">
                                <img src="${row.face ? row.face : " /public/noface.png"}" alt="face" class="shadow avatar" id="avatar_${row.studentsno}" data-no="${row.studentsno}">
                            </div>
                            <div class="card-footer">
                                <button data-no="${row.studentsno}" class="btn btn-change">사진 수정</button>
                                <button data-no="${row.studentsno}" data-name="${row.name}" class="btn btn-delete">사진 삭제</button>
                            </div>
                        </div>
                    </div >
                        `);
            }
        }
    );
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

//avatar 수정
$(document).on('click', ".btn-change", (event) => {
    const studentsno = event.target.dataset.no;
    const avatarUpload = $("#avatarUpload");
    avatarUpload.attr("data-no", studentsno);
    avatarUpload.click();
});

//avatar 삭제
$(document).on('click', ".btn-delete", (event) => {
    const studentsno = event.target.dataset.no;
    const name = event.target.dataset.name;
    if (!confirm(name + "의 사진을 삭제할까요?")) {
    } else {
        $.ajax({
            type: "post",
            url: "./deleteAvatar",
            async: "true",
            data: {
                no: studentsno
            },
            success: function (data) {
                $("#avatar_" + studentsno).attr("src", "/public/noface.png");
            }
        });
    }
});


$(document).on('change', "#avatarUpload", (event) => {
    const studentsno = event.target.dataset.no;
    formData = new FormData();
    formData.append('studentsno', studentsno);
    formData.append('file', $('#avatarUpload')[0].files[0]);
    $.ajax({
        type: "post",
        url: "./changeAvatar",
        async: "true",
        data: formData,
        processData: false,
        contentType: false,
        success: function (data) {
            $("#avatar_" + studentsno).attr("src", data);
        }
    });
    event.target.value = "";
});

