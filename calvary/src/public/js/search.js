//Initial references
const input = document.querySelectorAll(".input");
const inputField = document.querySelector(".inputfield");
let inputCount = 0,
  finalInput = "";

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

input.forEach((element) => {
  element.addEventListener("keyup", (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, "");
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
    if (e.key == "Backspace") {
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
  $("#name").val("");
  $("#cellphone").val("");
  $("#car_number_full").val("");
  $("#car_number_4digit").val("");
  $("#car_type").val("");
  $("#part").val("");
  $("#regdate").val("");
  $("#note").val("");
  $("#overlay").fadeIn();
  $("#modal").addClass("active").fadeIn();
  $("#saveButton").text("등록");
});

$(document).on("click", ".carnumber", (event) => {
  var no = event.target.dataset.no;
  var data = searchResults[no];
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
  $("#saveButton").text("수정");
});

//오버레이 감추기
$("#overlay, #modal").on("click touchstart", function (event) {
  if (event.target === this) {
    $("#overlay").fadeOut();
    $("#modal").removeClass("active").fadeOut();
  }
});

$("#confirmButton").click(function () {
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

  var confirmationMessage =
    "이름: " +
    name +
    "\n전화번호: " +
    phoneNumber +
    "\n차량번호: " +
    carNumber +
    "\n위의 정보가 맞습니까?";
  var confirmed = confirm(confirmationMessage);
  if (confirmed) {
    $("#overlay").fadeOut();
    $("#modal").removeClass("active").fadeOut();
  }
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
      console.log(data);
    }
  );
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
