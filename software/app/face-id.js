/*
 * Galley Face ID: local face recognition with @vladmandic/face-api (TensorFlow.js).
 * Extracted from the team kit (object Face + registerPerson), without DOM ids.
 *
 * Privacy: the camera is on only while identifying or registering, and is turned
 * off right after. Photo and face descriptor (128 numbers) stay in localStorage.
 *
 * Offline: put face-api.js and the model files in ./vendor/face-api/ (see README).
 * If they are not there, it falls back to the jsDelivr CDN (needs internet).
 */

const CDN = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12";
const LOCAL = "./vendor/face-api";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * @param {{ video: HTMLVideoElement, overlay: HTMLCanvasElement, box?: HTMLElement,
 *           storeKey?: string, matchThreshold?: number }} o
 */
export function createFaceId(o) {
  const { video, overlay } = o;
  const box = o.box || video.parentElement;
  const STORE = o.storeKey || "galley-crew-v1";
  const MATCH_T = o.matchThreshold || 0.5; /* lower is stricter. Demo value, not validated. */
  let ready = null, stream = null, previewing = false;
  let profiles = load();

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE) || "{}");
      const out = {};
      for (const id in raw) if (raw[id] && Array.isArray(raw[id].desc) && raw[id].desc.length === 128) out[id] = raw[id];
      return out;
    } catch (e) { return {}; }
  }
  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(profiles)); return true; } catch (e) { return false; }
  }

  function loadScript(src) {
    return new Promise((res, rej) => {
      if (window.faceapi) return res();
      const sc = document.createElement("script");
      sc.src = src; sc.onload = () => res(); sc.onerror = () => { sc.remove(); rej(new Error("script")); };
      document.head.appendChild(sc);
    });
  }

  async function loadModels(base) {
    const n = window.faceapi.nets;
    await Promise.all([n.tinyFaceDetector.loadFromUri(base), n.faceLandmark68Net.loadFromUri(base), n.faceRecognitionNet.loadFromUri(base)]);
  }

  const api = {
    /** where the models came from after ensure(): "local" | "cdn" */
    source: null,

    ensure() {
      if (!ready) {
        ready = (async () => {
          let src = "local";
          try { await loadScript(LOCAL + "/face-api.js"); } catch (e) { src = "cdn"; await loadScript(CDN + "/dist/face-api.js"); }
          const tf = window.faceapi.tf;
          for (const be of ["webgl", "cpu"]) { try { if (await tf.setBackend(be)) { await tf.ready(); break; } } catch (e) { /* try next */ } }
          if (src === "local") {
            try { await loadModels(LOCAL + "/model"); } catch (e) { src = "cdn"; await loadModels(CDN + "/model"); }
          } else {
            await loadModels(CDN + "/model");
          }
          api.source = src;
        })().catch((e) => { ready = null; throw e; });
      }
      return ready;
    },

    async startCam() {
      if (stream) return;
      if (!window.isSecureContext) { const e = new Error("insecure"); e.name = "SecurityError"; throw e; }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { const e = new Error("nocam"); e.name = "NotFoundError"; throw e; }
      stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" }, audio: false });
      video.srcObject = stream;
      await video.play();
      /* wait until the first frame is ready so detection does not run on an empty video */
      for (let i = 0; i < 50 && video.readyState < 2; i++) await wait(100);
      if (box) box.classList.add("live");
    },

    /** turn a camera error into a message key */
    camErrorKey(e) {
      const n = (e && e.name) || "";
      if (n === "NotAllowedError" || n === "PermissionDeniedError") return "cam_denied";
      if (n === "NotFoundError" || n === "OverconstrainedError" || n === "DevicesNotFoundError") return "cam_none";
      if (n === "NotReadableError" || n === "TrackStartError" || n === "AbortError") return "cam_busy";
      if (n === "SecurityError") return "cam_insecure";
      return "cam_other";
    },

    /** live preview: calls onDet(detection|null) about 4 times per second until stopPreview() */
    preview(onDet) {
      previewing = true;
      (async () => {
        while (previewing && stream) {
          const det = await api.detect();
          if (!previewing) break;
          api.drawBox(det, det ? "#22d3ee" : null);
          if (onDet) onDet(det);
          await wait(250);
        }
      })();
    },
    stopPreview() { previewing = false; },

    stopCam() {
      previewing = false;
      if (stream) stream.getTracks().forEach((tr) => tr.stop());
      stream = null; video.srcObject = null;
      if (box) box.classList.remove("live");
      const c = overlay.getContext("2d"); c.clearRect(0, 0, overlay.width, overlay.height);
    },

    isLive: () => !!stream,

    async detect() {
      if (!stream || video.readyState < 2 || !window.faceapi) return null;
      return window.faceapi
        .detectSingleFace(video, new window.faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
        .withFaceLandmarks().withFaceDescriptor();
    },

    drawBox(det, color) {
      overlay.width = video.videoWidth || 640; overlay.height = video.videoHeight || 480;
      const c = overlay.getContext("2d"); c.clearRect(0, 0, overlay.width, overlay.height);
      if (!det) return;
      const b = det.detection.box; c.lineWidth = 4; c.strokeStyle = color; c.strokeRect(b.x, b.y, b.width, b.height);
    },

    bestMatch(desc) {
      let best = null;
      for (const id in profiles) {
        const d = window.faceapi.euclideanDistance(desc, profiles[id].desc);
        if (!best || d < best.dist) best = { id, dist: d };
      }
      return best;
    },

    /**
     * Look for a registered face. Needs the same person in 3 frames in a row.
     * @param {{ timeoutMs?: number, onStatus?: (s:"look"|"match")=>void, isCancelled?: ()=>boolean }} [opt]
     * @returns {Promise<{status:"ok", id:string, dist:number}|{status:"timeout"|"cancel"|"noprofiles"}>}
     */
    async identify(opt = {}) {
      if (!Object.keys(profiles).length) return { status: "noprofiles" };
      const t0 = performance.now(), timeout = opt.timeoutMs || 12000;
      let streak = 0, last = null;
      while (performance.now() - t0 < timeout) {
        if (opt.isCancelled && opt.isCancelled()) return { status: "cancel" };
        const det = await api.detect();
        if (!det) { api.drawBox(null); streak = 0; last = null; if (opt.onStatus) opt.onStatus("look"); }
        else {
          if (opt.onStatus) opt.onStatus("match");
          const m = api.bestMatch(det.descriptor);
          if (m && m.dist < MATCH_T) {
            api.drawBox(det, "#2ecc71");
            if (m.id === last) streak++; else { last = m.id; streak = 1; }
            if (streak >= 3) return { status: "ok", id: m.id, dist: m.dist };
          } else { api.drawBox(det, "#f5b301"); streak = 0; last = null; }
        }
        await wait(120);
      }
      return { status: "timeout" };
    },

    snapshot(det) {
      const b = det.detection.box, W = video.videoWidth, H = video.videoHeight;
      const size = Math.min(Math.max(b.width, b.height) * 1.45, W, H);
      const sx = Math.min(Math.max(0, b.x + b.width / 2 - size / 2), W - size);
      const sy = Math.min(Math.max(0, b.y + b.height / 2 - size / 2), H - size);
      const c = document.createElement("canvas"); c.width = 160; c.height = 160;
      c.getContext("2d").drawImage(video, sx, sy, size, size, 0, 0, 160, 160);
      return c.toDataURL("image/jpeg", 0.8);
    },

    /**
     * Capture 3 face samples, average them and save the profile.
     * The camera must already be on (startCam).
     * @returns {Promise<{ok:true, profile:object, stored:boolean}|{ok:false, reason:"noface"}>}
     */
    async register(name, base, extra = {}, onProgress) {
      const NEED = 5;
      const descs = []; let photo = null, bestScore = 0;
      for (let i = 0; i < 60 && descs.length < NEED; i++) {
        const det = await api.detect(); api.drawBox(det, "#22d3ee");
        if (det && det.detection.score >= 0.6) {
          descs.push(det.descriptor);
          /* keep the photo from the clearest frame, taken right away so the crop matches the face */
          if (det.detection.score >= bestScore) { bestScore = det.detection.score; photo = api.snapshot(det); }
          if (onProgress) onProgress(descs.length, NEED);
        }
        await wait(220);
      }
      if (descs.length < NEED) return { ok: false, reason: "noface" };
      const mean = new Array(128).fill(0);
      descs.forEach((d) => d.forEach((v, i) => { mean[i] += v / descs.length; }));
      const id = name.trim().replace(/\s+/g, "-").toUpperCase().slice(0, 24);
      const profile = { ...extra, id, name: name.trim(), base, photo, desc: mean, created: Date.now() };
      profiles[id] = profile;
      return { ok: true, profile, stored: save() };
    },

    list: () => Object.values(profiles),
    get: (id) => profiles[id] || null,
    exists: (name) => !!profiles[name.trim().replace(/\s+/g, "-").toUpperCase().slice(0, 24)],
    remove(id) { delete profiles[id]; save(); },
    /** remember when this person last completed a check */
    touch(id) { if (profiles[id]) { profiles[id].lastScan = Date.now(); save(); } }
  };
  return api;
}
