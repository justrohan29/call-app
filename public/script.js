const status = document.getElementById('status');
const joinBtn = document.getElementById('join-btn');
const roomKeyInput = document.getElementById('room-key');

let myPeer;
let myStream;
let currentCall;

async function startCall(roomKey) {
  // Use roomKey as your peer ID
  myPeer = new Peer(roomKey, {
    host: '/',
    port: 3000,
    path: '/peerjs',
  });

  try {
    myStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (err) {
    status.innerText = 'Microphone access denied or error occurred.';
    return;
  }

  myPeer.on('open', id => {
    status.innerText = `Connected as ${id}. Waiting for someone else...`;
  });

  myPeer.on('call', call => {
    if (currentCall) {
      call.close(); // Only allow one call at a time
      return;
    }
    currentCall = call;
    call.answer(myStream);
    status.innerText = 'Receiving call...';

    call.on('stream', remoteStream => {
      playStream(remoteStream);
      status.innerText = 'Call connected!';
    });

    call.on('close', () => {
      status.innerText = 'Call ended.';
      currentCall = null;
    });
  });

  // Try to call the other peer with same ID after small delay
  // If you're second to join, this will trigger the call to first peer
  setTimeout(() => {
    if (myPeer.disconnected || currentCall) return;
    const call = myPeer.call(roomKey, myStream);
    if (call) {
      currentCall = call;
      call.on('stream', remoteStream => {
        playStream(remoteStream);
        status.innerText = 'Call connected!';
      });
      call.on('close', () => {
        status.innerText = 'Call ended.';
        currentCall = null;
      });
    }
  }, 3000);
}

function playStream(stream) {
  const audio = new Audio();
  audio.srcObject = stream;
  audio.play();
}

joinBtn.onclick = () => {
  const roomKey = roomKeyInput.value.trim();
  if (!roomKey) {
    status.innerText = 'Please enter a valid room key.';
    return;
  }
  joinBtn.disabled = true;
  roomKeyInput.disabled = true;
  startCall(roomKey);
};
