class PeerService {
  constructor() {
    this.createPeer();
  }

  createPeer() {
    this.peer = new RTCPeerConnection({
      iceServers: [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:global.stun.twilio.com:3478",
          ],
        },
      //   {
      //   urls: "relay1.expressturn.com:3480", 
      //   username: "000000002064744412", 
      //   credential: "sPG1nNOz9DqM5RSM+KnAltmk9fk=",
      // },
      ],
    });
  }

  resetPeer() {
    if (this.peer) {
      this.peer.close();
    }
    this.createPeer();
  }

  ensurePeerAvailable() {
    if (!this.peer || this.peer.signalingState === 'closed') {
      this.createPeer();
    }
  }

  async getOffer() {
    this.ensurePeerAvailable();

    const offer = await this.peer.createOffer();
    await this.peer.setLocalDescription(new RTCSessionDescription(offer));
    return offer;
  }

  async getAnswer(offer) {
    this.ensurePeerAvailable();

    await this.peer.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = await this.peer.createAnswer();
    await this.peer.setLocalDescription(new RTCSessionDescription(answer));
    return answer;
  }

  async setLocalDescription(ans) {
    this.ensurePeerAvailable();

    await this.peer.setRemoteDescription(new RTCSessionDescription(ans));
  }

  closeConnection() {
    if (this.peer && this.peer.signalingState !== 'closed') {
      this.peer.close();
    }
  }
}

export default new PeerService();
