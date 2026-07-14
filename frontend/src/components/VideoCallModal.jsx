import React, { useEffect, useRef, useState } from "react";
import Peer from "simple-peer";
import { Phone, PhoneOff, Video, Mic, MicOff, VideoOff, MonitorUp, Minimize2, Maximize2, Waves, Disc2, StopCircle, Sparkles, Wifi, Volume2, Crop } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";

export default function VideoCallModal({ socket, userId, incomingCall, setIncomingCall, callUser, setCallUser, isCallMuted }) {
  const [stream, setStream] = useState();
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const screenTrackRef = useRef(null);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  const [callTime, setCallTime] = useState(0);
  const callTimerRef = useRef(null);

  // Phase 3 Screen Sharing state
  const [peerScreenSharing, setPeerScreenSharing] = useState({ isSharing: false, presenterName: "" });

  // Phase 3 Background Blur state & refs
  const [isBgBlurred, setIsBgBlurred] = useState(false);
  const hiddenVideoRef = useRef(null);
  const blurCanvasRef = useRef(null);
  const blurAnimationRef = useRef(null);
  const blurredStreamRef = useRef(null);

  // Phase 3 Call Quality state
  const [callQuality, setCallQuality] = useState({ rtt: 0, fps: 30, packetsLost: 0, rating: "good" });

  // Phase 3 Recording Consent state
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentRequester, setConsentRequester] = useState("");
  const [isWaitingForConsent, setIsWaitingForConsent] = useState(false);

  // Phase 1 (Step 5) Active Speaker detection state
  const [activeSpeakers, setActiveSpeakers] = useState({});

  // Phase 3 Group Call (Mesh) states & refs
  const [peers, setPeers] = useState([]);
  const peersRef = useRef({});
  
  // Phase 1 (Step 4 & Step 6) Audio Output Device Selection and Peer Wave Canvas states/refs
  const [audioOutputs, setAudioOutputs] = useState([]);
  const [selectedOutput, setSelectedOutput] = useState("");
  const peerCanvasesRef = useRef({});
  const peerVideoElementsRef = useRef({});

  // Phase 1 (Step 8 & Step 9) Aspect-Ratio Crop Toggle and Call Log Sync states/refs
  const [isCropCover, setIsCropCover] = useState(true);
  const callTimeRef = useRef(0);

  // Phase 3 Audio visualizer refs
  const audioCanvasRef = useRef(null);
  const audioAnalyserRef = useRef(null);
  const audioCtxRef = useRef(null);
  const audioSrcRef = useRef(null);
  const audioAnimationRef = useRef(null);
  
  const { user } = useAuth();

  const isAudioCall = incomingCall?.type === 'audio' || callUser?.type === 'audio';
  const callRoomId = incomingCall?.channelId || (callUser?.isGroup ? callUser.id : null);

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleEndCall = (emitEvent = true) => {
    setCallEnded(true);
    if (isRecording) {
      stopRecording();
    }
    if (connectionRef.current) connectionRef.current.destroy();
    
    // Destroy group peers
    if (peersRef.current) {
      Object.values(peersRef.current).forEach(peer => {
        try { peer.destroy(); } catch (e) {}
      });
      peersRef.current = {};
    }
    setPeers([]);

    if (emitEvent && socket && (incomingCall || callUser)) {
      socket.emit("end_call", { to: incomingCall ? incomingCall.from : callUser.id });
    }
    // Sync call log to DB (Step 9)
    const duration = callTimeRef.current;
    if (duration > 0 && !incomingCall && callUser) {
      const participants = callUser.isGroup 
        ? peers.map(p => ({ user: p.socketId })) 
        : [{ user: callUser.id }];
      api.post('/calls/log', {
        channelId: callRoomId || null,
        participants: participants,
        startTime: new Date(Date.now() - duration * 1000),
        endTime: new Date(),
        duration: duration,
        type: isAudioCall ? 'audio' : 'video',
        status: 'completed',
        callerId: user?._id || user?.id
      }).catch(err => console.warn("Failed to log call to DB:", err));
    }
    callTimeRef.current = 0;

    setStream(null);
    if (setIncomingCall) setIncomingCall(null);
    if (setCallUser) setCallUser(null);
  };

  // Ringtone generator for incoming calls (synthesized Web Audio API)
  useEffect(() => {
    if (incomingCall && !callAccepted && !callEnded && !isCallMuted) {
      let ringtoneInterval;
      let audioCtx;
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContextClass();
        
        const playPulse = () => {
          if (audioCtx.state === 'suspended') {
            audioCtx.resume();
          }
          const osc1 = audioCtx.createOscillator();
          const osc2 = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          
          osc1.type = "sine";
          osc1.frequency.setValueAtTime(440, audioCtx.currentTime); // A4 (chime 1)
          osc2.type = "sine";
          osc2.frequency.setValueAtTime(480, audioCtx.currentTime); // chime 2 (beat frequency)
          
          gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);
          
          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(audioCtx.destination);
          
          osc1.start();
          osc2.start();
          osc1.stop(audioCtx.currentTime + 1.2);
          osc2.stop(audioCtx.currentTime + 1.2);
        };
        
        playPulse();
        ringtoneInterval = setInterval(playPulse, 2000);
      } catch (err) {
        console.warn("Lỗi phát nhạc chuông:", err);
      }
      
      return () => {
        if (ringtoneInterval) clearInterval(ringtoneInterval);
        if (audioCtx && audioCtx.state !== 'closed') {
          audioCtx.close();
        }
      };
    }
  }, [incomingCall, callAccepted, callEnded, isCallMuted]);

  // Effect for Call Ringing Timeout (Step 2)
  useEffect(() => {
    let ringTimeout;
    if ((incomingCall || callUser) && !callAccepted && !callEnded) {
      ringTimeout = setTimeout(() => {
        toast.error(incomingCall ? "Cuộc gọi nhỡ (Không trả lời)" : "Đối phương không bắt máy");
        if (socket) {
          const partnerId = incomingCall ? incomingCall.from : callUser.id;
          socket.emit("end_call", { to: partnerId });
        }
        handleEndCall(false);
      }, 45000); // 45 seconds
    }
    return () => {
      if (ringTimeout) clearTimeout(ringTimeout);
    };
  }, [incomingCall, callUser, callAccepted, callEnded, socket]);

  const bindIceStateChange = (peer, isInitiator) => {
    if (!peer || !peer._pc) return;
    peer._pc.oniceconnectionstatechange = () => {
      const state = peer._pc.iceConnectionState;
      console.log("WebRTC ICE State:", state);
      if (state === 'failed' || state === 'disconnected') {
        console.warn("ICE connection lost/failed. Initiating connection repair...");
        if (isInitiator) {
          startCallReconnection();
        }
      }
    };
  };

  const startCallReconnection = () => {
    console.log("Initiating WebRTC connection repair offer...");
    if (connectionRef.current) {
      try { connectionRef.current.destroy(); } catch (e) {}
    }
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });

    peer.on("signal", (data) => {
      const partnerId = incomingCall ? incomingCall.from : callUser?.id;
      if (partnerId) {
        socket.emit("call_reconnect_offer", { signal: data, to: partnerId });
      }
    });

    peer.on("stream", (currentStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = currentStream;
      }
    });

    bindIceStateChange(peer, true);
    connectionRef.current = peer;
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };


  const toggleBgBlur = () => {
    if (!stream) return;
    if (!isBgBlurred) {
      // Create canvas & hidden video
      const hiddenVideo = document.createElement("video");
      hiddenVideo.muted = true;
      hiddenVideo.playsInline = true;
      hiddenVideo.srcObject = stream;
      hiddenVideo.play();
      hiddenVideoRef.current = hiddenVideo;

      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      blurCanvasRef.current = canvas;
      const ctx = canvas.getContext("2d");

      const drawFrame = () => {
        if (!hiddenVideo || hiddenVideo.paused || hiddenVideo.ended) return;
        ctx.save();
        // Draw blurred background
        ctx.filter = "blur(12px)";
        ctx.drawImage(hiddenVideo, 0, 0, canvas.width, canvas.height);
        ctx.restore();

        // Draw sharp central focus body
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(canvas.width / 2, canvas.height / 2, 160, 225, 0, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(hiddenVideo, 0, 0, canvas.width, canvas.height);
        ctx.restore();

        blurAnimationRef.current = requestAnimationFrame(drawFrame);
      };

      hiddenVideo.onloadedmetadata = () => {
        drawFrame();
        const processedStream = canvas.captureStream(30);
        blurredStreamRef.current = processedStream;
        const canvasTrack = processedStream.getVideoTracks()[0];
        const originalVideoTrack = stream.getVideoTracks()[0];

        if (connectionRef.current && originalVideoTrack && canvasTrack) {
          try {
            connectionRef.current.replaceTrack(originalVideoTrack, canvasTrack, stream);
          } catch (e) {
            console.error("Failed to replace track with blurred track", e);
          }
        }
        if (myVideo.current) {
          myVideo.current.srcObject = processedStream;
        }
        setIsBgBlurred(true);
        toast.success("Đã bật làm mờ nền bảo mật");
      };
    } else {
      // Turn off blur
      if (blurAnimationRef.current) cancelAnimationFrame(blurAnimationRef.current);
      if (hiddenVideoRef.current) {
        hiddenVideoRef.current.srcObject = null;
        hiddenVideoRef.current = null;
      }
      
      const originalVideoTrack = stream.getVideoTracks()[0];
      const canvasTrack = blurredStreamRef.current?.getVideoTracks()[0];

      if (connectionRef.current && canvasTrack && originalVideoTrack) {
        try {
          connectionRef.current.replaceTrack(canvasTrack, originalVideoTrack, stream);
        } catch (e) {
          console.error("Failed to restore original camera track", e);
        }
      }
      if (myVideo.current) {
        myVideo.current.srcObject = stream;
      }
      blurredStreamRef.current = null;
      setIsBgBlurred(false);
      toast.success("Đã tắt làm mờ nền");
    }
  };

  const handleRequestRecording = () => {
    const partnerId = incomingCall ? incomingCall.from : callUser?.id;
    if (socket && partnerId) {
      setIsWaitingForConsent(true);
      socket.emit("request_recording_permission", { to: partnerId, requesterName: user?.name || "Người quản lý" });
      toast.success("Đang gửi yêu cầu đối phương cấp quyền ghi cuộc gọi...");
    } else {
      startRecording();
    }
  };

  const createInitiatorPeer = (toSocketId, fromSocketId, userStream) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: userStream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });

    peer.on("signal", (data) => {
      socket.emit("send_call_signal", {
        toSocketId,
        signal: data,
        fromUserId: user?._id || user?.id,
        fromName: user?.name
      });
    });

    peer.on("stream", (peerStream) => {
      setPeers(prev => {
        if (prev.find(p => p.socketId === toSocketId)) return prev;
        return [...prev, { socketId: toSocketId, stream: peerStream, name: "" }];
      });
    });

    return peer;
  };

  const createReceiverPeer = (fromSocketId, userStream) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: userStream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });

    peer.on("signal", (data) => {
      socket.emit("return_call_signal", {
        toSocketId: fromSocketId,
        signal: data
      });
    });

    peer.on("stream", (peerStream) => {
      setPeers(prev => {
        if (prev.find(p => p.socketId === fromSocketId)) return prev;
        return [...prev, { socketId: fromSocketId, stream: peerStream, name: "" }];
      });
    });

    return peer;
  };


  const startCall = () => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });

    peer.on("signal", (data) => {
      socket.emit("call_user", {
        userToCall: callUser.id,
        signalData: data,
        from: userId,
        name: callUser.callerName,
        type: callUser.type || 'video'
      });
    });

    peer.on("stream", (currentStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = currentStream;
      }
    });

    bindIceStateChange(peer, true);
    connectionRef.current = peer;
  };

  const answerCall = () => {
    setCallAccepted(true);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });

    peer.on("signal", (data) => {
      socket.emit("answer_call", { signal: data, to: incomingCall.from });
    });

    peer.on("stream", (currentStream) => {
      if (userVideo.current) {
        userVideo.current.srcObject = currentStream;
      }
    });

    peer.signal(incomingCall.signal);
    bindIceStateChange(peer, false);
    connectionRef.current = peer;
  };

  const startRecording = () => {
    if (!stream) return;
    
    let streamToRecord;
    let options = { mimeType: 'video/webm' };
    
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContextClass();
      const dest = audioContext.createMediaStreamDestination();
      
      // 1. Connect local audio stream
      if (stream.getAudioTracks().length > 0) {
        const localSource = audioContext.createMediaStreamSource(stream);
        localSource.connect(dest);
      }
      
      // 2. Connect remote audio streams (Group calls or 1-1)
      if (callUser?.isGroup) {
        peers.forEach(p => {
          if (p.stream && p.stream.getAudioTracks().length > 0) {
            try {
              const remoteSource = audioContext.createMediaStreamSource(p.stream);
              remoteSource.connect(dest);
            } catch (err) {
              console.warn("Failed to connect peer audio track to mix destination", err);
            }
          }
        });
      } else if (userVideo.current && userVideo.current.srcObject && userVideo.current.srcObject.getAudioTracks().length > 0) {
        const remoteSource = audioContext.createMediaStreamSource(userVideo.current.srcObject);
        remoteSource.connect(dest);
      }

      // 3. Collect video track if not audio-only call
      if (!isAudioCall) {
        let videoTrack = null;
        if (callUser?.isGroup) {
          const peerWithVideo = peers.find(p => p.stream && p.stream.getVideoTracks().length > 0);
          if (peerWithVideo) {
            videoTrack = peerWithVideo.stream.getVideoTracks()[0];
          }
        } else if (userVideo.current && userVideo.current.srcObject && userVideo.current.srcObject.getVideoTracks().length > 0) {
          videoTrack = userVideo.current.srcObject.getVideoTracks()[0];
        }

        // Fallback to local video track if no remote video tracks are active yet
        if (!videoTrack && stream.getVideoTracks().length > 0) {
          videoTrack = stream.getVideoTracks()[0];
        }

        if (videoTrack) {
          streamToRecord = new MediaStream([videoTrack, ...dest.stream.getTracks()]);
        } else {
          streamToRecord = dest.stream;
        }
      } else {
        streamToRecord = dest.stream;
      }
    } catch (e) {
      console.warn("Không thể mix audio, fallback ghi luồng camera địa phương", e);
      streamToRecord = stream;
    }

    recordedChunksRef.current = [];
    
    // Choose compatible mimeType
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported) {
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        options = { mimeType: 'video/webm;codecs=vp9' };
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        options = { mimeType: 'video/webm' };
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        options = { mimeType: 'video/mp4' };
      }
    }

    try {
      const mediaRecorder = new MediaRecorder(streamToRecord, options);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (recordedChunksRef.current.length === 0) {
          toast.error("Không có dữ liệu cuộc gọi để ghi âm.");
          setIsRecording(false);
          return;
        }
        
        const mimeTypeExt = options.mimeType.includes('mp4') ? 'mp4' : 'webm';
        const blob = new Blob(recordedChunksRef.current, { type: `video/${mimeTypeExt}` });
        const formData = new FormData();
        formData.append('recording', blob, `call-${Date.now()}.${mimeTypeExt}`);
        formData.append('clientId', incomingCall ? incomingCall.from : callUser.id);
        formData.append('callType', isAudioCall ? 'audio' : 'video');
        formData.append('duration', recordingTime);

        try {
          await api.post('/recordings/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          toast.success('Đã lưu file ghi âm thành công!');
        } catch (err) {
          console.error('Lỗi upload file ghi âm:', err);
          toast.error('Lỗi lưu file ghi âm cuộc gọi.');
        }
        
        clearInterval(recordingTimerRef.current);
        setRecordingTime(0);
        setIsRecording(false);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Failed to start MediaRecorder", err);
      toast.error("Thiết bị không hỗ trợ ghi định dạng video WebRTC này.");
    }
  };

  useEffect(() => {
    // Nếu đang có cuộc gọi đi hoặc đến, lấy media
    if (incomingCall || callUser) {
      const isVideoCallMode = !isAudioCall;

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVideoOn(isVideoCallMode);

      navigator.mediaDevices.getUserMedia({ video: isVideoCallMode, audio: true })
        .then((currentStream) => {
          setStream(currentStream);
          if (myVideo.current) {
            myVideo.current.srcObject = currentStream;
          }

          // Tự động gọi nếu là ngừơi khởi xướng
          if (callUser) {
            if (callUser.isGroup) {
              setCallAccepted(true);
              socket.emit('join_call_room', { roomId: callUser.id, userId, name: user?.name });
            } else if (incomingCall && callUser.id === incomingCall.from) {
              // Auto answer if accepting incoming call from banner
              answerCall();
            } else if (!incomingCall) {
              startCall();
            }
          }
        })
        .catch(err => {
          console.error("Failed to get local stream", err);
          alert("Không thể truy cập Camera/Mic. Kiểm tra quyền trình duyệt!");
        });
    }

    return () => {
      // Cleanup stream khi unmount
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [incomingCall, callUser]);

  useEffect(() => {
    if (socket) {
      socket.on("call_accepted", (signal) => {
        setCallAccepted(true);
        try {
          if (connectionRef.current && (!connectionRef.current._pc || connectionRef.current._pc.signalingState !== 'stable')) {
            connectionRef.current.signal(signal);
          }
        } catch (err) {
          console.warn("Lỗi khi áp dụng signal answer:", err);
        }
      });

      socket.on("call_ended", () => {
        handleEndCall(false);
      });

      socket.on("screen_share_status", ({ isSharing, presenterName }) => {
        setPeerScreenSharing({ isSharing, presenterName });
      });

      socket.on("request_recording_permission", ({ from, requesterName }) => {
        setConsentRequester(requesterName);
        setShowConsentModal(true);
      });

      socket.on("recording_permission_response", ({ accepted }) => {
        setIsWaitingForConsent(false);
        if (accepted) {
          toast.success("Đối phương đã đồng ý ghi âm. Bắt đầu ghi!");
          startRecording();
        } else {
          toast.error("Đối phương từ chối cấp quyền ghi âm cuộc gọi.");
        }
      });

      // Group Calls Mesh sockets
      socket.on('all_call_room_participants', (participants) => {
        participants.forEach(p => {
          const peer = createInitiatorPeer(p.socketId, socket.id, stream);
          peersRef.current[p.socketId] = peer;
        });
      });

      socket.on('user_joined_call', ({ socketId, userId, name }) => {
        const peer = createReceiverPeer(socketId, stream);
        peersRef.current[socketId] = peer;
        setPeers(prev => [...prev.filter(p => p.socketId !== socketId), { socketId, stream: null, name }]);
        toast.success(`${name || 'Một thành viên'} đã tham gia cuộc gọi`);
      });

      socket.on('receive_call_signal', ({ signal, fromSocketId, fromName }) => {
        if (peersRef.current[fromSocketId]) {
          peersRef.current[fromSocketId].signal(signal);
        }
        setPeers(prev => prev.map(p => p.socketId === fromSocketId ? { ...p, name: fromName } : p));
      });

      socket.on('returned_call_signal', ({ signal, fromSocketId }) => {
        if (peersRef.current[fromSocketId]) {
          peersRef.current[fromSocketId].signal(signal);
        }
      });

      socket.on('user_left_call', ({ socketId }) => {
        if (peersRef.current[socketId]) {
          peersRef.current[socketId].destroy();
          delete peersRef.current[socketId];
        }
        setPeers(prev => prev.filter(p => p.socketId !== socketId));
      });

      socket.on('call_reconnect_offer', ({ signal, from }) => {
        console.log("Received WebRTC reconnect offer, answering...");
        if (connectionRef.current) {
          try { connectionRef.current.destroy(); } catch (e) {}
        }
        const peer = new Peer({
          initiator: false,
          trickle: false,
          stream: stream,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:global.stun.twilio.com:3478' }
            ]
          }
        });
        peer.on("signal", (data) => {
          socket.emit("call_reconnect_answer", { signal: data, to: from });
        });
        peer.on("stream", (currentStream) => {
          if (userVideo.current) {
            userVideo.current.srcObject = currentStream;
          }
        });
        bindIceStateChange(peer, false);
        connectionRef.current = peer;
        peer.signal(signal);
      });

      socket.on('call_reconnect_answer', ({ signal }) => {
        console.log("Received WebRTC reconnect answer, resolving repaired connection...");
        try {
          if (connectionRef.current && (!connectionRef.current._pc || connectionRef.current._pc.signalingState !== 'stable')) {
            connectionRef.current.signal(signal);
          }
        } catch (err) {
          console.warn("Failed to apply reconnect answer signal:", err);
        }
      });
    }
    return () => {
      if (socket) {
        socket.off("call_accepted");
        socket.off("call_ended");
        socket.off("screen_share_status");
        socket.off("request_recording_permission");
        socket.off("recording_permission_response");
        socket.off("all_call_room_participants");
        socket.off("user_joined_call");
        socket.off("receive_call_signal");
        socket.off("returned_call_signal");
        socket.off("user_left_call");
        socket.off("call_reconnect_offer");
        socket.off("call_reconnect_answer");
      }
    }
  }, [socket, stream]);

  useEffect(() => {
    if (callAccepted && !callEnded) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCallTime(0);
      callTimeRef.current = 0;
      callTimerRef.current = setInterval(() => {
        setCallTime(prev => {
          const next = prev + 1;
          callTimeRef.current = next;
          return next;
        });
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
    }
    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
    };
  }, [callAccepted, callEnded]);

  // Sync screen share state with partner
  useEffect(() => {
    const partnerId = incomingCall ? incomingCall.from : callUser?.id;
    if (socket && partnerId && callAccepted) {
      socket.emit("screen_share_status", { to: partnerId, isSharing: isScreenSharing, presenterName: user?.name });
    }
  }, [isScreenSharing, socket, incomingCall, callUser, user, callAccepted]);

  // Poll WebRTC quality statistics & adjust bandwidth adaptability dynamically (Step 3 & Step 22)
  useEffect(() => {
    if (!callAccepted || callEnded) return;
    const statsInterval = setInterval(async () => {
      if (connectionRef.current && connectionRef.current._pc) {
        try {
          const pc = connectionRef.current._pc;
          const stats = await pc.getStats();
          let rtt = 0;
          let packetsLost = 0;
          let fps = 30;

          stats.forEach(report => {
            if (report.type === "candidate-pair" && report.state === "succeeded") {
              rtt = Math.round((report.currentRoundTripTime || 0) * 1000);
            }
            if (report.type === "inbound-rtp" && report.kind === "video") {
              packetsLost = report.packetsLost || 0;
              fps = Math.round(report.framesPerSecond || 30);
            }
          });

          let rating = "good";
          if (rtt > 250 || packetsLost > 20) rating = "poor";
          else if (rtt > 120 || packetsLost > 5) rating = "fair";

          setCallQuality({ rtt, fps, packetsLost, rating });

          // Adjust encoding bandwidth (Step 3 Bandwidth Adaptability)
          const senders = pc.getSenders();
          const videoSender = senders.find(sender => sender.track && sender.track.kind === 'video');
          if (videoSender) {
            const parameters = videoSender.getParameters();
            if (parameters && parameters.encodings && parameters.encodings.length > 0) {
              let updated = false;
              if (rating === "poor") {
                if (parameters.encodings[0].scaleResolutionDownBy !== 2) {
                  parameters.encodings[0].scaleResolutionDownBy = 2;
                  parameters.encodings[0].maxBitrate = 200000; // 200 kbps
                  updated = true;
                }
              } else if (rating === "fair") {
                if (parameters.encodings[0].scaleResolutionDownBy !== 1.5) {
                  parameters.encodings[0].scaleResolutionDownBy = 1.5;
                  parameters.encodings[0].maxBitrate = 500000; // 500 kbps
                  updated = true;
                }
              } else {
                if (parameters.encodings[0].scaleResolutionDownBy !== 1) {
                  parameters.encodings[0].scaleResolutionDownBy = 1;
                  parameters.encodings[0].maxBitrate = 1500000; // 1.5 Mbps
                  updated = true;
                }
              }
              if (updated) {
                console.log(`Bandwidth adaptability: set scaleResolutionDownBy to ${parameters.encodings[0].scaleResolutionDownBy}`);
                await videoSender.setParameters(parameters);
              }
            }
          }
        } catch (e) {
          console.warn("Failed to read RTC stats or set bandwidth parameters", e);
        }
      }
    }, 3000);
    return () => clearInterval(statsInterval);
  }, [callAccepted, callEnded]);

  // Active Speaker Detection Loop (Step 5)
  useEffect(() => {
    if (!callAccepted || callEnded) return;
    
    let audioContext;
    const analysers = {};
    const dataArrays = {};
    const sourceNodes = [];
    let monitorInterval;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioContext = new AudioContextClass();
      
      monitorInterval = setInterval(() => {
        const speakers = {};
        
        // 1. Check local audio volume
        if (stream && micOn && stream.getAudioTracks().length > 0) {
          if (!analysers['local']) {
            try {
              const analyser = audioContext.createAnalyser();
              analyser.fftSize = 256;
              const source = audioContext.createMediaStreamSource(stream);
              source.connect(analyser);
              analysers['local'] = analyser;
              dataArrays['local'] = new Uint8Array(analyser.frequencyBinCount);
              sourceNodes.push(source);
            } catch (e) {}
          }
          
          const analyser = analysers['local'];
          if (analyser) {
            analyser.getByteFrequencyData(dataArrays['local']);
            let sum = 0;
            dataArrays['local'].forEach(val => sum += val);
            const avg = sum / dataArrays['local'].length;
            if (avg > 15) {
              speakers['local'] = true;
            }
          }
        }
        
        // 2. Check remote peers' stream volumes
        peers.forEach(p => {
          if (p.stream && p.stream.getAudioTracks().length > 0) {
            const key = p.socketId;
            if (!analysers[key]) {
              try {
                const analyser = audioContext.createAnalyser();
                analyser.fftSize = 256;
                const source = audioContext.createMediaStreamSource(p.stream);
                source.connect(analyser);
                analysers[key] = analyser;
                dataArrays[key] = new Uint8Array(analyser.frequencyBinCount);
                sourceNodes.push(source);
              } catch (e) {}
            }
            
            const analyser = analysers[key];
            if (analyser) {
              analyser.getByteFrequencyData(dataArrays[key]);
              let sum = 0;
              dataArrays[key].forEach(val => sum += val);
              const avg = sum / dataArrays[key].length;
              if (avg > 15) {
                speakers[key] = true;
              }
            }
          }
        });
        
        setActiveSpeakers(speakers);
      }, 400);
    } catch (err) {
      console.warn("Active speaker detection failed to initialize", err);
    }
    
    return () => {
      if (monitorInterval) clearInterval(monitorInterval);
      sourceNodes.forEach(node => { try { node.disconnect(); } catch (e) {} });
      if (audioContext && audioContext.state !== 'closed') {
        try { audioContext.close(); } catch (e) {}
      }
    };
  }, [callAccepted, callEnded, stream, peers, micOn]);

  // Enumerate and monitor audio output devices (Step 6)
  useEffect(() => {
    const getDevices = () => {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
        navigator.mediaDevices.enumerateDevices()
          .then(devices => {
            const outputs = devices.filter(device => device.kind === 'audiooutput');
            setAudioOutputs(outputs);
            if (outputs.length > 0) {
              setSelectedOutput(prev => prev || outputs[0].deviceId);
            }
          })
          .catch(err => console.warn("Failed to enumerate audio output devices", err));
      }
    };
    getDevices();
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices.addEventListener('devicechange', getDevices);
      return () => navigator.mediaDevices.removeEventListener('devicechange', getDevices);
    }
  }, []);

  // Update setSinkId on audio output device change (Step 6)
  useEffect(() => {
    if (selectedOutput) {
      if (userVideo.current && typeof userVideo.current.setSinkId === 'function') {
        userVideo.current.setSinkId(selectedOutput).catch(err => console.warn("setSinkId failed for userVideo", err));
      }
      Object.values(peerVideoElementsRef.current).forEach(el => {
        if (el && typeof el.setSinkId === 'function') {
          el.setSinkId(selectedOutput).catch(err => console.warn("setSinkId failed for peer element", err));
        }
      });
    }
  }, [selectedOutput]);

  // Waveform drawing loop for group call peers (Step 4)
  useEffect(() => {
    if (!callAccepted || callEnded) return;
    
    let animationFrameId;
    let audioContext;
    const analysers = {};
    const dataArrays = {};
    const sourceNodes = [];

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioContext = new AudioContextClass();

      const setupAnalysers = () => {
        peers.forEach(p => {
          if (p.stream && p.stream.getAudioTracks().length > 0) {
            const key = p.socketId;
            if (!analysers[key]) {
              try {
                const analyser = audioContext.createAnalyser();
                analyser.fftSize = 32;
                const source = audioContext.createMediaStreamSource(p.stream);
                source.connect(analyser);
                analysers[key] = analyser;
                dataArrays[key] = new Uint8Array(analyser.frequencyBinCount);
                sourceNodes.push(source);
              } catch (e) {}
            }
          }
        });
      };

      const draw = () => {
        setupAnalysers();
        
        // Draw waveforms for each peer canvas
        Object.keys(peerCanvasesRef.current).forEach(socketId => {
          const canvas = peerCanvasesRef.current[socketId];
          const analyser = analysers[socketId];
          if (canvas && analyser) {
            const ctx = canvas.getContext("2d");
            const bufferLength = analyser.frequencyBinCount;
            analyser.getByteFrequencyData(dataArrays[socketId]);
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const barWidth = (canvas.width / bufferLength) * 1.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
              barHeight = dataArrays[socketId][i] / 12; // Scale down for miniature canvas
              ctx.fillStyle = `rgba(16, 185, 129, ${0.4 + barHeight / 20})`; // Emerald green waves
              ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
              x += barWidth;
            }
          } else if (canvas) {
            // Muted flat red line
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = "rgba(244, 63, 94, 0.4)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, canvas.height / 2);
            ctx.lineTo(canvas.width, canvas.height / 2);
            ctx.stroke();
          }
        });
        
        animationFrameId = requestAnimationFrame(draw);
      };

      draw();
    } catch (err) {
      console.warn("Waveform drawing loop failed to initialize", err);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      sourceNodes.forEach(node => { try { node.disconnect(); } catch (e) {} });
      if (audioContext && audioContext.state !== 'closed') {
        try { audioContext.close(); } catch (e) {}
      }
    };
  }, [callAccepted, callEnded, peers]);

  // Audio wave visualizer canvas animation loop (Step 24)
  useEffect(() => {
    const canvas = audioCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    if (!stream || !micOn) {
      if (audioAnimationRef.current) cancelAnimationFrame(audioAnimationRef.current);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "#f43f5e";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
      return;
    }

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 32;
      audioAnalyserRef.current = analyser;
      
      const source = audioContext.createMediaStreamSource(stream);
      audioSrcRef.current = source;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        if (!audioCanvasRef.current) return;
        analyser.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const barWidth = (canvas.width / bufferLength) * 1.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          barHeight = dataArray[i] / 4;
          ctx.fillStyle = `rgba(99, 102, 241, ${0.4 + barHeight / 60})`;
          ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
          x += barWidth;
        }

        audioAnimationRef.current = requestAnimationFrame(draw);
      };
      draw();
    } catch (err) {
      console.warn("Failed to initialize audio visualizer", err);
    }

    return () => {
      if (audioAnimationRef.current) cancelAnimationFrame(audioAnimationRef.current);
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close();
      }
    };
  }, [stream, micOn]);

  const toggleMic = () => {
    if (stream) {
      stream.getAudioTracks()[0].enabled = !micOn;
      setMicOn(!micOn);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks()[0].enabled = !videoOn;
      setVideoOn(!videoOn);
    }
  };

  const toggleScreenShare = () => {
    if (!isScreenSharing) {
      navigator.mediaDevices.getDisplayMedia({ cursor: true }).then((currentStream) => {
        const screenTrack = currentStream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;
        
        // Replace track in connection
        if (connectionRef.current) {
          const videoTrack = stream?.getVideoTracks()[0];
          if (videoTrack && screenTrack) {
            try {
              connectionRef.current.replaceTrack(videoTrack, screenTrack, stream);
            } catch (err) {
              console.error("Lỗi khi replaceTrack sang màn hình", err);
            }
          }
        }
        
        // Update local video
        if (myVideo.current) {
          myVideo.current.srcObject = currentStream;
        }

        screenTrack.onended = () => {
          stopScreenShare();
        };
        setIsScreenSharing(true);
      }).catch(err => {
        console.error("Lỗi chia sẻ màn hình:", err);
      });
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (connectionRef.current && stream) {
      const videoTrack = stream.getVideoTracks()[0];
      const screenTrack = screenTrackRef.current;
      
      if (videoTrack && screenTrack) {
        try {
          connectionRef.current.replaceTrack(screenTrack, videoTrack, stream);
        } catch (err) {
          console.error("Lỗi khi khôi phục camera track", err);
        }
      }
      
      if (myVideo.current) {
        myVideo.current.srcObject = stream;
      }
      
      if (screenTrack) {
        screenTrack.stop();
      }
      screenTrackRef.current = null;
    }
    setIsScreenSharing(false);
  };

  if (!incomingCall && !callUser) return null;

  return (
    <div className={`fixed z-[9999] transition-all duration-300 ${isMinimized ? 'bottom-4 right-4 w-80 h-auto rounded-3xl shadow-2xl overflow-hidden border border-gray-300' : 'inset-0 flex items-center justify-center p-4 bg-white/90 backdrop-blur-md'}`}>
      <div className={`${isMinimized ? 'bg-idaz-gray p-4' : 'glass-card border border-white/60 rounded-3xl p-6 max-w-4xl w-full shadow-2xl'}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className={`${isMinimized ? 'text-sm' : 'text-xl'} font-bold text-idaz-black flex items-center gap-2`}>
            {isAudioCall ? <Phone className="text-emerald-500" size={isMinimized ? 16 : 24} /> : <Video className="text-indigo-500" size={isMinimized ? 16 : 24} />}
            {incomingCall && !callAccepted ? `Gọi đến từ ${incomingCall.name}` : (isScreenSharing ? "Đang chia sẻ màn hình" : (isAudioCall ? "Cuộc gọi Thoại" : "Cuộc gọi Video"))}
          </h3>
          <div className="flex items-center gap-3">
            {callAccepted && (
              <span className="text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md text-xs font-mono font-bold flex items-center gap-1 border border-emerald-500/20">
                THỜI GIAN: {formatTime(callTime)}
              </span>
            )}
            {callAccepted && (
              <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-md text-xs border border-white/60 select-none group relative cursor-help">
                <Wifi size={14} className={callQuality.rating === 'good' ? 'text-emerald-400' : callQuality.rating === 'fair' ? 'text-amber-400' : 'text-rose-400'} />
                <span className="text-gray-600 font-bold uppercase">{callQuality.rating === 'good' ? 'Tốt' : callQuality.rating === 'fair' ? 'Ổn định' : 'Yếu'}</span>
                {/* Detail tooltip */}
                <div className="absolute top-full right-0 mt-2 hidden group-hover:block bg-idaz-gray/95 border border-white/60 p-2.5 rounded-2xl text-[10px] text-gray-600 w-48 shadow-2xl z-50">
                  <div className="font-bold border-b border-white/40 pb-1 mb-1 text-idaz-black">Chất lượng WebRTC</div>
                  <div className="flex justify-between mt-1"><span>Độ trễ RTT:</span> <span className="font-mono text-idaz-black">{callQuality.rtt}ms</span></div>
                  <div className="flex justify-between"><span>Khung hình:</span> <span className="font-mono text-idaz-black">{callQuality.fps} FPS</span></div>
                  <div className="flex justify-between"><span>Mất gói:</span> <span className="font-mono text-idaz-black">{callQuality.packetsLost}</span></div>
                </div>
              </div>
            )}
            <span className="animate-pulse text-rose-500 text-xs font-bold flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-rose-500"></div> {isMinimized ? '' : 'Đang trực tiếp'}
            </span>
            {isRecording && (
              <span className="animate-pulse text-red-500 bg-red-500/10 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 border border-red-500/20">
                <Disc2 size={14} className="animate-spin-slow" /> {isMinimized ? '' : 'ĐANG GHI: ' + formatTime(recordingTime)}
              </span>
            )}
            {callAccepted && (
              <button onClick={() => setIsMinimized(!isMinimized)} className="text-gray-400 hover:text-idaz-black transition-colors">
                {isMinimized ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
              </button>
            )}
          </div>
        </div>

        <div className={`grid ${isMinimized || isAudioCall ? 'grid-cols-1 gap-2' : (callUser?.isGroup ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4' : 'grid-cols-1 md:grid-cols-2 gap-4')} mb-4`}>
          {/* My Video */}
          {!isMinimized && !isAudioCall && (
            <div className={`relative glass-card rounded-3xl overflow-hidden aspect-video border transition-all duration-300 ${activeSpeakers['local'] ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.35)] ring-2 ring-emerald-500/20' : 'border-white/40 shadow-inner'}`}>
              {stream && (
                <video playsInline muted ref={myVideo} autoPlay className={`w-full h-full ${isCropCover ? 'object-cover' : 'object-contain'} ${!videoOn && !isScreenSharing ? 'hidden' : ''}`} />
              )}
              {!videoOn && !isScreenSharing && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                  <VideoOff size={48} />
                </div>
              )}
              <div className="absolute bottom-4 left-4 bg-white/50 backdrop-blur-md px-3 py-1 rounded-xl text-idaz-black text-sm font-medium border border-white/60 flex items-center gap-2">
                <span>Bạn {micOn ? '' : '(Đã tắt mic)'}</span>
                <canvas ref={audioCanvasRef} className="w-12 h-4 rounded bg-transparent opacity-80" width="48" height="16" />
              </div>
            </div>
          )}

          {/* Group Peer Videos */}
          {callUser?.isGroup ? (
            peers.map((p, idx) => (
              <div key={p.socketId || idx} className={`relative glass-card rounded-3xl overflow-hidden aspect-video border transition-all duration-300 flex items-center justify-center ${activeSpeakers[p.socketId] ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.35)] ring-2 ring-emerald-500/20' : 'border-white/40 shadow-inner'}`}>
                {p.stream ? (
                  <video 
                    playsInline 
                    ref={el => { 
                      if (el) {
                        el.srcObject = p.stream; 
                        peerVideoElementsRef.current[p.socketId] = el;
                        if (selectedOutput && typeof el.setSinkId === 'function') {
                          el.setSinkId(selectedOutput);
                        }
                      } else {
                        delete peerVideoElementsRef.current[p.socketId];
                      }
                    }} 
                    autoPlay 
                    className={`w-full h-full ${isCropCover ? 'object-cover' : 'object-contain'}`} 
                  />
                ) : (
                  <div className="text-center text-gray-500">
                    <div className="relative mb-2">
                      <div className="w-12 h-12 bg-idaz-orange/10 rounded-full flex items-center justify-center mx-auto animate-pulse">
                        <Waves size={20} className="text-indigo-400" />
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">Đang tải nguồn...</p>
                  </div>
                )}
                <div className="absolute bottom-4 left-4 bg-white/50 backdrop-blur-md px-3 py-1 rounded-xl text-idaz-black text-sm font-medium border border-white/60 flex items-center gap-2">
                  <span>{p.name || `Thành viên ${idx + 1}`}</span>
                  <canvas 
                    ref={el => {
                      if (el) peerCanvasesRef.current[p.socketId] = el;
                      else delete peerCanvasesRef.current[p.socketId];
                    }} 
                    className="w-12 h-4 rounded bg-transparent opacity-80" 
                    width="48" 
                    height="16" 
                  />
                </div>
              </div>
            ))
          ) : (
            /* User Video / Audio Avatar */
            <div className={`relative glass-card rounded-3xl overflow-hidden border transition-all duration-300 flex items-center justify-center ${isAudioCall ? 'aspect-square max-w-[240px] mx-auto rounded-full mt-4' : 'aspect-video'} ${activeSpeakers[incomingCall ? incomingCall.from : callUser?.id] ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.35)] ring-2 ring-emerald-500/20' : 'border-white/40 shadow-inner'}`}>
              {peerScreenSharing.isSharing && (
                <div className="absolute top-4 left-4 bg-idaz-orange/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-idaz-black text-xs font-bold border border-indigo-400/30 flex items-center gap-1.5 animate-pulse z-30 shadow-lg">
                  <MonitorUp size={14} />
                  <span>{peerScreenSharing.presenterName || "Đối phương"} đang chia sẻ màn hình</span>
                </div>
              )}
              
              {callAccepted && !callEnded ? (
                <>
                  <video playsInline ref={userVideo} autoPlay className={`w-full h-full ${isCropCover ? 'object-cover' : 'object-contain'} ${isAudioCall ? 'absolute opacity-0 pointer-events-none w-1 h-1' : ''}`} />
                  {isAudioCall && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-900 to-black">
                      <div className="relative">
                        <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20"></div>
                        <div className="absolute inset-[-20px] bg-emerald-500/20 rounded-full animate-pulse"></div>
                        <div className="w-24 h-24 bg-emerald-600 rounded-full flex items-center justify-center relative z-10 shadow-2xl">
                          <Waves size={40} className="text-idaz-black opacity-80" />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : incomingCall && !callAccepted ? (
                <div className="text-center">
                  <div className="w-20 h-20 bg-idaz-orange/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-ping">
                    <Phone className="text-indigo-400" size={32} />
                  </div>
                  <p className="text-gray-400">Đang đổ chuông...</p>
                </div>
              ) : (
                <p className="text-gray-500">Đang chờ đối phương kết nối...</p>
              )}
              
              {callAccepted && !callEnded && !isAudioCall && (
                <div className="absolute bottom-4 right-4 bg-white/50 backdrop-blur-md px-3 py-1 rounded-xl text-idaz-black text-sm font-medium border border-white/60">
                  Đối phương
                </div>
              )}
            </div>
          )}
        </div>

        <div className={`flex justify-center items-center ${isMinimized ? 'gap-2 mt-2' : 'gap-4 mt-6'}`}>
          {incomingCall && !callAccepted ? (
            <>
              <button onClick={answerCall} className="bg-emerald-500 hover:bg-emerald-600 text-idaz-black px-6 py-2 rounded-3xl font-bold shadow-lg transition-transform hover:scale-105 flex items-center gap-2">
                <Phone size={18} /> Trả lời
              </button>
              <button onClick={() => handleEndCall(true)} className="bg-rose-500 hover:bg-rose-600 text-idaz-black px-6 py-2 rounded-3xl font-bold shadow-lg transition-transform hover:scale-105 flex items-center gap-2">
                <PhoneOff size={18} /> Từ chối
              </button>
            </>
          ) : (
            <>
              {isWaitingForConsent && (
                <div className="absolute top-20 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-4 py-2 rounded-3xl text-xs font-bold animate-pulse">
                  Đang chờ đối phương đồng ý ghi âm...
                </div>
              )}

              <button onClick={toggleMic} className={`p-3 rounded-full transition-colors ${micOn ? 'bg-gray-100 hover:bg-gray-700 text-idaz-black' : 'bg-rose-500 text-idaz-black'}`} title={micOn ? "Tắt Mic" : "Bật Mic"}>
                {micOn ? <Mic size={isMinimized ? 16 : 20} /> : <MicOff size={isMinimized ? 16 : 20} />}
              </button>
              
              {!isMinimized && (
                <button onClick={toggleScreenShare} className={`p-3 rounded-full transition-colors ${isScreenSharing ? 'bg-idaz-orange text-idaz-black shadow-lg shadow-indigo-500/20' : 'bg-gray-100 hover:bg-gray-700 text-idaz-black'}`} title="Chia sẻ màn hình">
                  <MonitorUp size={20} />
                </button>
              )}

              {!isAudioCall && !isMinimized && (
                <button 
                  onClick={toggleBgBlur} 
                  className={`p-3 rounded-full transition-colors ${isBgBlurred ? 'bg-idaz-orange text-idaz-black shadow-lg shadow-indigo-600/20' : 'bg-gray-100 hover:bg-gray-700 text-idaz-black'}`} 
                  title={isBgBlurred ? "Tắt làm mờ nền" : "Bật làm mờ nền bảo mật"}
                >
                  <Sparkles size={20} />
                </button>
              )}

              {['superadmin', 'admin'].includes(user?.role) && !isMinimized && (
                <button 
                  onClick={isRecording ? stopRecording : handleRequestRecording} 
                  className={`p-3 rounded-full transition-colors flex items-center gap-2 ${isRecording ? 'bg-red-500 text-idaz-black animate-pulse' : 'bg-gray-100 hover:bg-gray-700 text-red-400'}`} 
                  title={isRecording ? "Dừng ghi" : "Gửi yêu cầu ghi âm"}
                >
                  {isRecording ? <StopCircle size={20} /> : <Disc2 size={20} />}
                </button>
              )}

              <button onClick={() => handleEndCall(true)} className="bg-rose-500 hover:bg-rose-600 text-idaz-black px-6 py-3 rounded-full font-bold shadow-lg shadow-rose-500/20 transition-transform hover:scale-105 flex items-center gap-2 mx-2">
                <PhoneOff size={isMinimized ? 16 : 20} /> {!isMinimized && "Kết thúc"}
              </button>
              
              {audioOutputs.length > 0 && !isMinimized && (
                <div className="flex items-center gap-2 bg-gray-100/80 backdrop-blur-md px-3.5 py-2 rounded-full border border-white/40 shadow-inner">
                  <Volume2 size={16} className="text-gray-400" />
                  <select 
                    value={selectedOutput} 
                    onChange={(e) => setSelectedOutput(e.target.value)}
                    className="bg-transparent text-idaz-black text-xs border-none outline-none cursor-pointer max-w-[110px] pr-1 focus:ring-0"
                  >
                    {audioOutputs.map(device => (
                      <option key={device.deviceId} value={device.deviceId} className="glass-card text-idaz-black">
                        {device.label || `Loa (${device.label ? device.label.substring(0, 12) + '...' : device.deviceId.substring(0, 5)})`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {!isAudioCall && !isMinimized && (
                <button 
                  onClick={() => setIsCropCover(!isCropCover)} 
                  className={`p-3 rounded-full transition-colors ${isCropCover ? 'bg-idaz-orange text-idaz-black shadow-lg shadow-indigo-600/20' : 'bg-gray-100 hover:bg-gray-700 text-idaz-black'}`} 
                  title={isCropCover ? "Thu gọn màn hình (Fit)" : "Cắt đầy màn hình (Fill)"}
                >
                  <Crop size={20} />
                </button>
              )}

              {!isAudioCall && (
                <button onClick={toggleVideo} className={`p-3 rounded-full transition-colors ${videoOn ? 'bg-gray-100 hover:bg-gray-700 text-idaz-black' : 'bg-rose-500 text-idaz-black'}`} title={videoOn ? "Tắt Camera" : "Bật Camera"}>
                  {videoOn ? <Video size={isMinimized ? 16 : 20} /> : <VideoOff size={isMinimized ? 16 : 20} />}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Recording Consent Modal (Step 23) */}
      {showConsentModal && (
        <div className="fixed inset-0 bg-white/85 backdrop-blur-sm z-[10000] flex items-center justify-center p-4">
          <div className="glass-card border border-white/60 p-6 rounded-3xl max-w-sm w-full text-center shadow-2xl">
            <h4 className="text-lg font-bold text-idaz-black mb-2">Quyền Ghi Âm Cuộc Gọi</h4>
            <p className="text-sm text-gray-400 mb-6">
              <strong>{consentRequester}</strong> muốn thực hiện ghi âm/ghi hình cuộc gọi này. Bạn có đồng ý cấp quyền không?
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setShowConsentModal(false);
                  const partnerId = incomingCall ? incomingCall.from : callUser?.id;
                  socket.emit("recording_permission_response", { to: partnerId, accepted: true });
                }}
                className="bg-emerald-500 hover:bg-emerald-600 text-idaz-black px-6 py-2 rounded-2xl font-bold transition-all text-sm"
              >
                Đồng ý
              </button>
              <button
                onClick={() => {
                  setShowConsentModal(false);
                  const partnerId = incomingCall ? incomingCall.from : callUser?.id;
                  socket.emit("recording_permission_response", { to: partnerId, accepted: false });
                }}
                className="bg-gray-100 hover:bg-gray-700 text-gray-400 px-6 py-2 rounded-2xl font-bold transition-all text-sm"
              >
                Từ chối
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Invisible container to play audio streams for audio calls or group peers */}
      <div className="absolute w-0 h-0 overflow-hidden opacity-0 pointer-events-none" aria-hidden="true">
        {callUser?.isGroup && peers.map((p, idx) => (
          p.stream && (
            <video 
              key={`audio-peer-${p.socketId || idx}`} 
              playsInline 
              ref={el => { 
                if (el) {
                  el.srcObject = p.stream; 
                  peerVideoElementsRef.current[p.socketId] = el;
                  if (selectedOutput && typeof el.setSinkId === 'function') {
                    el.setSinkId(selectedOutput);
                  }
                }
              }} 
              autoPlay 
            />
          )
        ))}
      </div>
    </div>
  );
}
