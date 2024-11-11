let searchResults = {};
let isModal = false;
let finalInput = "";
let isProcessing = false; // 인식 프로세스 진행 중 여부
let isRecognized = false; // 번호판 인식 완료 여부 추가

// 카메라 관련 변수
let video = document.getElementById('video');
let canvas = document.getElementById('canvas');
let stream = null;
let recognitionInterval = null;

// Tesseract worker 초기화
let worker = null;

// OpenCV 로드 완료 체크
let isOpenCVReady = false;
cv['onRuntimeInitialized'] = () => {
    isOpenCVReady = true;
    console.log('OpenCV Ready');
};

// Tesseract 초기화 함수 수정
async function initTesseract() {
    try {
        worker = await Tesseract.createWorker({
            logger: m => console.log(m),
            errorHandler: err => console.error(err)
        });

        await worker.loadLanguage('eng'); // 한글 대신 영어 모델 사용 (숫자 인식용)
        await worker.initialize('eng');
        await worker.setParameters({
            tessedit_char_whitelist: '0123456789', // 숫자만 인식
            tessedit_pageseg_mode: '7',  // 단일 라인 모드
            tessedit_ocr_engine_mode: '2', // LSTM only
            preserve_interword_spaces: '0',
            textord_heavy_nr: '1',
            textord_min_linesize: '2.5',
            tessjs_create_box: '1', // 인식 영역 정보 생성
            tessjs_create_hocr: '1', // 인식 영역 좌표 정보 포함
            debug_file: '/dev/null',
            debug_level: '0'
        });

        console.log('Tesseract 초기화 완료');
        showToast("번호판 인식 엔진 준비 완료", "greenflash");
    } catch (err) {
        console.error('Tesseract 초기화 오류:', err);
        showToast("번호판 인식 엔진 초기화 실패", "redflash");
    }
}

// 번호판 텍스트 정제 함수 수정
function cleanLicensePlateText(text) {
    // 모든 공백과 특수문자 제거하고 숫자만 추출
    const cleaned = text.replace(/[^0-9]/g, '');
    console.log('숫자만 추출:', cleaned);

    if (cleaned.length < 4) return null;

    // 오른쪽에서부터 4자리 숫자 추출
    const lastFourDigits = cleaned.slice(-4);
    console.log('마지막 4자리:', lastFourDigits);

    // 4자리가 모두 숫자인지 확인
    if (/^\d{4}$/.test(lastFourDigits)) {
        return lastFourDigits;
    }

    return null;
}

// 번호판 패턴 검증 함수 추가
function validateLicensePlate(text) {
    // 기본 번호판 패턴 (예: 12가3456, 123가4567)
    const pattern = /^(\d{2,3})[가-힣](\d{4})$/;

    // 허용되는 한글 문자 목록
    const validHangul = ['가', '나', '다', '라', '마', '바', '사', '아', '자', '차', '카', '타', '파', '하',
        '거', '너', '더', '러', '머', '버', '서', '어', '저', '처', '커', '터', '퍼', '허'];

    const match = text.match(pattern);
    if (!match) return null;

    const [_, numbers1, numbers2] = match;
    const hangul = text.charAt(numbers1.length);

    // 한글이 유효한지 확인
    if (!validHangul.includes(hangul)) return null;

    return {
        prefix: numbers1,
        hangul: hangul,
        suffix: numbers2
    };
}

// 카메라 시작
async function startCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });
        video.srcObject = stream;
        startAutoRecognition();
        showToast("카메라가 시작되었습니다.", "greenflash");
    } catch (err) {
        console.error('카메라 접근 오류:', err);
        showToast("카메라를 사용할 수 없습니다.", "redflash");
    }
}

// 자동 인식 시작 함수
function startAutoRecognition() {
    if (recognitionInterval) {
        clearInterval(recognitionInterval);
    }
    // 0.5초마다 번호판 인식 시도
    recognitionInterval = setInterval(async () => {
        if (!isProcessing && !isRecognized) { // isRecognized 체크 추가
            try {
                await recognizePlate();
            } catch (err) {
                console.error('인식 오류:', err);
            }
        }
    }, 500);
}

// 이미지 전처리 함수 수정
async function preprocessImage(imageData) {
    if (!isOpenCVReady) {
        console.log('OpenCV not ready');
        return null;
    }

    // 상수 정의
    const PLATE_WIDTH_PADDING = 1.3;
    const PLATE_HEIGHT_PADDING = 1.5;
    const MIN_PLATE_RATIO = 3;
    const MAX_PLATE_RATIO = 10;
    const MIN_AREA = 1000;
    const MIN_ASPECT_RATIO = 3.5;
    const MAX_ASPECT_RATIO = 6.0;

    try {
        // 1. 이미지 로드 및 초기화
        let src = cv.imread(imageData);
        let gray = new cv.Mat();
        let blurred = new cv.Mat();
        let thresh = new cv.Mat();
        let dst = new cv.Mat();

        // 2. 그레이스케일 변환
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

        // 3. 가우시안 블러 적용
        cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);

        // 4. Adaptive Thresholding
        cv.adaptiveThreshold(
            blurred,
            thresh,
            255,
            cv.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv.THRESH_BINARY_INV,
            19,
            9
        );

        // 5. Contours 찾기
        let contours = new cv.MatVector();
        let hierarchy = new cv.Mat();
        cv.findContours(
            thresh,
            contours,
            hierarchy,
            cv.RETR_LIST,
            cv.CHAIN_APPROX_SIMPLE
        );

        // 6. 번호판 후보 필터링
        let maxArea = 0;
        let bestRect = null;

        for (let i = 0; i < contours.size(); i++) {
            let contour = contours.get(i);
            let rect = cv.boundingRect(contour);
            let area = rect.width * rect.height;
            let aspectRatio = rect.width / rect.height;

            if (area > MIN_AREA &&
                aspectRatio > MIN_ASPECT_RATIO &&
                aspectRatio < MAX_ASPECT_RATIO &&
                area > maxArea) {
                maxArea = area;
                bestRect = rect;
            }
        }

        // 7. 번호판 영역 추출 및 처리
        if (bestRect) {
            let roi = src.roi(bestRect);

            // 크기 정규화
            cv.resize(roi, dst, new cv.Size(520, 110));

            // 대비 향상
            cv.cvtColor(dst, dst, cv.COLOR_RGBA2GRAY);
            cv.adaptiveThreshold(
                dst,
                dst,
                255,
                cv.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv.THRESH_BINARY,
                11,
                2
            );

            // 노이즈 제거
            let kernel = cv.Mat.ones(2, 2, cv.CV_8U);
            cv.morphologyEx(dst, dst, cv.MORPH_CLOSE, kernel);
            cv.morphologyEx(dst, dst, cv.MORPH_OPEN, kernel);

            // 결과 표시
            cv.imshow('processCanvas', dst);

            // 메모리 해제
            roi.delete();
            kernel.delete();
        }

        // 메모리 해제
        src.delete();
        gray.delete();
        blurred.delete();
        thresh.delete();
        contours.delete();
        hierarchy.delete();

        return dst;

    } catch (err) {
        console.error('이미지 전처리 오류:', err);
        return null;
    }
}

// 번호판 인식 함수 수정
async function recognizePlate() {
    if (!stream || isProcessing || !worker) return;

    isProcessing = true;

    try {
        // 비디오 프레임 캡처
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);

        // 이미지 전처리
        const processedImage = await preprocessImage(canvas);

        if (!processedImage) {
            console.log('이미지 전처리 실패');
            return;
        }

        // Canvas를 base64 이미지로 변환
        const processCanvas = document.getElementById('processCanvas');
        const imageData = processCanvas.toDataURL('image/png');

        // 이미지 전처리 (대비 향상)
        const enhancedCanvas = document.createElement('canvas');
        enhancedCanvas.width = processCanvas.width;
        enhancedCanvas.height = processCanvas.height;
        const enhancedCtx = enhancedCanvas.getContext('2d');

        // 이미지 로드 및 대비 향상
        const img = new Image();
        img.onload = async () => {
            enhancedCtx.filter = 'contrast(150%) brightness(120%)';
            enhancedCtx.drawImage(img, 0, 0);

            try {
                // Tesseract로 텍스트 인식
                const result = await worker.recognize(enhancedCanvas);
                console.log('원본 인식 텍스트:', result.data.text);

                // 인식 영역 표시
                const ctx = enhancedCanvas.getContext('2d');
                ctx.strokeStyle = 'red';
                ctx.lineWidth = 2;

                // 인식된 각 단어의 영역을 빨간색 박스로 표시
                if (result.data.words) {
                    result.data.words.forEach(word => {
                        const { bbox } = word;
                        ctx.strokeRect(
                            bbox.x0,
                            bbox.y0,
                            bbox.x1 - bbox.x0,
                            bbox.y1 - bbox.y0
                        );
                    });
                }

                // 처리된 이미지를 다시 표시
                cv.imshow('processCanvas', cv.matFromImageData(ctx.getImageData(0, 0, enhancedCanvas.width, enhancedCanvas.height)));

                // 텍스트에서 마지막 4자리 숫자 추출
                const fourDigits = cleanLicensePlateText(result.data.text);

                if (fourDigits && fourDigits !== finalInput) {
                    console.log('인식된 마지막 4자리:', fourDigits);

                    // 입력 필드에 숫자 표시
                    document.querySelectorAll('.input').forEach((element, index) => {
                        element.value = fourDigits[index];
                    });

                    finalInput = fourDigits;
                    isRecognized = true; // 인식 완료 표시

                    if (recognitionInterval) {
                        clearInterval(recognitionInterval); // 인식 중단
                    }

                    // 즉시 검색 실행
                    Search(fourDigits);
                    showToast(`번호판 인식 완료: ${fourDigits}`, "greenflash");
                }

            } catch (err) {
                console.error('텍스트 인식 오류:', err);
            }
        };
        img.src = imageData;

        // 메모리 해제
        processedImage.delete();

    } catch (err) {
        console.error('번호판 인식 오류:', err);
        showToast("번호판 인식에 실패했습니다.", "redflash");
    } finally {
        isProcessing = false;
    }
}

// 페이지 나갈 때 정리
window.addEventListener('beforeunload', async () => {
    if (recognitionInterval) {
        clearInterval(recognitionInterval);
    }
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    if (worker) {
        await worker.terminate();
    }
});

// Toast 메시지 표시 함수
function showToast(message, className) {
    $(".messageBox").text(message);
    $(".messageBox").removeClass("greenflash redflash").addClass(className);
    setTimeout(function () {
        $(".messageBox").removeClass(className);
    }, 3000);
}

// Search 함수 수정
function Search(digits) {
    $.post(
        "/search",
        {
            digits: digits,
        },
        (data) => {
            $(".searchResultCamera").find(".carnumber").not(".addnew").remove();

            if (data.length === 0) {
                $(".searchResultCamera").append(
                    `<div class='row'>
                        <span class="carnumber">결과가 없습니다</span>
                    </div>`
                );
            }

            data.forEach((row) => {
                searchResults[row.no] = row;
                $(".searchResultCamera").append(
                    `<div class='row'>
                        <button class="carnumber" data-no="${row.no}">
                            <span class='nameplate'>${row.name}</span> 
                            ${row.car_number_full}${row.car_number_4digit}
                        </button>
                    </div>`
                );
            });
        }
    );
}

// 모달 관련 이벤트 핸들러
$(document).on("click", ".carnumber", (event) => {
    var no = event.target.dataset.no;
    if (no === undefined) return;

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

// 모달 관련 이벤트 핸들러 추가
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
    $("#deleteButton").hide();
});

// 발송 버튼
$("#confirmButton").click(function (event) {
    event.preventDefault();
    var no = $("#no").val();
    var name = $("#name").val();
    var cellphone = $("#cellphone").val();
    var car_number_full = $("#car_number_full").val();
    var car_number_4digit = $("#car_number_4digit").val();
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

// 저장 버튼
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
            searchResults[cno] = {
                no: cno,
                name: name,
                cellphone: cellphone,
                car_number_full: car_number_full,
                car_number_4digit: car_number_4digit,
                car_type: car_type,
                part: part,
                regdate: regdate,
                note: note
            };

            if (data.insertId === 0) {
                showToast("정보를 수정했습니다.", "greenflash");
            } else {
                showToast("정보를 등록했습니다.", "greenflash");
                $("#no").val(data.insertId);
                $("#saveButton").text("수정");

                $(".searchResultCamera").append(`
                    <div class='row'>
                        <button class="carnumber" data-no="${data.insertId}">
                            <span class='nameplate'>${name}</span> ${carnumber}
                        </button>
                    </div>
                `);
            }
        }
    );
});

// 삭제 버튼
$("#deleteButton").click(function (event) {
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

// 닫기 버튼
$("#closeButton").click(function (event) {
    $("#overlay").fadeOut();
    $("#modal").removeClass("active").fadeOut();
    isModal = false;
    event.preventDefault();
});

// 오버레이 클릭 시 모달 닫기
$("#overlay").on("click touchstart", function (event) {
    if (event.target === this) {
        $("#overlay").fadeOut();
        $("#modal").removeClass("active").fadeOut();
        isModal = false;
    }
});

// 메시지 발송 함수
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

// 페이지 로드 시 Tesseract 초기화 및 카메라 시작
document.addEventListener("DOMContentLoaded", async () => {
    var page = document.getElementById("page");
    page.classList.add("fade-in");
    await initTesseract();
    await startCamera(); // 카메라 자동 시작
});