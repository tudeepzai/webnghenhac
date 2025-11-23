
const firebaseConfig = {
  apiKey: "AIzaSyCQhBZZ0vq3PdU1HVXuEIbyIG8ANmbG1Sg",
  authDomain: "webnghenhac-7d2dc.firebaseapp.com",
  projectId: "webnghenhac-7d2dc",
  storageBucket: "webnghenhac-7d2dc.firebasestorage.app",
  messagingSenderId: "202206355300",
  appId: "1:202206355300:web:2b065d8bb6a6469be0e471"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// --- BẮT ĐẦU CODE LOGIC ---

// 1. Kết nối với Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const roomRef = database.ref('phong_nhac'); // Tên phòng trên mạng

var player;
var isSyncing = false; // Biến để chặn vòng lặp vô tận

// 2. Cài đặt YouTube Player
function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '315',
        width: '100%',
        videoId: '5qap5aO4i9A', // Bài hát mặc định (Lofi chill)
        playerVars: { 'autoplay': 0, 'controls': 1 },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    document.getElementById("status").innerText = "Trạng thái: Đã sẵn sàng!";
    // Bắt đầu lắng nghe lệnh từ người kia
    listenToFirebase();
}

// 3. Khi BẠN bấm Play/Pause, gửi lệnh lên mạng
function onPlayerStateChange(event) {
    if (isSyncing) return; // Nếu đang đồng bộ thì không gửi lệnh

    let status = "";
    if (event.data == YT.PlayerState.PLAYING) status = "play";
    if (event.data == YT.PlayerState.PAUSED) status = "pause";

    if (status != "") {
        roomRef.set({
            action: status,
            time: player.getCurrentTime(),
            videoId: player.getVideoData().video_id,
            timestamp: Date.now()
        });
    }
}

// Các nút bấm thủ công
function playVideo() { player.playVideo(); }
function pauseVideo() { player.pauseVideo(); }

// 4. Lắng nghe lệnh từ mạng (Người kia bấm -> Máy mình chạy)
function listenToFirebase() {
    roomRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        isSyncing = true; // Bật cờ đồng bộ

        // Kiểm tra bài hát có đúng không
        if (player.getVideoData().video_id != data.videoId) {
            player.loadVideoById(data.videoId);
        }

        // Kiểm tra thời gian (nếu lệch quá 2 giây thì tua)
        let diff = Math.abs(player.getCurrentTime() - data.time);
        if (diff > 2) {
            player.seekTo(data.time);
        }

        // Kiểm tra trạng thái Play/Pause
        if (data.action == "play" && player.getPlayerState() != 1) {
            player.playVideo();
        } else if (data.action == "pause" && player.getPlayerState() == 1) {
            player.pauseVideo();
        }

        document.getElementById("status").innerText = "Đang phát cùng nhau: " + data.action;
        
        setTimeout(() => { isSyncing = false; }, 1000); // Tắt cờ sau 1s
    });
}

// 5. Chức năng đổi bài
function changeSong() {
    var id = document.getElementById("songId").value;
    if (id) {
        roomRef.set({
            action: "play",
            time: 0,
            videoId: id,
            timestamp: Date.now()
        });
        document.getElementById("songId").value = "";
    }
}