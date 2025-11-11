// server.js
import express from "express";
import https from "https";
import fs from "fs";
import { Server } from "socket.io";
import mediasoup from "mediasoup";

const app = express();

// Simple routes so GET/POST exist
app.get("/", (req, res) => res.send("✅ Mediasoup server alive"));
app.post("/status", (req, res) => res.json({ status: "ok", uptime: process.uptime() }));

const sslOptions = {
  key: fs.readFileSync("ssl-certificates/privkey.pem"),
  cert: fs.readFileSync("ssl-certificates/fullchain.pem"),
};

const httpsServer = https.createServer(sslOptions, app);
const io = new Server(httpsServer, { cors: { origin: "*" } });

const PORT = 3000;
httpsServer.listen(PORT, () => console.log(`✅ Server listening on https://localhost:${PORT}`));

/* ---------------- mediasoup setup ---------------- */
const workers = [];
const rooms = new Map();

async function createWorker() {
  const worker = await mediasoup.createWorker({
  rtcMinPort: 40000,
  rtcMaxPort: 40100,
});
  worker.on("died", () => {
    console.error("Worker died, exiting...");
    process.exit(1);
  });
  workers.push(worker);
  return worker;
}

async function getWorker() {
  if (!workers.length) await createWorker();
  return workers[0];
}

async function createRoom(roomName) {
  const worker = await getWorker();
  const mediaCodecs = [
    { kind: "audio", mimeType: "audio/opus", clockRate: 48000, channels: 2 },
    {
      kind: "video",
      mimeType: "video/H264",
      clockRate: 90000,
      parameters: {
        "packetization-mode": 1,
        "profile-level-id": "42e01f",
        "level-asymmetry-allowed": 1
      }
    },
  ];
  const router = await worker.createRouter({ mediaCodecs });
  const transports = new Map(); // transportId -> transport
  const producers = new Map();  // producerId -> producer
  const consumers = new Map();  // consumerId -> consumer

  rooms.set(roomName, { router, transports, producers, consumers });
  console.log("🆕 Room created:", roomName);
  return rooms.get(roomName);
}

/* ---------------- Socket.IO handlers ---------------- */
io.on("connection", (socket) => {
  console.log("🔌 socket connected:", socket.id);

  // JOIN ROOM: client asks for router rtpCapabilities
  socket.on("joinRoom", async ({ roomName }, callback) => {
    try {
      let room = rooms.get(roomName);
      if (!room) room = await createRoom(roomName);
      callback({ rtpCapabilities: room.router.rtpCapabilities });
    } catch (err) {
      console.error("joinRoom error:", err);
      callback({ error: err.message });
    }
  });

  // CREATE consumer WebRTC transport (per viewer)
  socket.on("createConsumerTransport", async ({ roomName }, callback) => {
    try {
      const room = rooms.get(roomName);
      if (!room) return callback({ error: "Room not found" });

      const transport = await room.router.createWebRtcTransport({
        listenIps: [{ ip: "0.0.0.0", announcedIp: "stream.meramonitor.com" }],
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
        appData: { type: "consumer", socketId: socket.id, connected: false },
      });

      // store per-transport
      room.transports.set(transport.id, transport);
	   console.error("createConsumerTransport transportid:", transport.id);
      callback({
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      });
    } catch (err) {
      console.error("createConsumerTransport error:", err);
      callback({ error: err.message });
    }
  });

  // CONNECT consumer transport (DTLS) - ensure single connect
  socket.on("connectConsumerTransport", async ({ dtlsParameters, roomName }, callback) => {
    try {
      const room = rooms.get(roomName);
	   console.error("connectConsumerTransport roomName:", roomName);
      if (!room) return callback({ error: "Room not found" });

      // find transport created for this socket and type consumer
      const transport = Array.from(room.transports.values())
        .find(t => t.appData?.type === "consumer" && t.appData?.socketId === socket.id);

      if (!transport) return callback({ error: "Transport not found" });

      if (transport.appData?.connected) {
        console.log("⚠️ connectConsumerTransport called again - ignoring");
        return callback();
      }

      // mark connected to avoid race / duplicate connect
      transport.appData.connected = true;
      await transport.connect({ dtlsParameters });
      console.log(`✅ DTLS connected for socket ${socket.id}`);
      callback();
    } catch (err) {
      console.error("connectConsumerTransport error:", err);
      callback({ error: err.message });
    }
  });

  // CONSUME: create consumer(s) for existing producers
 socket.on("consume", async ({ roomName, rtpCapabilities }, callback) => {
  try {
    const room = rooms.get(roomName);
    if (!room) {
      console.error("consume: room not found", roomName);
      return callback({ error: "Room not found" });
    }

    const router = room.router;

    // find the consumer transport that belongs to this socket
    const consumerTransport = Array.from(room.transports.values())
      .find(t => t.appData?.type === "consumer" && t.appData?.socketId === socket.id);

    if (!consumerTransport) {
      console.error("consume: consumer transport not found for socket", socket.id);
      return callback({ error: "Consumer transport not found" });
    }

    const produced = Array.from(room.producers.values());
    if (!produced.length) {
      console.warn("consume: no producers in room", roomName);
      return callback({ consumers: [] });
    }

    const consumersInfo = [];

    for (const producer of produced) {
      // check if the router can consume this producer with the client's capabilities
      if (!router.canConsume({ producerId: producer.id, rtpCapabilities })) {
        console.log("consume: router cannot consume producer", producer.id);
        continue;
      }

      // create consumer on the transport; start paused (safer) then resume
      const consumer = await consumerTransport.consume({
        producerId: producer.id,
        rtpCapabilities,
        paused: true, // start paused to allow any server-side setup
      });

      // Save consumer for future cleanup / tracking
      room.consumers.set(consumer.id, consumer);

      // Resume the consumer (start receiving media)
      try {
        await consumer.resume();
      } catch (resumeErr) {
        console.warn("consume: consumer.resume() failed for", consumer.id, resumeErr);
      }

      // optional: listen for events
      consumer.on("transportclose", () => {
        console.log("consumer transport closed", consumer.id);
        room.consumers.delete(consumer.id);
      });
      consumer.on("producerclose", () => {
        console.log("producer closed for consumer", consumer.id);
        try { consumer.close(); } catch(e) {}
        room.consumers.delete(consumer.id);
      });

      consumersInfo.push({
        id: consumer.id,
        producerId: producer.id,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
      });
    }

    // return array of consumer metadata to the client
    callback({ consumers: consumersInfo });
  } catch (err) {
    console.error("consume error:", err);
    callback({ error: err.message || err.toString() });
  }
});

  // Simple disconnect cleanup
  socket.on("disconnect", () => {
    console.log("🔴 socket disconnected:", socket.id);
    // remove transports owned by this socket
    for (const room of rooms.values()) {
      for (const [tid, t] of room.transports.entries()) {
        if (t.appData?.socketId === socket.id) {
          try { t.close(); } catch (e) {}
          room.transports.delete(tid);
        }
      }
    }
  });
});

/* ---------------- Plain RTP producer creation (HTTP helper) ----------------
   This endpoint creates plain transports/producers and returns the ports
   so an external FFmpeg process can send RTP to them.
-------------------------------------------------------------------------- */
app.get("/create-producer/:roomName", async (req, res) => {
  try {
    const { roomName } = req.params;
    let room = rooms.get(roomName);
    if (!room) room = await createRoom(roomName);
    const router = room.router;

    // Create RTP + RTCP transport (plain)
    const videoTransport = await router.createPlainTransport({
      listenIp: { ip: "0.0.0.0", announcedIp: "stream.meramonitor.com" },
      rtcpMux: true,               // enable RTCP multiplexing
      comedia: true,
        appData:{type:"plain-video"}
    });
    const audioTransport = await router.createPlainTransport({
      listenIp: { ip: "0.0.0.0", announcedIp: "stream.meramonitor.com" },
      rtcpMux: true,               // enable RTCP multiplexing
      comedia: true,
        appData:{type:"plain-audio"}
    });

	room.transports.set(videoTransport.id, videoTransport);
	room.transports.set(audioTransport.id, audioTransport);
 
    // Define proper codec parameters (H264 + Opus)
    const videoCodec = {
      mimeType: "video/H264",
      clockRate: 90000,
      payloadType: 101,
      parameters: {
        "packetization-mode": 1,
        "profile-level-id": "42e01f",
        "level-asymmetry-allowed": 1
      },
      rtcpFeedback: [
        { type: "nack" },
        { type: "nack", parameter: "pli" },
        { type: "ccm", parameter: "fir" },
      ],
    };
    const audioCodec = {
      mimeType: "audio/opus",
      clockRate: 48000,
      channels: 2,
      payloadType: 100,
    };

    // Create video producer
    const videoProducer = await videoTransport.produce({
      kind: "video",
      rtpParameters: {
        codecs: [videoCodec],
        encodings: [{ ssrc: 11111 }], // match FFmpeg ssrc
        rtcp: { cname: "videoCname" },
      },
    });

    console.log('videoProducer created id=', videoProducer.id, 'kind=', videoProducer.kind);

    // Create audio producer
    const audioProducer = await audioTransport.produce({
      kind: "audio",
      rtpParameters: {
        codecs: [audioCodec],
        encodings: [{ ssrc: 22222 }],
        rtcp: { cname: "audioCname" },
      },
    });

    console.log('audioProducer created id=', audioProducer.id, 'kind=', audioProducer.kind);

    // Register producers in the room so consumers can find them
    room.producers.set(videoProducer.id, videoProducer);
    room.producers.set(audioProducer.id, audioProducer);

    // Periodic stats for diagnostics
    const statsInterval = setInterval(async () => {
      try {
        const vt = await videoTransport.getStats();
        const vtprod = await videoProducer.getStats();
        console.log('videoTransport.getStats():', JSON.stringify(vt, null, 2));
        console.log('videoProducer.getStats():', JSON.stringify(vtprod, null, 2));
      } catch (e) {
        console.warn('Stats poll error', e);
      }
    }, 3000);

    videoTransport.on('close', () => clearInterval(statsInterval));
    videoProducer.on('close', () => clearInterval(statsInterval));

    // Notify viewers in the room a new producer is available
    try {
      io.to(roomName).emit("newProducer", { producerId: videoProducer.id, kind: "video" });
    } catch (e) {
      console.warn("emit newProducer failed", e);
    }

    // Reply with the ports so the FFmpeg process can send RTP to them
    const videoRtpPort = videoTransport.tuple?.localPort ?? null;
    const audioRtpPort = audioTransport.tuple?.localPort ?? null;
    const rtcpMux = !!videoTransport.rtcpMux;

    // If rtcpMux is true, RTCP uses the same port as RTP. If false, try to read rtcpTuple.
    const videoRtcpPort = rtcpMux ? videoRtpPort : (videoTransport.rtcpTuple?.localPort ?? null);
    const audioRtcpPort = rtcpMux ? audioRtpPort : (audioTransport.rtcpTuple?.localPort ?? null);

    // Helpful debug log when rtcp tuple is not yet available
    if (!rtcpMux && !videoTransport.rtcpTuple) {
      console.warn('create-producer: videoTransport.rtcpTuple not yet available; remote RTCP may not have arrived');
    }

    // After creating videoTransport and audioTransport, if sender info provided:
    const senderIp = req.query?.senderIp;
    const senderPort = req.query?.senderPort ? Number(req.query.senderPort) : undefined;

    if (senderIp && senderPort && videoTransport) {
      try {
        await videoTransport.connect({ ip: senderIp, port: senderPort });
        console.log('videoTransport.connect() to', senderIp, senderPort);
      } catch (err) {
        console.warn('videoTransport.connect() failed', err);
      }
    }

    res.json({ videoRtpPort, videoRtcpPort, audioRtpPort, audioRtcpPort, rtcpMux });
  } catch (err) {
    console.error("create-producer error:", err);
    res.status(500).json({ error: err.message });
  }
});
