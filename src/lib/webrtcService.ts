/**
 * Native Peer-to-Peer WebRTC Service for Pronto Health / LiveSehat
 * Completely self-hosted in browser & Firestore:
 * - ZERO credit cards, ZERO subscriptions, ZERO external accounts
 * - ZERO watermarks (uses native HTML5 <video> elements)
 * - Encrypted 1-on-1 audio/video using Google's free STUN servers
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  addDoc,
  getDocs,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

export const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
  iceCandidatePoolSize: 10,
};

export interface WebRTCConnectionHandlers {
  onRemoteStream: (stream: MediaStream) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onError?: (err: Error) => void;
}

export class WebRTCManager {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private callDocId: string;
  private unsubscribers: Array<() => void> = [];

  constructor(callId: string) {
    this.callDocId = callId.replace(/[^a-zA-Z0-9_-]/g, "-");
  }

  /**
   * Initializes local user media (camera and microphone)
   */
  async getLocalMedia(video = true, audio = true): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" } : false,
        audio: audio ? { echoCancellation: true, noiseSuppression: true } : false,
      });
      this.localStream = stream;
      return stream;
    } catch (err: any) {
      console.error("Camera/Mic access error:", err);
      // Fallback to audio only if camera is blocked or not available
      if (video) {
        return this.getLocalMedia(false, true);
      }
      throw err;
    }
  }

  /**
   * Starts a consultation call as Caller (Doctor or first attendee)
   */
  async startCall(localStream: MediaStream, handlers: WebRTCConnectionHandlers): Promise<RTCPeerConnection> {
    this.cleanup();
    this.localStream = localStream;
    this.pc = new RTCPeerConnection(ICE_SERVERS);

    // Attach local audio/video tracks to peer connection
    localStream.getTracks().forEach((track) => {
      if (this.pc && this.localStream) {
        this.pc.addTrack(track, this.localStream);
      }
    });

    // Handle remote media track arrival
    const remoteStream = new MediaStream();
    this.pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
      handlers.onRemoteStream(remoteStream);
    };

    if (handlers.onConnectionStateChange) {
      this.pc.onconnectionstatechange = () => {
        if (this.pc && handlers.onConnectionStateChange) {
          handlers.onConnectionStateChange(this.pc.connectionState);
        }
      };
    }

    if (!db) {
      throw new Error("Firestore database is not configured");
    }

    const callDoc = doc(db, "webrtc_calls", this.callDocId);
    const offerCandidates = collection(callDoc, "offerCandidates");
    const answerCandidates = collection(callDoc, "answerCandidates");

    // Push local ICE candidates to Firestore
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        addDoc(offerCandidates, event.candidate.toJSON()).catch((err) => {
          console.warn("Could not save offer ICE candidate:", err);
        });
      }
    };

    // Create SDP Offer
    const offerDescription = await this.pc.createOffer();
    await this.pc.setLocalDescription(offerDescription);

    const callData = {
      offer: {
        type: offerDescription.type,
        sdp: offerDescription.sdp,
      },
      createdAt: serverTimestamp(),
      status: "active",
    };

    await setDoc(callDoc, callData);

    // Listen for SDP Answer from receiver
    const unsubDoc = onSnapshot(callDoc, (snapshot) => {
      const pc = this.pc;
      const data = snapshot.data();
      if (pc && !pc.currentRemoteDescription && data?.answer) {
        const answerDescription = new RTCSessionDescription(data.answer);
        pc.setRemoteDescription(answerDescription).catch((err) => {
          console.warn("Failed to set remote description on caller:", err);
        });
      }
    });
    this.unsubscribers.push(unsubDoc);

    // Listen for remote ICE candidates
    const unsubAnswer = onSnapshot(answerCandidates, (snapshot) => {
      const pc = this.pc;
      if (!pc) return;
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const candidate = new RTCIceCandidate(change.doc.data());
          pc.addIceCandidate(candidate).catch((err) => {
            console.warn("Error adding answer candidate:", err);
          });
        }
      });
    });
    this.unsubscribers.push(unsubAnswer);

    return this.pc;
  }

  /**
   * Joins a consultation call as Answerer (Patient or second attendee)
   */
  async joinCall(localStream: MediaStream, handlers: WebRTCConnectionHandlers): Promise<RTCPeerConnection> {
    this.cleanup();
    this.localStream = localStream;
    this.pc = new RTCPeerConnection(ICE_SERVERS);

    localStream.getTracks().forEach((track) => {
      if (this.pc && this.localStream) {
        this.pc.addTrack(track, this.localStream);
      }
    });

    const remoteStream = new MediaStream();
    this.pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });
      handlers.onRemoteStream(remoteStream);
    };

    if (handlers.onConnectionStateChange) {
      this.pc.onconnectionstatechange = () => {
        if (this.pc && handlers.onConnectionStateChange) {
          handlers.onConnectionStateChange(this.pc.connectionState);
        }
      };
    }

    if (!db) {
      throw new Error("Firestore database is not configured");
    }

    const callDoc = doc(db, "webrtc_calls", this.callDocId);
    const offerCandidates = collection(callDoc, "offerCandidates");
    const answerCandidates = collection(callDoc, "answerCandidates");

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        addDoc(answerCandidates, event.candidate.toJSON()).catch((err) => {
          console.warn("Could not save answer ICE candidate:", err);
        });
      }
    };

    // Helper to accept the offer
    const acceptOffer = async (offerData: any) => {
      const pc = this.pc;
      if (!pc || pc.currentRemoteDescription) return;
      const offerDescription = new RTCSessionDescription(offerData);
      await pc.setRemoteDescription(offerDescription);

      const answerDescription = await pc.createAnswer();
      await pc.setLocalDescription(answerDescription);

      await updateDoc(callDoc, {
        answer: {
          type: answerDescription.type,
          sdp: answerDescription.sdp,
        },
      });
    };

    const callSnap = await getDoc(callDoc);
    const initialData = callSnap.data();

    if (initialData?.offer) {
      await acceptOffer(initialData.offer);
    } else {
      // Wait for offer if not present yet
      const unsubOffer = onSnapshot(callDoc, async (snapshot) => {
        const data = snapshot.data();
        if (data?.offer && !this.pc?.currentRemoteDescription) {
          await acceptOffer(data.offer);
        }
      });
      this.unsubscribers.push(unsubOffer);
    }

    // Listen for offer candidates
    const unsubOfferCand = onSnapshot(offerCandidates, (snapshot) => {
      const pc = this.pc;
      if (!pc) return;
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const candidate = new RTCIceCandidate(change.doc.data());
          pc.addIceCandidate(candidate).catch((err) => {
            console.warn("Error adding offer candidate:", err);
          });
        }
      });
    });
    this.unsubscribers.push(unsubOfferCand);

    return this.pc;
  }

  /**
   * Cleans up all listeners, streams, and peer connections
   */
  cleanup() {
    this.unsubscribers.forEach((unsub) => {
      try {
        unsub();
      } catch {}
    });
    this.unsubscribers = [];

    if (this.pc) {
      try {
        this.pc.close();
      } catch {}
      this.pc = null;
    }

    if (this.localStream) {
      try {
        this.localStream.getTracks().forEach((track) => track.stop());
      } catch {}
      this.localStream = null;
    }
  }
}
