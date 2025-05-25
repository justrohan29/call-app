const status = document.getElementById("status");
const joinBtn = document.getElementById("join-btn");
const roomKeyInput = document.getElementById("room-key");

let socket;
let localStream;
let peerConnection;

const configuration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

joinBtn.onclick = async () => {
  const roomKey = roomKeyInput.value.trim();
  if (!roomKey) {
    status.innerText = "Please enter a valid room key.";
    return;
  }

  joinBtn.disabled = true;
  roomKeyInput.disabled = true;

  socket = io("https://idkcall.up.railway.app"); // ← Replace with your Railway backend URL

  try {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (err) {
    status.innerText = "Microphone access denied or error occurred.";
    return;
  }

  socket.emit("join", roomKey);
  status.innerText = `Joined room: ${roomKey}`;

  peerConnection = new RTCPeerConnection(configuration);

  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.ontrack = event => {
    const [remoteStream] = event.streams;
    playStream(remoteStream);
    status.innerText = "Call connected!";
  };

  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit("ice-candidate", {
        room: roomKey,
        candidate: event.candidate
      });
    }
  };

  socket.on("user-joined", async () => {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit("offer", { room: roomKey, offer });
  });

  socket.on("offer", async ({ offer }) => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit("answer", { room: roomKey, answer });
  });

  socket.on("answer", async ({ answer }) => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  });

  socket.on("ice-candidate", ({ candidate }) => {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  });
};

function playStream(stream) {
  const audio = new Audio();
  audio.srcObject = stream;
  audio.play();
}
