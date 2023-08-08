$(document).ready(function () {
  //반 선택 UI
  jQuery.ajaxSetup({ async: false });
  $.get("/scoreStatistics", (data) => {
    rawData = data;
  });
  var 부별출석합 = [];
  var 학년별출석합 = [];
  var 학생별점수 = [];
  // Data transformation
  rawData.forEach((item) => {
    var index;
    //부서별 출석합
    index = 부별출석합.findIndex((d) => d.date === item.date);
    if (index === -1) {
      부별출석합.push({ date: item.date, part2: 0, part3: 0, total: 0 });
      index = 부별출석합.length - 1;
    }
    if (item.part === "2") {
      부별출석합[index].part2 += item.출석개수;
    } else {
      부별출석합[index].part3 += item.출석개수;
    }

    //학년별 출석합
    index = 학년별출석합.findIndex((d) => d.date === item.date);
    if (index === -1) {
      학년별출석합.push({
        date: item.date,
        grade4: 0,
        grade5: 0,
        grade6: 0,
        total: 0,
      });
      index = 학년별출석합.length - 1;
    }
    if (item.grade === "4") {
      학년별출석합[index].grade4 += item.출석개수;
    }
    if (item.grade === "5") {
      학년별출석합[index].grade5 += item.출석개수;
    }
    if (item.grade === "6") {
      학년별출석합[index].grade6 += item.출석개수;
    }

    // 학생별 점수 비율
    index = 학생별점수.findIndex((d) => d.no === item.no);
    if (index === -1) {
      학생별점수.push({
        이름: item.name,
        part: item.part,
        grade: item.grade,
        class: item.class,
        date: item.date,
        no: item.no,
        출석: 0,
        설교노트: 0,
        성경지참: 0,
        순전지참: 0,
        큐티: 0,
        미션: 0,
        전도: 0,
        특새: 0,
        보너스: 0,
        기도위원: 0,
        특송위원: 0,
        헌금위원: 0,
        성경필사: 0,
        total: 0,
        출석개수: 0,
      });
      index = 학생별점수.length - 1;
    }

    학생별점수[index].출석 += item.출석;
    학생별점수[index].설교노트 += item.설교노트;
    학생별점수[index].성경지참 += item.성경지참;
    학생별점수[index].순전지참 += item.순전지참;
    학생별점수[index].큐티 += item.큐티;
    학생별점수[index].미션 += item.미션;
    학생별점수[index].전도 += item.전도;
    학생별점수[index].특새 += item.특새;
    학생별점수[index].보너스 += item.보너스;
    학생별점수[index].기도위원 += item.기도위원;
    학생별점수[index].특송위원 += item.특송위원;
    학생별점수[index].헌금위원 += item.헌금위원;
    학생별점수[index].성경필사 += item.성경필사;
    학생별점수[index].total += item.total;
    학생별점수[index].출석개수 += item.출석개수;
  });

  // Calculate totals
  부별출석합.forEach((d) => {
    d.total = d.part2 + d.part3;
  });
  학년별출석합.forEach((d) => {
    d.total = d.grade4 + d.grade5 + d.grade6;
  });

  학생별점수.sort((a, b) => {
    if (a.total > b.total) {
      return -1;
    }
    if (a.total < b.total) {
      return 1;
    }
    return 0;
  });

  //부서별출석합
  const ctx = document.getElementById("부별출석합").getContext("2d");
  const chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: 부별출석합.map((d) => d.date.slice(5, 10)),
      datasets: [
        {
          label: "2부",
          data: 부별출석합.map((d) => d.part2),
          borderColor: "#ffb3b3",
          fill: false,
        },
        {
          label: "3부",
          data: 부별출석합.map((d) => d.part3),
          borderColor: "#61dafb",
          fill: false,
        },
        {
          label: "합계",
          data: 부별출석합.map((d) => d.total),
          borderColor: "#cc67db",
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });

  //학년별출석합
  const ctx2 = document.getElementById("학년별출석합").getContext("2d");
  const chart2 = new Chart(ctx2, {
    type: "bar",
    data: {
      labels: 학년별출석합.map((d) => d.date.slice(5, 10)),
      datasets: [
        {
          label: "4학년",
          data: 학년별출석합.map((d) => d.grade4),
          backgroundColor: "#fee0e0",
        },
        {
          label: "5학년",
          data: 학년별출석합.map((d) => d.grade5),
          backgroundColor: "#61dafb",
        },
        {
          label: "6학년",
          data: 학년별출석합.map((d) => d.grade6),
          backgroundColor: "#cc67db",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });

  학생별점수2부 = 학생별점수.filter((d) => d.part === "2");
  학생별점수3부 = 학생별점수.filter((d) => d.part === "3");
  console.log(학생별점수2부);
  console.log(학생별점수3부);
  //달란트분포차트
  const ctx3 = document.getElementById("달란트분포차트2부").getContext("2d");
  const chart3 = new Chart(ctx3, {
    type: "bar",
    data: {
      labels: 학생별점수2부.map((d, index) => index + 1),
      datasets: [
        {
          label: "획득 달란트",
          data: 학생별점수2부.map((d) => d.total),
          backgroundColor: "#eee0f0",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            footer: function (tooltipItem) {
              index = tooltipItem[0].label;
              return (
                학생별점수2부[index - 1].grade +
                "-" +
                학생별점수2부[index - 1].class +
                " " +
                학생별점수2부[index - 1].이름
              );
            },
          },
        },
      },
    },
  });

  //달란트분포차트3부
  const ctx4 = document.getElementById("달란트분포차트3부").getContext("2d");
  const chart4 = new Chart(ctx4, {
    type: "bar",
    data: {
      labels: 학생별점수3부.map((d, index) => index + 1),
      datasets: [
        {
          label: "획득 달란트",
          data: 학생별점수3부.map((d) => d.total),
          backgroundColor: "#fee0e0",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            footer: function (tooltipItem) {
              index = tooltipItem[0].label;
              return (
                학생별점수3부[index - 1].grade +
                "-" +
                학생별점수3부[index - 1].class +
                " " +
                학생별점수3부[index - 1].이름
              );
            },
          },
        },
      },
    },
  });
});
