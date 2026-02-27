/**
 * Face Analysis Module — MediaPipe Face Landmarker + Canvas API
 * Extracts face data client-side. No images leave the device.
 * Uses Google MediaPipe (https://ai.google.dev/edge/mediapipe)
 */

let FaceLandmarkerClass = null;
let FilesetResolverClass = null;
let PoseLandmarkerClass = null;

let faceLandmarker = null;
let poseLandmarker = null;
let initState = 'idle'; // idle | loading | ready | error

const MEDIAPIPE_VERSION = '0.10.14';
const CDN_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}`;

// ─── INITIALIZATION ───

async function loadVisionModules() {
  if (FaceLandmarkerClass) return true;
  try {
    const vision = await import(`${CDN_BASE}/vision_bundle.mjs`);
    FaceLandmarkerClass = vision.FaceLandmarker;
    FilesetResolverClass = vision.FilesetResolver;
    PoseLandmarkerClass = vision.PoseLandmarker;
    return true;
  } catch (e) {
    console.error('[FaceAnalyzer] Failed to load MediaPipe:', e);
    return false;
  }
}

async function initFaceLandmarker() {
  if (faceLandmarker) return true;
  if (initState === 'loading') {
    // Wait for existing init
    while (initState === 'loading') await delay(100);
    return initState === 'ready';
  }
  initState = 'loading';
  dispatchState('loading');

  try {
    if (!await loadVisionModules()) { initState = 'error'; dispatchState('error'); return false; }

    const fileset = await FilesetResolverClass.forVisionTasks(`${CDN_BASE}/wasm`);
    faceLandmarker = await FaceLandmarkerClass.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
        delegate: 'GPU'
      },
      outputFaceBlendshapes: false,
      runningMode: 'IMAGE',
      numFaces: 1
    });

    initState = 'ready';
    dispatchState('ready');
    console.log('[FaceAnalyzer] Face Landmarker ready');
    return true;
  } catch (e) {
    console.error('[FaceAnalyzer] Init failed:', e);
    initState = 'error';
    dispatchState('error');
    return false;
  }
}

async function initPoseLandmarker() {
  if (poseLandmarker) return true;
  try {
    if (!await loadVisionModules()) return false;
    const fileset = await FilesetResolverClass.forVisionTasks(`${CDN_BASE}/wasm`);
    poseLandmarker = await PoseLandmarkerClass.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
        delegate: 'GPU'
      },
      runningMode: 'IMAGE',
      numPoses: 1
    });
    console.log('[FaceAnalyzer] Pose Landmarker ready');
    return true;
  } catch (e) {
    console.error('[FaceAnalyzer] Pose init failed:', e);
    return false;
  }
}

function dispatchState(state) {
  window.dispatchEvent(new CustomEvent('faceanalyzer-state', { detail: state }));
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── COLOR UTILITIES ───

function sampleColor(ctx, x, y, radius) {
  radius = radius || 3;
  var d = radius * 2 + 1;
  var sx = Math.max(0, x - radius);
  var sy = Math.max(0, y - radius);
  var sw = Math.min(d, ctx.canvas.width - sx);
  var sh = Math.min(d, ctx.canvas.height - sy);
  if (sw <= 0 || sh <= 0) return { r: 128, g: 128, b: 128 };
  var imageData = ctx.getImageData(sx, sy, sw, sh);
  var px = imageData.data;
  var r = 0, g = 0, b = 0, n = 0;
  for (var i = 0; i < px.length; i += 4) {
    if (px[i + 3] > 128) { r += px[i]; g += px[i+1]; b += px[i+2]; n++; }
  }
  if (!n) return { r: 128, g: 128, b: 128 };
  return { r: Math.round(r/n), g: Math.round(g/n), b: Math.round(b/n) };
}

function avgColors(arr) {
  var n = arr.length;
  return {
    r: Math.round(arr.reduce(function(s,c){return s+c.r;},0)/n),
    g: Math.round(arr.reduce(function(s,c){return s+c.g;},0)/n),
    b: Math.round(arr.reduce(function(s,c){return s+c.b;},0)/n)
  };
}

function rgbToHex(c) {
  return '#' + [c.r,c.g,c.b].map(function(v){return v.toString(16).padStart(2,'0');}).join('');
}

function rgbToHsl(c) {
  var r=c.r/255, g=c.g/255, b=c.b/255;
  var mx=Math.max(r,g,b), mn=Math.min(r,g,b);
  var h, s, l=(mx+mn)/2;
  if (mx===mn) { h=s=0; }
  else {
    var d=mx-mn;
    s = l>0.5 ? d/(2-mx-mn) : d/(mx+mn);
    if (mx===r) h=((g-b)/d+(g<b?6:0))/6;
    else if (mx===g) h=((b-r)/d+2)/6;
    else h=((r-g)/d+4)/6;
  }
  return { h:Math.round(h*360), s:Math.round(s*100), l:Math.round(l*100) };
}

function dist2D(p1, p2, w, h) {
  var dx=(p1.x-p2.x)*w, dy=(p1.y-p2.y)*h;
  return Math.sqrt(dx*dx+dy*dy);
}

function colorDist(a, b) {
  return Math.round(Math.sqrt((a.r-b.r)**2 + (a.g-b.g)**2 + (a.b-b.b)**2));
}

// ─── FACE ANALYSIS ───

async function analyzeFace(imgEl) {
  if (!faceLandmarker && !await initFaceLandmarker()) return null;

  var canvas = document.createElement('canvas');
  var w = imgEl.naturalWidth || imgEl.width;
  var h = imgEl.naturalHeight || imgEl.height;
  canvas.width = w; canvas.height = h;
  var ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(imgEl, 0, 0, w, h);

  var res = faceLandmarker.detect(canvas);
  if (!res.faceLandmarks || !res.faceLandmarks.length) return { error: 'no_face_detected' };

  var lm = res.faceLandmarks[0];

  // Skin color — sample multiple cheek/forehead regions
  var skinIdx = [234, 454, 50, 280, 187, 411];
  var skinSamples = skinIdx.map(function(i) {
    return sampleColor(ctx, Math.round(lm[i].x*w), Math.round(lm[i].y*h), 4);
  });
  var skin = avgColors(skinSamples);

  // Hair color — sample above forehead top landmark
  var fhTop = lm[10];
  var hairY = Math.max(3, Math.round(fhTop.y * h) - 30);
  var hair = sampleColor(ctx, Math.round(fhTop.x * w), hairY, 5);

  // Eye/iris color (iris landmarks: 468-472 left, 473-477 right)
  var eye = null;
  if (lm.length > 473) {
    var le = sampleColor(ctx, Math.round(lm[468].x*w), Math.round(lm[468].y*h), 2);
    var re = sampleColor(ctx, Math.round(lm[473].x*w), Math.round(lm[473].y*h), 2);
    eye = avgColors([le, re]);
  }

  // Background color — sample corners
  var bg = avgColors([
    sampleColor(ctx, 5, 5),
    sampleColor(ctx, w-5, 5),
    sampleColor(ctx, 5, h-5),
    sampleColor(ctx, w-5, h-5)
  ]);

  // Face proportions (normalized to cheekbone width)
  var fhW = dist2D(lm[70], lm[300], w, h);
  var cbW = dist2D(lm[234], lm[454], w, h);
  var jwW = dist2D(lm[172], lm[397], w, h);
  var fcH = dist2D(lm[10], lm[152], w, h);

  return {
    skinColor:  { rgb: skin, hex: rgbToHex(skin), hsl: rgbToHsl(skin) },
    hairColor:  { rgb: hair, hex: rgbToHex(hair), hsl: rgbToHsl(hair) },
    eyeColor:   eye ? { rgb: eye, hex: rgbToHex(eye), hsl: rgbToHsl(eye) } : null,
    backgroundColor: { rgb: bg, hex: rgbToHex(bg) },
    faceProportions: {
      foreheadRatio: +(fhW/cbW).toFixed(3),
      jawRatio:      +(jwW/cbW).toFixed(3),
      heightRatio:   +(fcH/cbW).toFixed(3)
    },
    contrast: {
      skinHair: colorDist(skin, hair),
      skinEye:  eye ? colorDist(skin, eye) : null
    }
  };
}

// ─── BODY ANALYSIS ───

async function analyzeBody(imgEl) {
  if (!poseLandmarker && !await initPoseLandmarker()) return null;

  var canvas = document.createElement('canvas');
  var w = imgEl.naturalWidth || imgEl.width;
  var h = imgEl.naturalHeight || imgEl.height;
  canvas.width = w; canvas.height = h;
  var ctx = canvas.getContext('2d');
  ctx.drawImage(imgEl, 0, 0, w, h);

  var res = poseLandmarker.detect(canvas);
  if (!res.landmarks || !res.landmarks.length) return { error: 'no_body_detected' };

  var lm = res.landmarks[0];
  // 11=left shoulder, 12=right shoulder, 23=left hip, 24=right hip
  var shW = dist2D(lm[11], lm[12], w, h);
  var hpW = dist2D(lm[23], lm[24], w, h);
  var torso = dist2D(
    { x:(lm[11].x+lm[12].x)/2, y:(lm[11].y+lm[12].y)/2 },
    { x:(lm[23].x+lm[24].x)/2, y:(lm[23].y+lm[24].y)/2 },
    w, h
  );

  return {
    bodyProportions: {
      shoulderHipRatio: +(shW/hpW).toFixed(3),
      shoulderWidth: Math.round(shW),
      hipWidth: Math.round(hpW),
      torsoLength: Math.round(torso)
    }
  };
}

// ─── EXPOSE TO WINDOW ───

window.FaceAnalyzer = {
  init: initFaceLandmarker,
  analyzeFace: analyzeFace,
  analyzeBody: analyzeBody,
  isReady: function() { return initState === 'ready'; },
  getState: function() { return initState; }
};

// Auto-initialize on load
initFaceLandmarker();
