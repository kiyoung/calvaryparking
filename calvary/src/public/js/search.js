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
  element.addEventListener("keyup", (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, "");
    last = e.target;
    let { value } = e.target;

    if (value.length == 1) {
      updateInputConfig(e.target, true);
      if (inputCount <= 3 && e.key != "Backspace") {
        finalInput += value;
        if (inputCount < 3) {
          updateInputConfig(e.target.nextElementSibling, false);
        }
      }
      inputCount += 1;
    } else if (value.length == 0 && e.key == "Backspace") {
      finalInput = finalInput.substring(0, finalInput.length - 1);
      if (inputCount == 0) {
        updateInputConfig(e.target, false);
        return false;
      }
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
  });
});

window.addEventListener("keyup", (e) => {
  if (inputCount > 3) {
    if (e.key == "Backspace" && isModal === false) {
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
      data.forEach((row) => {
        searchResults[row.no] = row;
        var carnumber = row.car_number_full;
        if (
          row.car_number_full === undefined ||
          row.car_number_full.length <= 4
        ) {
          carnumber = row.car_number_4digit;
        }
        $(".searchResult").append(
          `
            <div class='row'>
              <button class="carnumber" data-no="${row.no}">${row.name}/${carnumber}</button>
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
  $("#cellphone").val("");
  $("#car_number_full").val(finalInput);
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
  var name = $("#name").val();
  var cellphone = $("#cellphone").val();
  var car_number_full = $("#car_number_full").val();
  var car_number_4digit = $("#car_number_4digit").val();
  var car_type = $("#car_type").val();
  var part = $("#part").val();
  var regdate = $("#regdate").val();
  var note = $("#note").val();

  var carnumber = car_number_full;
  if (car_number_full.length <= 4) {
    carnumber = car_number_4digit;
  }

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
  SendMessage(name, carnumber, cellphone);
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

  var carnumber = car_number_full;
  if (car_number_full.length <= 4) {
    carnumber = car_number_4digit;
  }

  cellphone = cellphone.replace(/-/g, "");
  var regex = /^\d{10,11}$/;
  if (regex.test(cellphone) === false) {
    showToast("휴대폰번호를 확인해주세요", "");
    return;
  }
  if (carnumber.length < 4) {
    showToast("차량번호를 확인해주세요");
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
      console.log(data);
      console.log(cno);
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

        var carnumber = car_number_full;
        if (car_number_full.length <= 4) {
          carnumber = car_number_4digit;
        }
        $(".searchResult").append(
          `
            <div class='row'>
              <button class="carnumber" data-no="${data.insertId}">${name}/${carnumber}</button>
            </div>
          `
        );
      }
    }
  );
});

function SendMessage(name, carnumber, cellphone) {
  $.post(
    "/sendmessage",
    {
      name: name,
      carnumber: carnumber,
      cellphone: cellphone,
    },
    (data) => {
      showToast("알림톡을 발송했습니다.", "greenflash");
    }
  );
}

function showToast(message, color) {
  console.log(color);
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
