/**
 * Face Analysis Module — MediaPipe Face Landmarker + Image Segmenter + Canvas API
 * Extracts face data client-side. No images leave the device.
 * Uses Google MediaPipe (https://ai.google.dev/edge/mediapipe)
 */

let FaceLandmarkerClass = null;
let FilesetResolverClass = null;
let PoseLandmarkerClass = null;
let ImageSegmenterClass = null;

let faceLandmarker = null;
let poseLandmarker = null;
let imageSegmenter = null;
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
    ImageSegmenterClass = vision.ImageSegmenter;
    return true;
  } catch (e) {
    console.error('[FaceAnalyzer] Failed to load MediaPipe:', e);
    return false;
  }
}

async function initFaceLandmarker() {
  if (faceLandmarker) return true;
  if (initState === 'loading') {
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

async function initImageSegmenter() {
  if (imageSegmenter) return true;
  try {
    if (!await loadVisionModules()) return false;
    if (!ImageSegmenterClass) {
      console.warn('[FaceAnalyzer] ImageSegmenter not available in this version');
      return false;
    }
    const fileset = await FilesetResolverClass.forVisionTasks(`${CDN_BASE}/wasm`);
    imageSegmenter = await ImageSegmenterClass.createFromOptions(fileset, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite',
        delegate: 'GPU'
      },
      runningMode: 'IMAGE',
      outputCategoryMask: true,
      outputConfidenceMasks: false
    });
    console.log('[FaceAnalyzer] Image Segmenter ready');
    return true;
  } catch (e) {
    console.error('[FaceAnalyzer] ImageSegmenter init failed:', e);
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
  if (!arr || !arr.length) return { r: 128, g: 128, b: 128 };
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

function rgbToLab(c) {
  var r = c.r / 255, g = c.g / 255, b = c.b / 255;
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
  var x = (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) / 0.95047;
  var y = (r * 0.2126729 + g * 0.7151522 + b * 0.0721750);
  var z = (r * 0.0193339 + g * 0.1191920 + b * 0.9503041) / 1.08883;
  x = x > 0.008856 ? Math.pow(x, 1/3) : (7.787 * x) + 16/116;
  y = y > 0.008856 ? Math.pow(y, 1/3) : (7.787 * y) + 16/116;
  z = z > 0.008856 ? Math.pow(z, 1/3) : (7.787 * z) + 16/116;
  return {
    l: Math.round((116 * y - 16) * 100) / 100,
    a: Math.round((500 * (x - y)) * 100) / 100,
    b: Math.round((200 * (y - z)) * 100) / 100
  };
}

function colorDist(a, b) {
  if (!a || !b) return null;
  return Math.round(Math.sqrt((a.r-b.r)**2 + (a.g-b.g)**2 + (a.b-b.b)**2));
}

function makeColorObj(rgb) {
  return { rgb: rgb, hex: rgbToHex(rgb), hsl: rgbToHsl(rgb) };
}

// ─── SEGMENTATION HELPERS ───

function sampleFromMask(ctx, maskData, maskW, maskH, category, imgW, imgH, maxSamples) {
  maxSamples = maxSamples || 50;
  var scaleX = maskW / imgW;
  var scaleY = maskH / imgH;
  var candidates = [];

  // Collect all pixels of the target category
  for (var my = 0; my < maskH; my++) {
    for (var mx = 0; mx < maskW; mx++) {
      if (maskData[my * maskW + mx] === category) {
        candidates.push({ mx: mx, my: my });
      }
    }
  }

  if (candidates.length === 0) return null;

  // Evenly sample from candidates
  var step = Math.max(1, Math.floor(candidates.length / maxSamples));
  var samples = [];
  var samplePoints = [];

  for (var i = 0; i < candidates.length && samplePoints.length < maxSamples; i += step) {
    var c = candidates[i];
    var imgX = Math.round(c.mx / scaleX);
    var imgY = Math.round(c.my / scaleY);
    var color = sampleColor(ctx, imgX, imgY, 1);
    samples.push(color);
    samplePoints.push({ x: imgX, y: imgY, color: color });
  }

  return { avg: avgColors(samples), points: samplePoints };
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
  var samplePoints = { skin: [], hair: [], eyebrow: [], eye: [], lip: [], neck: [], background: [] };

  // ── Image Segmentation (lazy init) ──
  var segMask = null;
  var segMaskW = 0, segMaskH = 0;
  try {
    if (await initImageSegmenter()) {
      var segResult = imageSegmenter.segment(canvas);
      if (segResult && segResult.categoryMask) {
        var mask = segResult.categoryMask;
        segMaskW = mask.width;
        segMaskH = mask.height;
        // Copy mask data before it gets recycled
        segMask = new Uint8Array(mask.getAsUint8Array());
        mask.close();
      }
    }
  } catch (e) {
    console.warn('[FaceAnalyzer] Segmentation failed, using fallback:', e.message);
  }

  // ── Skin color — 8 points (cheeks, forehead, nose bridge, chin area) ──
  var skinIdx = [234, 454, 50, 280, 187, 411, 168, 200];
  var skinSamples = skinIdx.map(function(i) {
    var px = Math.round(lm[i].x * w);
    var py = Math.round(lm[i].y * h);
    var color = sampleColor(ctx, px, py, 4);
    samplePoints.skin.push({ x: px, y: py, color: color });
    return color;
  });
  var skin = avgColors(skinSamples);

  // ── Hair color — Image Segmentation or fallback ──
  var hair;
  var hairFromSeg = false;
  if (segMask) {
    var hairResult = sampleFromMask(ctx, segMask, segMaskW, segMaskH, 1, w, h, 50);
    if (hairResult) {
      hair = hairResult.avg;
      samplePoints.hair = hairResult.points.slice(0, 10); // Keep max 10 for visualization
      hairFromSeg = true;
    }
  }
  if (!hairFromSeg) {
    // Fallback: sample 3 points above forehead
    var fhTop = lm[10];
    var fhX = Math.round(fhTop.x * w);
    var hairPoints = [
      { x: fhX - 15, y: Math.max(3, Math.round(fhTop.y * h) - 30) },
      { x: fhX, y: Math.max(3, Math.round(fhTop.y * h) - 25) },
      { x: fhX + 15, y: Math.max(3, Math.round(fhTop.y * h) - 30) }
    ];
    var hairSamples = hairPoints.map(function(p) {
      var color = sampleColor(ctx, p.x, p.y, 5);
      samplePoints.hair.push({ x: p.x, y: p.y, color: color });
      return color;
    });
    hair = avgColors(hairSamples);
  }

  // ── Eyebrow color — 8 points (4 left, 4 right) ──
  var browIdxL = [66, 105, 55, 65];
  var browIdxR = [296, 334, 285, 295];
  var browSamples = [];
  browIdxL.concat(browIdxR).forEach(function(i) {
    var px = Math.round(lm[i].x * w);
    var py = Math.round(lm[i].y * h);
    var color = sampleColor(ctx, px, py, 2);
    samplePoints.eyebrow.push({ x: px, y: py, color: color });
    browSamples.push(color);
  });
  var eyebrow = avgColors(browSamples);

  // ── Eye/iris color (iris landmarks: 468 left, 473 right) ──
  var eye = null;
  if (lm.length > 473) {
    var leX = Math.round(lm[468].x * w), leY = Math.round(lm[468].y * h);
    var reX = Math.round(lm[473].x * w), reY = Math.round(lm[473].y * h);
    var le = sampleColor(ctx, leX, leY, 2);
    var re = sampleColor(ctx, reX, reY, 2);
    samplePoints.eye.push({ x: leX, y: leY, color: le });
    samplePoints.eye.push({ x: reX, y: reY, color: re });
    eye = avgColors([le, re]);
  }

  // ── Lip color — 4 points (upper center, lower center, left corner, right corner) ──
  var lipIdx = [13, 14, 82, 312];
  var lipSamples = lipIdx.map(function(i) {
    var px = Math.round(lm[i].x * w);
    var py = Math.round(lm[i].y * h);
    var color = sampleColor(ctx, px, py, 2);
    samplePoints.lip.push({ x: px, y: py, color: color });
    return color;
  });
  var lip = avgColors(lipSamples);

  // ── Neck color — 3 points below chin (landmark 152) ──
  var chinX = Math.round(lm[152].x * w);
  var chinY = Math.round(lm[152].y * h);
  var neckOffsets = [20, 30, 40];
  var neckSamples = [];
  neckOffsets.forEach(function(offset) {
    var ny = Math.min(h - 3, chinY + offset);
    var color = sampleColor(ctx, chinX, ny, 3);
    samplePoints.neck.push({ x: chinX, y: ny, color: color });
    neckSamples.push(color);
  });
  var neck = avgColors(neckSamples);

  // ── Background color — 7 points (top 5 + left/right middle), skip bottom ──
  var bgPositions = [
    { x: 5, y: 5 },
    { x: Math.round(w * 0.25), y: 5 },
    { x: Math.round(w * 0.5), y: 5 },
    { x: Math.round(w * 0.75), y: 5 },
    { x: w - 5, y: 5 },
    { x: 5, y: Math.round(h * 0.35) },
    { x: w - 5, y: Math.round(h * 0.35) }
  ];

  // If segmentation available, filter to only background pixels
  var bgSamples = [];
  if (segMask) {
    var segScaleX = segMaskW / w;
    var segScaleY = segMaskH / h;
    bgPositions.forEach(function(p) {
      var mx = Math.min(segMaskW - 1, Math.round(p.x * segScaleX));
      var my = Math.min(segMaskH - 1, Math.round(p.y * segScaleY));
      if (segMask[my * segMaskW + mx] === 0) { // 0 = background
        var color = sampleColor(ctx, p.x, p.y, 3);
        samplePoints.background.push({ x: p.x, y: p.y, color: color });
        bgSamples.push(color);
      }
    });
  }

  if (bgSamples.length === 0) {
    // Fallback: use all top + middle points without segmentation filter
    bgPositions.forEach(function(p) {
      var color = sampleColor(ctx, p.x, p.y, 3);
      samplePoints.background.push({ x: p.x, y: p.y, color: color });
      bgSamples.push(color);
    });
  }
  var bg = avgColors(bgSamples);

  // ── Face proportions (normalized to cheekbone width) ──
  var fhW = dist2D(lm[70], lm[300], w, h);
  var cbW = dist2D(lm[234], lm[454], w, h);
  var jwW = dist2D(lm[172], lm[397], w, h);
  var fcH = dist2D(lm[10], lm[152], w, h);

  return {
    skinColor:     Object.assign(makeColorObj(skin), { lab: rgbToLab(skin) }),
    hairColor:     makeColorObj(hair),
    eyeColor:      eye ? makeColorObj(eye) : null,
    eyebrowColor:  makeColorObj(eyebrow),
    lipColor:      makeColorObj(lip),
    neckColor:     makeColorObj(neck),
    backgroundColor: { rgb: bg, hex: rgbToHex(bg) },
    faceProportions: {
      foreheadRatio: +(fhW/cbW).toFixed(3),
      jawRatio:      +(jwW/cbW).toFixed(3),
      heightRatio:   +(fcH/cbW).toFixed(3)
    },
    contrast: {
      skinHair: colorDist(skin, hair),
      skinEye:  eye ? colorDist(skin, eye) : null,
      skinLip:  colorDist(skin, lip),
      skinNeck: colorDist(skin, neck)
    },
    samplePoints: samplePoints,
    segmentationUsed: !!segMask
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

  var samplePoints = [
    { x: Math.round(lm[11].x * w), y: Math.round(lm[11].y * h), label: 'L.Shoulder' },
    { x: Math.round(lm[12].x * w), y: Math.round(lm[12].y * h), label: 'R.Shoulder' },
    { x: Math.round(lm[23].x * w), y: Math.round(lm[23].y * h), label: 'L.Hip' },
    { x: Math.round(lm[24].x * w), y: Math.round(lm[24].y * h), label: 'R.Hip' }
  ];

  return {
    bodyProportions: {
      shoulderHipRatio: +(shW/hpW).toFixed(3),
      shoulderWidth: Math.round(shW),
      hipWidth: Math.round(hpW),
      torsoLength: Math.round(torso)
    },
    samplePoints: samplePoints
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
