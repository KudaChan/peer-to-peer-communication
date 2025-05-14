import { store } from "@/redux/store";
import { socket } from "../socket/socket.services";
import { addPeer, getPeer } from "@/redux/features/call/peerStore";
import { addLocalStream } from "@/redux/features/call/call.slice";
import {
  newUserJoinedCall,
  receiveSignallingMessage,
  userLeftCall,
} from "../socket/call.services";
import { IStream } from "@/types/redux";
import { receiveInCallMessage } from "../socket/chat.services";
import { addMessage } from "@/redux/features/chat/chat.slice";
import { toastMessage } from "@/components/Notifications/toasts";

// Initialize local stream:
export const initLocalStream = async () => {
  let localStream: MediaStream = new MediaStream();
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    // disable video and audio tracks:
    localStream.getVideoTracks()[0].enabled = false;
    localStream.getAudioTracks()[0].enabled = false;
  } catch (err) {
    toastMessage({
      type: "error",
      message: "Camera and Mic Permission Required",
    });
  } finally {
    // Add local stream to peerStore:
    addPeer(socket.id, { stream: localStream, connection: null });
    // Add local stream to redux store:
    store.dispatch(
      addLocalStream({
        peerId: socket.id,
        user: {
          id: store.getState().user.id,
          name: store.getState().user.name,
        },
      })
    );

    // Mount socket events:

    // New user joined the call:
    newUserJoinedCall();

    // User left the call:
    userLeftCall();

    // Receive signalling message:
    receiveSignallingMessage();

    // Receive chat message:
    receiveInCallMessage((data) => {
      store.dispatch(addMessage(data));
    });
  }
};

// Turn on/off video and audio:
export const toggleVideoAudio = async (
  streamData: IStream,
  toggle: "video" | "audio"
) => {
  const peer = getPeer(streamData.peerId);
  const stream = peer?.stream;

  if (!stream) {
    console.log("Stream not found");
    return;
  }

  // For video:
  if (toggle === "video") {
    try {
      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack) {
        console.log("No video track found");
        return;
      }
      videoTrack.enabled = !videoTrack.enabled;
    } catch (err) {
      console.log("Video track error:", err);
    }
  }

  // For audio:
  if (toggle === "audio") {
    try {
      const audioTrack = stream.getAudioTracks()[0];
      if (!audioTrack) {
        console.log("No audio track found");
        return;
      }
      audioTrack.enabled = !audioTrack.enabled;
    } catch (err) {
      console.log("Audio track error:", err);
    }
  }
};
