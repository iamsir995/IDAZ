/**
 * SFU Mediasoup Service Template
 * Dịch vụ SFU xử lý định tuyến cuộc gọi WebRTC quy mô lớn (Production Ready).
 */

const os = require('os');

// Cấu hình mẫu cho Mediasoup
const config = {
  mediasoup: {
    // Cấu hình Worker
    numWorkers: Object.keys(os.cpus()).length,
    workerSettings: {
      logLevel: 'warn',
      logTags: [
        'info',
        'ice',
        'dtls',
        'rtp',
        'srtp',
        'rtcp'
      ],
      rtcMinPort: 40000,
      rtcMaxPort: 49999
    },
    // Cấu hình Router (RTP Capabilities)
    routerOptions: {
      mediaCodecs: [
        {
          kind: 'audio',
          mimeType: 'audio/opus',
          clockRate: 48000,
          channels: 2
        },
        {
          kind: 'video',
          mimeType: 'video/VP8',
          clockRate: 90000,
          parameters: {
            'x-google-start-bitrate': 1000
          }
        },
        {
          kind: 'video',
          mimeType: 'video/h264',
          clockRate: 90000,
          parameters: {
            'packetization-mode': 1,
            'profile-level-id': '42e01f',
            'level-asymmetry-allowed': 1
          }
        }
      ]
    },
    // Cấu hình WebRtcTransport
    webRtcTransportOptions: {
      listenIps: [
        {
          ip: '0.0.0.0',
          announcedIp: '127.0.0.1' // Thay thế bằng public IP thực tế trên production
        }
      ],
      initialAvailableOutgoingBitrate: 1000000,
      minimumAvailableOutgoingBitrate: 600000,
      maxSctpMessageSize: 262144,
      enableSctp: true
    }
  }
};

class SfuService {
  constructor() {
    this.workers = [];
    this.nextWorkerIdx = 0;
    this.rooms = new Map(); // roomId -> { router, transports, producers, consumers }
  }

  /**
   * Khởi tạo các Mediasoup Workers
   */
  async initialize() {
    console.log('⚡ Đang khởi tạo Mediasoup Workers...');
    
    // Lưu ý: Ở môi trường local/test không cài đặt mediasoup để tránh lỗi compile binary C++,
    // chúng ta sẽ kiểm tra xem thư viện mediasoup có khả dụng hay không.
    try {
      const mediasoup = require('mediasoup');
      for (let i = 0; i < config.mediasoup.numWorkers; i++) {
        const worker = await mediasoup.createWorker(config.mediasoup.workerSettings);
        worker.on('died', () => {
          console.error(`Mediasoup worker died, exiting in 2 seconds...`);
          setTimeout(() => process.exit(1), 2000);
        });
        this.workers.push(worker);
      }
      console.log(`✅ Đã khởi tạo thành công ${this.workers.length} Mediasoup Workers.`);
    } catch (err) {
      console.warn('⚠️ mediasoup chưa được cài đặt. Đang sử dụng chế độ giả lập SFU (Mock Mode) cho môi trường kiểm thử.');
    }
  }

  /**
   * Lấy Worker tiếp theo theo chiến lược Round-Robin
   */
  getWorker() {
    if (this.workers.length === 0) return null;
    const worker = this.workers[this.nextWorkerIdx];
    this.nextWorkerIdx = (this.nextWorkerIdx + 1) % this.workers.length;
    return worker;
  }

  /**
   * Lấy hoặc Tạo mới Router (phòng họp ảo) cho một Room ID
   */
  async getOrCreateRoomRouter(roomId) {
    if (this.rooms.has(roomId)) {
      return this.rooms.get(roomId).router;
    }

    const worker = this.getWorker();
    let router;
    if (worker) {
      router = await worker.createRouter({ mediaCodecs: config.mediasoup.routerOptions.mediaCodecs });
    } else {
      // Mock Router cho môi trường test
      router = {
        rtpCapabilities: {},
        createWebRtcTransport: async () => ({
          id: `mock-transport-${Date.now()}`,
          connect: async () => {},
          produce: async () => ({ id: `mock-producer-${Date.now()}` }),
          consume: async () => ({ id: `mock-consumer-${Date.now()}` }),
          close: () => {}
        })
      };
    }

    this.rooms.set(roomId, {
      router,
      transports: new Map(),
      producers: new Map(),
      consumers: new Map()
    });

    return router;
  }

  /**
   * Tạo WebRtcTransport để truyền hoặc nhận media
   */
  async createWebRtcTransport(roomId) {
    const router = await this.getOrCreateRoomRouter(roomId);
    
    // Nếu có mediasoup thực tế, tạo transport thật
    if (this.workers.length > 0) {
      const transport = await router.createWebRtcTransport(config.mediasoup.webRtcTransportOptions);
      
      // Đăng ký lưu trữ transport trong room
      const room = this.rooms.get(roomId);
      room.transports.set(transport.id, transport);

      return {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
        sctpParameters: transport.sctpParameters
      };
    } else {
      // Mock Transport trả về tham số giả lập
      const mockTransport = await router.createWebRtcTransport();
      return {
        id: mockTransport.id,
        iceParameters: { usernameFragment: 'mock-ice-user', password: 'mock-ice-password' },
        iceCandidates: [{ foundation: '1', ip: '127.0.0.1', port: 40000, priority: 1, protocol: 'udp', type: 'host' }],
        dtlsParameters: { role: 'auto', fingerprints: [{ algorithm: 'sha-256', value: 'mock-dtls-fingerprint' }] }
      };
    }
  }
}

module.exports = new SfuService();
