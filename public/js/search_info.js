let searchResults = {};
let isModal = false;

$(document).ready(function () {
    $("#searchButton").click(performSearch);

    $("#searchKeyword").keypress(function (e) {
        if (e.which === 13) {
            performSearch();
        }
    });

    setupModalHandlers();
});

function performSearch() {
    const keyword = $("#searchKeyword").val().trim();

    if (!keyword) {
        showToast("검색어를 입력해주세요.", "redflash");
        return;
    }

    $.post("/search-by-info", {
        keyword: keyword
    }, function (data) {
        displaySearchResults(data);
    }).fail(function (error) {
        showToast("검색 중 오류가 발생했습니다.", "redflash");
        console.error(error);
    });
}

function displaySearchResults(results) {
    const resultDiv = $(".searchResult");
    resultDiv.empty();
    resultDiv.append('<div class="row"><button class="addnew">신규등록</button></div>');

    if (results.length === 0) {
        resultDiv.append(`
            <div class='row'>
                <span class="carnumber">결과가 없습니다</span>
            </div>
        `);
        return;
    }

    results.forEach((item) => {
        searchResults[item.no] = item;
        resultDiv.append(`
            <div class='row'>
                <button class="carnumber" data-no="${item.no}">
                    <span class='nameplate'>${item.name}</span> 
                    ${item.car_number_full}${item.car_number_4digit}
                </button>
            </div>
        `);
    });
}

function setupModalHandlers() {
    $(document).on('click', '.carnumber', function () {
        const no = $(this).data('no');
        const data = searchResults[no];
        if (!data) return;

        $("#no").val(data.no);
        $("#name").val(data.name);
        $("#cellphone").val(data.cellphone);
        $("#car_number_full").val(data.car_number_full);
        $("#car_number_4digit").val(data.car_number_4digit);
        $("#car_type").val(data.car_type);
        $("#part").val(data.part);
        $("#note").val(data.note);

        $("#overlay").fadeIn();
        $("#modal").addClass("active").fadeIn();
        $("#saveButton").text("수정");
        $("#deleteButton").show();
        isModal = true;
    });

    $(document).on('click', '.addnew', function () {
        $("#no").val("");
        $("#name").val("");
        $("#cellphone").val("010");
        $("#car_number_full").val("");
        $("#car_number_4digit").val("");
        $("#car_type").val("");
        $("#part").val("");
        $("#note").val("");

        $("#overlay").fadeIn();
        $("#modal").addClass("active").fadeIn();
        $("#saveButton").text("등록");
        $("#deleteButton").hide();
        isModal = true;
    });

    $("#closeButton").click(function () {
        $("#overlay").fadeOut();
        $("#modal").removeClass("active").fadeOut();
        isModal = false;
    });

    $("#saveButton").click(function () {
        var data = {
            no: $("#no").val(),
            name: $("#name").val(),
            cellphone: $("#cellphone").val(),
            car_number_full: $("#car_number_full").val(),
            car_number_4digit: $("#car_number_4digit").val(),
            car_type: $("#car_type").val(),
            part: $("#part").val(),
            note: $("#note").val()
        };

        $.post("/modify", data, function (response) {
            showToast("저장되었습니다.", "greenflash");
            $("#overlay").fadeOut();
            $("#modal").removeClass("active").fadeOut();
            performSearch(); // 저장 후 검색 결과 새로고침
        });
    });

    $("#deleteButton").click(function () {
        var no = $("#no").val();
        $.post("/delete", { no: no }, function (response) {
            showToast("삭제되었습니다.", "greenflash");
            $("#overlay").fadeOut();
            $("#modal").removeClass("active").fadeOut();
            performSearch(); // 삭제 후 검색 결과 새고침
        });
    });
}

function showToast(message, className) {
    $(".messageBox").text(message);
    $(".messageBox").removeClass("greenflash redflash").addClass(className);
    setTimeout(function () {
        $(".messageBox").removeClass(className);
    }, 3000);
}