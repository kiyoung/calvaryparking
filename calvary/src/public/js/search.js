//Initial references
const input = document.querySelectorAll(".input");
const inputField = document.querySelector(".inputfield");
let inputCount = 0,
  finalInput = "";

var isModal = false;
function init() {
  startInput();
}

//Update input
const updateInputConfig = (element, disabledStatus) => {
  element.disabled = disabledStatus;
  if (!disabledStatus) {
    element.focus();
  } else {
    element.blur();
  }
};

var last;

input.forEach((element) => {
  element.addEventListener("keydown", (e) => {
    e.preventDefault();
    // keyup 대신 keydown으로 변경
    if (e.key === "Backspace" && e.target.value.length === 0) {
      if (inputCount === 0) {
        updateInputConfig(e.target, false);
        return;
      }
      finalInput = finalInput.substring(0, finalInput.length - 1);
      updateInputConfig(e.target.previousElementSibling, false);
      e.target.previousElementSibling.value = "";
      inputCount -= 1;
      $(".searchResult").find(".carnumber").remove();
    }

    if (e.key.match(/[0-9]/)) {
      e.target.value = e.key;
      last = e.target;
      let value = e.key;
      if (value.length === 1) {
        updateInputConfig(e.target, true);
        if (inputCount <= 3 && e.key !== "Backspace") {
          finalInput += value;
          if (inputCount < 3) {
            e.target.nextElementSibling.value = "";
            updateInputConfig(e.target.nextElementSibling, false);
          }
        }
        inputCount += 1;
      } else if (value.length === 0 && e.key === "Backspace") {
        if (inputCount === 0) {
          updateInputConfig(e.target, false);
          return;
        }
        finalInput = finalInput.substring(0, finalInput.length - 1);
        updateInputConfig(e.target, true);
        e.target.previousElementSibling.value = "";
        updateInputConfig(e.target.previousElementSibling, false);
        inputCount -= 1;
      } else if (value.length > 1) {
        e.target.value = value.split("")[0];
      }

      if (inputCount > 3) {
        Search(finalInput);
      }
    }
  });
});

window.addEventListener("keydown", (e) => {
  // keyup 대신 keydown으로 변경
  console.log(e, inputCount);
  if (inputCount > 3) {
    if (e.key === "Backspace" && isModal === false) {
      finalInput = finalInput.substring(0, finalInput.length - 1);
      updateInputConfig(inputField.lastElementChild, false);
      inputField.lastElementChild.value = "";
      inputCount -= 1;
      $(".searchResult").find(".carnumber").remove();
    }
  }
});

var searchResults = [];

function Search(digits) {
  $.post(
    "/search",
    {
      digits: digits,
    },
    (data) => {
      if (data.length === 0) {
        $(".searchResult").append(
          `
              <div class='row'>
                <span class="carnumber">결과가 없습니다</span>
              </div>
            `
        );
      }
      data.forEach((row) => {
        searchResults[row.no] = row;
        $(".searchResult").append(
          `
            <div class='row'>
              <button class="carnumber" data-no="${row.no}"><span class='nameplate'>${row.name}</span> ${row.car_number_full}${row.car_number_4digit}</button>
            </div>
          `
        );
      });
    }
  );
}

$(document).on("change", ".input-field", (event) => {
  console.log(event);
});

$(document).on("click", ".addnew", (event) => {
  $("#no").val("");
  $("#name").val("");
  $("#cellphone").val("010");
  $("#car_number_full").val("");
  $("#car_number_4digit").val(finalInput);
  $("#car_type").val("");
  $("#part").val("");
  $("#regdate").val("");
  $("#note").val("");
  $("#overlay").fadeIn();
  $("#modal").addClass("active").fadeIn();
  isModal = true;
  $("#saveButton").text("등록");
});

$(document).on("click", ".carnumber", (event) => {
  var no = event.target.dataset.no;
  if (no === undefined) {
    return;
  }
  var data = searchResults[no];
  $("#no").val(no);
  $("#name").val(data.name);
  $("#cellphone").val(data.cellphone);
  $("#car_number_full").val(data.car_number_full);
  $("#car_number_4digit").val(data.car_number_4digit);
  $("#car_type").val(data.car_type);
  $("#part").val(data.part);
  $("#regdate").val(data.regdate);
  $("#note").val(data.note);
  $("#overlay").fadeIn();
  $("#modal").addClass("active").fadeIn();
  isModal = true;
  $("#saveButton").text("수정");
  $("#deleteButton").show();
});

$(document).on("click", "#deleteButton", (event) => {
  event.preventDefault();
  var no = $("#no").val();
  $.post(
    "/delete",
    {
      no: no,
    },
    (data) => {
      showToast("정보를 삭제했습니다.", "greenflash");
      $("#saveButton").text("재등록");
      $("#no").val("");
      $(`.carnumber[data-no='${no}']`).each(function () {
        $(this).remove();
      });
    }
  );
});

//오버레이 감추기
$("#overlay").on("click touchstart", function (event) {
  if (event.target === this) {
    $("#overlay").fadeOut();
    $("#modal").removeClass("active").fadeOut();
    isModal = false;
  }
});

//발송 버튼
$("#confirmButton").click(function (event) {
  event.preventDefault();
  var no = $("#no").val();
  var name = $("#name").val();
  var cellphone = $("#cellphone").val();
  var car_number_full = $("#car_number_full").val();
  var car_number_4digit = $("#car_number_4digit").val();
  var car_type = $("#car_type").val();
  var part = $("#part").val();
  var regdate = $("#regdate").val();
  var note = $("#note").val();

  var carnumber = car_number_full + car_number_4digit;

  cellphone = cellphone.replace(/-/g, "");
  var regex = /^\d{10,11}$/;
  if (regex.test(cellphone) === false) {
    showToast("휴대폰번호를 확인해주세요", "redflash");
    return;
  }
  if (carnumber.length < 4) {
    showToast("차량번호를 확인해주세요", "redflash");
    return;
  }

  $("#overlay").fadeOut();
  $("#modal").removeClass("active").fadeOut();
  isModal = false;
  SendMessage(no, name, carnumber, cellphone);
});

$("#closeButton").click(function (event) {
  $("#overlay").fadeOut();
  $("#modal").removeClass("active").fadeOut();
  isModal = false;
  event.preventDefault();
});

//발송 버튼
$("#saveButton").click(function (event) {
  event.preventDefault();
  var no = $("#no").val();
  var name = $("#name").val();
  var cellphone = $("#cellphone").val();
  var car_number_full = $("#car_number_full").val();
  var car_number_4digit = $("#car_number_4digit").val();
  var car_type = $("#car_type").val();
  var part = $("#part").val();
  var regdate = $("#regdate").val();
  var note = $("#note").val();

  var carnumber = car_number_full + car_number_4digit;

  cellphone = cellphone.replace(/-/g, "");
  var regex = /^\d{10,11}$/;
  if (regex.test(cellphone) === false) {
    showToast("휴대폰번호를 확인해주세요", "redflash");
    return;
  }
  if (carnumber.length < 4) {
    showToast("차량번호를 확인해주세요", "redflash");
    return;
  }

  $.post(
    "/modify",
    {
      no: no,
      name: name,
      cellphone: cellphone,
      car_number_full: car_number_full,
      car_number_4digit: car_number_4digit,
      car_type: car_type,
      part: part,
      regdate: regdate,
      note: note,
    },
    (data) => {
      var cno = no;
      if (data.insertId > 0) {
        cno = data.insertId;
      }
      searchResults[cno] = {};
      searchResults[cno].no = cno;
      searchResults[cno].name = name;
      searchResults[cno].cellphone = cellphone;
      searchResults[cno].car_number_full = car_number_full;
      searchResults[cno].car_number_4digit = car_number_4digit;
      searchResults[cno].car_type = car_type;
      searchResults[cno].part = part;
      searchResults[cno].regdate = regdate;
      searchResults[cno].note = note;
      if (data.insertId === 0) {
        showToast("정보를 수정했습니다.", "greenflash");
      } else {
        showToast("정보를 등록했습니다.", "greenflash");
        $("#no").val(data.insertId);
        $("#saveButton").text("수정");

        var carnumber = car_number_full + car_number_4digit;

        $(".searchResult").append(
          `
            <div class='row'>
              <button class="carnumber" data-no="${data.insertId}"><span class='nameplate'>${name}</span> ${carnumber}</button>
            </div>
          `
        );
      }
    }
  );
});

function SendMessage(no, name, carnumber, cellphone) {
  $.post(
    "/sendmessage",
    {
      no: no,
      name: name,
      carnumber: carnumber,
      cellphone: cellphone,
    },
    (data) => {
      console.log(data);
      showToast("알림톡을 발송했습니다.", "greenflash");
    }
  );
}

function showToast(message, color) {
  console.log("showToast:", color);
  $(".messageBox").text(message);
  $(".messageBox").addClass(color);

  setTimeout(function () {
    $(".messageBox").removeClass(color);
    $(".messageBox").text("");
  }, 3000);
}

//Start
const startInput = () => {
  $(".searchResult").find(".carnumber").remove();
  inputCount = 0;
  finalInput = "";
  input.forEach((element) => {
    element.value = "";
  });
  updateInputConfig(inputField.firstElementChild, false);
};

window.onload = startInput();

document.addEventListener("DOMContentLoaded", () => {
  var page = document.getElementById("page");
  page.classList.add("fade-in"); // 페이지 로드 시에 fade-in 클래스 추가
});
