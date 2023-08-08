/*window.addEventListener('DOMContentLoaded', () => {
  const videoList = document.getElementById('videoList');

  fetch('/medialist') // 서버의 /media 엔드포인트에서 동영상 목록을 가져옵니다.
    .then(response => response.json())
    .then(data => {
      data.forEach(video => {
        const videoItem = document.createElement('div');
        videoItem.className = 'video-card col-3'; // video-card 클래스 추가

        const link = document.createElement('a');
        link.href = `/public/media/${video}`; // 선택한 동영상의 경로를 설정합니다.
        link.textContent = video;

        videoItem.appendChild(link);
        videoList.appendChild(videoItem);
      });
    })
    .catch(error => {
      console.error('동영상 목록을 가져오는 중 오류가 발생했습니다:', error);
    });
});
*/

var playlist= [
  {
    name: '7월 바이블챈트',
    description:"마가복음 10장 45절",
    sources: [{
      src: 'https://calcho.org/public/media/7%EC%9B%94%EC%B1%88%ED%8A%B8.mp4',
      type: 'video/mp4'
    }],
    thumbnail: [
      {
        srcset: 'https://calcho.org/public/media/thumbnail.jpg',
        type: 'image/jpeg',
      },
    ]
  },
  {
    name: '6월 바이블챈트',
    description:"사무엘하 22장 29절",
    sources: [{
      src: 'https://calcho.org/public/media/6%EC%9B%94%EC%B1%88%ED%8A%B8.mp4',
      type: 'video/mp4'
    }],
    thumbnail: [
      {
        srcset:'https://calcho.org/public/media/thumbnail.jpg',
        type: 'image/jpeg',
      },
    ]
  },
  {
    name: '5월 바이블챈트',
    description:"갈라디아서 6장 6절",
    sources: [{
      src: 'https://calcho.org/public/media/5%EC%9B%94%EC%B1%88%ED%8A%B8.mp4',
      type: 'video/mp4'
    }],
    thumbnail: [
      {
        srcset: 'https://calcho.org/public/media/thumbnail.jpg',
        type: 'image/jpeg',
      },
    ]
  },
  {
    name: '4월 바이블챈트',
    description:"요한복음 21장 16절",
    sources: [{
      src: 'https://calcho.org/public/media/4%EC%9B%94%EC%B1%88%ED%8A%B8.mp4',
      type: 'video/mp4'
    }],
    thumbnail: [
      {
        srcset: 'https://calcho.org/public/media/thumbnail.jpg',
        type: 'image/jpeg',
      },
    ]
  },
  {
    name: '3월 바이블챈트',
    description:"사무엘상 7장 12절",
    sources: [{
      src: 'https://calcho.org/public/media/3%EC%9B%94%EC%B1%88%ED%8A%B8.mp4',
      type: 'video/mp4'
    }],
    thumbnail: [
      {
        srcset: 'https://calcho.org/public/media/thumbnail.jpg',
        type: 'image/jpeg',
      },
    ]
  },

  {
    name:'2월 바이블챈트',
    description:"룻기 2장 12절",
    sources: [{
      src: 'https://calcho.org/public/media/2%EC%9B%94%EC%B1%88%ED%8A%B8.mp4',
      type: 'video/mp4'
    }],
    
    thumbnail: [
      {
        srcset: 'https://calcho.org/public/media/thumbnail.jpg',
        type: 'image/jpeg',
      },
    ],
  },
];
var player = videojs("preview-player", {
  controls : true,
  muted : false,
  preload : "metadata",
});
player.playlist(playlist);
player.playlist.autoadvance(0);
player.playlistUi();


