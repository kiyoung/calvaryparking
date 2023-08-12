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
    }
  }
});

function Search(digits) {
  $.post(
    "/search",
    {
      digits: digits,
    },
    (data) => {
      data.forEach((row) => {
        console.log(row);
        $(".searchResult").append(
          `
            <div class='row'>
              <button class="carnumber" data-carnumber="${row.car_number_full}" data-carnumber4="${row.car_number_4digit}" data-name="${row.name}" data-cellphone="${row.cellphone}">${row.car_number_full}</button>
            </div>
          `
        );
      });
    }
  );
}

$(document).on("click", ".carnumber", (event) => {
  var carnumber = event.target.dataset.carnumber;
  var carnumber4 = event.target.dataset.carnumber4;
  var name = event.target.dataset.name;
  var cellphone = event.target.dataset.cellphone;

  if (carnumber === undefined || carnumber.length <= 4) {
    carnumber = carnumber4;
  }
  $("#overlay").fadeIn();
  $("#modal").addClass("active").fadeIn();
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
  var phoneNumber = $("#phoneNumber").val();
  var carNumber = $("#carNumber").val();
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
  $(".searchResult").empty();
  inputCount = 0;
  finalInput = "";
  input.forEach((element) => {
    element.value = "";
  });
  updateInputConfig(inputField.firstElementChild, false);
};

window.onload = startInput();
