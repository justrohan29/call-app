const status = document.getElementById('status');
const joinBtn = document.getElementById('join-btn');
const roomKeyInput = document.getElementById('room-key');

let localStream;
let peerConnection;
const socket = io();

const config = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

joinBtn.onclick = async () => {
  const roomKey = roomKeyInput.value.trim();
  if (!roomKey) {
    status.innerText = 'Please enter a valid room key.';
    return;
  }

  joinBtn.disabled = true;
  roomKeyInput.disabled = true;
  status.innerText = 'Joining room...';

  try {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (err) {
    status.innerText = 'Microphone access denied.';
    return;
  }

  socket.emit('join-room', roomKey);

  socket.on('user-joined', async () => {
    peerConnection = new RTCPeerConnection(config);
    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });

    peerConnection.onicecandidate = e => {
      if (e.candidate) {
        socket.emit('signal', e.candidate);
      }
    };

    peerConnection.ontrack = e => {
      playStream(e.streams[0]);
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('signal', offer);
  });

  socket.on('signal', async data => {
    if (!peerConnection) {
      peerConnection = new RTCPeerConnection(config);
      localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStream);
      });

      peerConnection.onicecandidate = e => {
        if (e.candidate) {
          socket.emit('signal', e.candidate);
        }
      };

      peerConnection.ontrack = e => {
        playStream(e.streams[0]);
      };
    }

    if (data.type === 'offer') {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(data));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket.emit('signal', answer);
    } else if (data.type === 'answer') {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(data));
    } else if (data.candidate) {
      try {
        await peerConnection.addIceCandidate(data);
      } catch (e) {
        console.error('Error adding ICE candidate:', e);
      }
    }
  });

  status.innerText = 'Connected. Waiting for peer...';
};

function playStream(stream) {
  const audio = new Audio();
  audio.srcObject = stream;
  audio.play();
  status.innerText = 'Call connected!';
}
