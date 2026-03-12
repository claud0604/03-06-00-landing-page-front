// ─── CONFIG ───
const DEMO_API_BASE = 'https://api-030600-landing.apls.kr';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ─── STATE ───
let faceImageLoaded = false;
let bodyImageLoaded = false;
let lastFaceAnalysis = null;
let lastBodyAnalysis = null;

// ─── VISUALIZATION COLORS ───
const VIZ_COLORS = {
  skin:       { stroke: '#3b82f6', label: 'Skin' },
  hair:       { stroke: '#22c55e', label: 'Hair' },
  eyebrow:    { stroke: '#a855f7', label: 'Eyebrow' },
  eye:        { stroke: '#ef4444', label: 'Eye' },
  lip:        { stroke: '#ec4899', label: 'Lip' },
  neck:       { stroke: '#f97316', label: 'Neck' },
  background: { stroke: '#6b7280', label: 'Background' }
};

// ─── THEME SYSTEM ───
const html = document.documentElement;
const toggle = document.getElementById('themeToggle');
const iconDark = document.getElementById('icon-dark');
const iconLight = document.getElementById('icon-light');

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}
function applyTheme(theme) {
  html.setAttribute('data-theme', theme);
  localStorage.setItem('apl-theme', theme);
  if (theme === 'light') {
    toggle.classList.add('light-on');
    iconLight.classList.add('active');
    iconDark.classList.remove('active');
  } else {
    toggle.classList.remove('light-on');
    iconDark.classList.add('active');
    iconLight.classList.remove('active');
  }
}
function toggleTheme() {
  const current = html.getAttribute('data-theme') || getSystemTheme();
  applyTheme(current === 'dark' ? 'light' : 'dark');
}
const savedTheme = localStorage.getItem('apl-theme');
applyTheme(savedTheme || getSystemTheme());

// ─── LANG DROPDOWN ───
function toggleLangDropdown() {
  document.getElementById('langDropdown').classList.toggle('open');
}
document.addEventListener('click', (e) => {
  if (!e.target.closest('.lang-switcher')) {
    document.getElementById('langDropdown').classList.remove('open');
  }
});

// ─── MEDIAPIPE STATUS ───
window.addEventListener('faceanalyzer-state', (e) => {
  const el = document.getElementById('mpStatus');
  if (!el) return;
  if (e.detail === 'ready') {
    el.textContent = '\u2713 On-device AI ready';
    el.className = 'mp-status ready';
    setTimeout(() => { el.style.opacity = '0'; }, 2000);
  } else if (e.detail === 'error') {
    el.textContent = '\u26a0 AI model failed to load';
    el.className = 'mp-status error';
  }
});

// ─── MODAL: FACE PHOTO ───
let faceModalDataUrl = null;
let bodyModalDataUrl = null;

function openFaceModal() {
  document.getElementById('faceModal').classList.add('open');
  document.body.style.overflow = 'hidden';
  if (faceModalDataUrl) {
    document.getElementById('faceModalPreview').src = faceModalDataUrl;
    document.getElementById('faceModalUpload').classList.add('has-image');
    document.getElementById('faceSaveBtn').disabled = false;
  }
}

function closeFaceModal() {
  document.getElementById('faceModal').classList.remove('open');
  document.body.style.overflow = '';
  if (!faceImageLoaded) {
    faceModalDataUrl = null;
    document.getElementById('faceInput').value = '';
    document.getElementById('faceModalPreview').src = '';
    document.getElementById('faceModalUpload').classList.remove('has-image');
    document.getElementById('faceSaveBtn').disabled = true;
  }
}

function saveFacePhoto() {
  if (!faceModalDataUrl) return;
  faceImageLoaded = true;
  document.getElementById('facePreview').src = faceModalDataUrl;
  document.getElementById('faceUploadZone').classList.add('has-image');
  updateSubmitButton();
  document.getElementById('faceModal').classList.remove('open');
  document.body.style.overflow = '';
}

// ─── MODAL: BODY PHOTO ───
function openBodyModal() {
  document.getElementById('bodyModal').classList.add('open');
  document.body.style.overflow = 'hidden';
  if (bodyModalDataUrl) {
    document.getElementById('bodyModalPreview').src = bodyModalDataUrl;
    document.getElementById('bodyModalUpload').classList.add('has-image');
    document.getElementById('bodySaveBtn').disabled = false;
  }
}

function closeBodyModal() {
  document.getElementById('bodyModal').classList.remove('open');
  document.body.style.overflow = '';
  if (!bodyImageLoaded) {
    bodyModalDataUrl = null;
    document.getElementById('bodyInput').value = '';
    document.getElementById('bodyModalPreview').src = '';
    document.getElementById('bodyModalUpload').classList.remove('has-image');
    document.getElementById('bodySaveBtn').disabled = true;
  }
}

function saveBodyPhoto() {
  if (!bodyModalDataUrl) return;
  bodyImageLoaded = true;
  document.getElementById('bodyPreview').src = bodyModalDataUrl;
  document.getElementById('bodyUploadZone').classList.add('has-image');
  updateSubmitButton();
  document.getElementById('bodyModal').classList.remove('open');
  document.body.style.overflow = '';
}

// ─── MODAL: FILE HANDLING ───
function handleModalUpload(input, type) {
  const file = input.files[0];
  if (!file) return;

  if (file.size > MAX_FILE_SIZE) {
    alert('File is too large. Maximum size is 10MB.');
    input.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;

    if (type === 'face') {
      faceModalDataUrl = dataUrl;
      document.getElementById('faceModalPreview').src = dataUrl;
      document.getElementById('faceModalUpload').classList.add('has-image');
      document.getElementById('faceSaveBtn').disabled = false;
    } else {
      bodyModalDataUrl = dataUrl;
      document.getElementById('bodyModalPreview').src = dataUrl;
      document.getElementById('bodyModalUpload').classList.add('has-image');
      document.getElementById('bodySaveBtn').disabled = false;
    }
  };
  reader.readAsDataURL(file);
}

function removeModalImage(event, type) {
  event.stopPropagation();

  if (type === 'face') {
    faceModalDataUrl = null;
    document.getElementById('faceInput').value = '';
    document.getElementById('faceModalPreview').src = '';
    document.getElementById('faceModalUpload').classList.remove('has-image');
    document.getElementById('faceSaveBtn').disabled = true;
  } else {
    bodyModalDataUrl = null;
    document.getElementById('bodyInput').value = '';
    document.getElementById('bodyModalPreview').src = '';
    document.getElementById('bodyModalUpload').classList.remove('has-image');
    document.getElementById('bodySaveBtn').disabled = true;
  }
}

// ─── UPLOAD ZONE: REMOVE (from main page) ───
function removeImage(event, type) {
  event.stopPropagation();

  if (type === 'face') {
    faceImageLoaded = false;
    faceModalDataUrl = null;
    document.getElementById('faceInput').value = '';
    document.getElementById('facePreview').src = '';
    document.getElementById('faceUploadZone').classList.remove('has-image');
    document.getElementById('faceModalPreview').src = '';
    document.getElementById('faceModalUpload').classList.remove('has-image');
    document.getElementById('faceSaveBtn').disabled = true;
  } else {
    bodyImageLoaded = false;
    bodyModalDataUrl = null;
    document.getElementById('bodyInput').value = '';
    document.getElementById('bodyPreview').src = '';
    document.getElementById('bodyUploadZone').classList.remove('has-image');
    document.getElementById('bodyModalPreview').src = '';
    document.getElementById('bodyModalUpload').classList.remove('has-image');
    document.getElementById('bodySaveBtn').disabled = true;
  }

  updateSubmitButton();
}

function updateSubmitButton() {
  const btn = document.getElementById('submitBtn');
  btn.disabled = !faceImageLoaded;
}

// ─── STEP NAVIGATION ───
function goToStep(stepNum) {
  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.step-dot').forEach(d => {
    d.classList.remove('active');
    d.classList.remove('done');
  });

  document.getElementById('step' + stepNum).classList.add('active');

  for (let i = 1; i <= 3; i++) {
    const dot = document.getElementById('dot' + i);
    if (i < stepNum) dot.classList.add('done');
    if (i === stepNum) dot.classList.add('active');
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showError(message) {
  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('stepError').classList.add('active');
  if (message) document.getElementById('errorMessage').textContent = message;
}

// ─── ANALYSIS PROGRESS ANIMATION ───
async function animateAnalysis() {
  const steps = ['aStep1', 'aStep2', 'aStep3', 'aStep4', 'aStep5'];
  const bar = document.getElementById('progressBar');
  const percents = [15, 30, 50, 70, 85];

  for (let i = 0; i < steps.length; i++) {
    const el = document.getElementById(steps[i]);
    el.classList.add('active');
    bar.style.width = percents[i] + '%';

    if (i > 0) {
      document.getElementById(steps[i - 1]).classList.remove('active');
      document.getElementById(steps[i - 1]).classList.add('done');
    }

    await delay(800);
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── START DIAGNOSIS ───
async function startDiagnosis() {
  if (!faceImageLoaded) return;

  goToStep(2);

  const analysisAnimation = animateAnalysis();

  try {
    // Phase 1: Client-side face analysis with MediaPipe
    const faceImg = document.getElementById('facePreview');
    let faceAnalysis = null;
    let bodyAnalysis = null;

    // Wait for FaceAnalyzer if not ready yet
    if (window.FaceAnalyzer) {
      if (!window.FaceAnalyzer.isReady()) {
        await window.FaceAnalyzer.init();
      }
      if (window.FaceAnalyzer.isReady()) {
        faceAnalysis = await window.FaceAnalyzer.analyzeFace(faceImg);
        if (faceAnalysis && faceAnalysis.error === 'no_face_detected') {
          throw new Error('Face not detected. Please upload a clear front-facing photo.');
        }
      }
    }

    if (!faceAnalysis) {
      throw new Error('Face analysis AI is not available. Please refresh and try again.');
    }

    // Store for visualization
    lastFaceAnalysis = faceAnalysis;

    // Phase 2: Body analysis if body photo provided
    if (bodyImageLoaded && window.FaceAnalyzer) {
      const bodyImg = document.getElementById('bodyPreview');
      bodyAnalysis = await window.FaceAnalyzer.analyzeBody(bodyImg);
      if (bodyAnalysis && bodyAnalysis.error) {
        bodyAnalysis = null; // Non-critical, continue without body data
      }
    }

    // Store for visualization
    lastBodyAnalysis = bodyAnalysis;

    // Phase 3: Send ONLY extracted JSON data to backend (NO images)
    const age = document.getElementById('ageInput').value || null;
    const gender = document.getElementById('genderSelect').value || null;

    // Get current language from i18n or navigator
    const currentLang = (typeof getCurrentLang === 'function') ? getCurrentLang() : navigator.language;

    const requestBody = {
      faceAnalysis: faceAnalysis,
      bodyAnalysis: bodyAnalysis,
      age: age ? parseInt(age) : null,
      gender: gender || null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      lang: currentLang
    };

    console.log('Sending extracted data (no images):', Object.keys(requestBody));

    const response = await fetch(DEMO_API_BASE + '/api/demo/diagnose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    await analysisAnimation;

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Diagnosis failed');
    }

    const result = await response.json();

    // Complete progress bar
    document.getElementById('progressBar').style.width = '100%';
    const lastStep = document.getElementById('aStep5');
    lastStep.classList.remove('active');
    lastStep.classList.add('done');
    await delay(500);

    displayResults(result.diagnosis);

  } catch (error) {
    console.error('Diagnosis error:', error);
    await analysisAnimation;
    showError(error.message);
  }
}

// ─── VISUALIZATION ───
function drawFaceVisualization() {
  if (!lastFaceAnalysis || !lastFaceAnalysis.samplePoints) return;

  const canvas = document.getElementById('faceResultCanvas');
  const ctx = canvas.getContext('2d');
  const faceImg = document.getElementById('facePreview');

  const imgW = faceImg.naturalWidth || faceImg.width;
  const imgH = faceImg.naturalHeight || faceImg.height;

  // Scale canvas to fit max 360px width
  const maxW = 360;
  const scale = Math.min(maxW / imgW, 1);
  canvas.width = Math.round(imgW * scale);
  canvas.height = Math.round(imgH * scale);

  ctx.drawImage(faceImg, 0, 0, canvas.width, canvas.height);

  const sp = lastFaceAnalysis.samplePoints;
  const scaleX = canvas.width / imgW;
  const scaleY = canvas.height / imgH;

  // Draw points for each category
  Object.keys(sp).forEach(function(category) {
    var points = sp[category];
    var vizColor = VIZ_COLORS[category];
    if (!vizColor || !points || !points.length) return;

    points.forEach(function(p) {
      var cx = p.x * scaleX;
      var cy = p.y * scaleY;
      var r = 5;

      // Fill with extracted color
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgb(' + p.color.r + ',' + p.color.g + ',' + p.color.b + ')';
      ctx.fill();

      // Stroke with category color
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = vizColor.stroke;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  });
}

function drawBodyVisualization() {
  if (!lastBodyAnalysis || !lastBodyAnalysis.samplePoints) return;

  var wrap = document.getElementById('bodyCanvasWrap');
  wrap.style.display = 'block';

  var canvas = document.getElementById('bodyResultCanvas');
  var ctx = canvas.getContext('2d');
  var bodyImg = document.getElementById('bodyPreview');

  var imgW = bodyImg.naturalWidth || bodyImg.width;
  var imgH = bodyImg.naturalHeight || bodyImg.height;

  var maxW = 240;
  var scale = Math.min(maxW / imgW, 1);
  canvas.width = Math.round(imgW * scale);
  canvas.height = Math.round(imgH * scale);

  ctx.drawImage(bodyImg, 0, 0, canvas.width, canvas.height);

  var scaleX = canvas.width / imgW;
  var scaleY = canvas.height / imgH;

  lastBodyAnalysis.samplePoints.forEach(function(p) {
    var cx = p.x * scaleX;
    var cy = p.y * scaleY;

    // Draw point
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.6)';
    ctx.fill();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw label
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeText(p.label, cx + 10, cy + 4);
    ctx.fillText(p.label, cx + 10, cy + 4);
  });
}

function buildLegend() {
  if (!lastFaceAnalysis) return;

  var legend = document.getElementById('vizLegend');
  legend.innerHTML = '';

  var sp = lastFaceAnalysis.samplePoints;
  var colors = lastFaceAnalysis;

  var items = [
    { key: 'skin', colorObj: colors.skinColor },
    { key: 'hair', colorObj: colors.hairColor },
    { key: 'eyebrow', colorObj: colors.eyebrowColor },
    { key: 'eye', colorObj: colors.eyeColor },
    { key: 'lip', colorObj: colors.lipColor },
    { key: 'neck', colorObj: colors.neckColor },
    { key: 'background', colorObj: colors.backgroundColor }
  ];

  items.forEach(function(item) {
    if (!sp[item.key] || !sp[item.key].length) return;
    var viz = VIZ_COLORS[item.key];

    var el = document.createElement('div');
    el.className = 'viz-legend-item';

    var dot = document.createElement('span');
    dot.className = 'viz-legend-dot';
    dot.style.borderColor = viz.stroke;
    dot.style.backgroundColor = 'transparent';
    el.appendChild(dot);

    var label = document.createElement('span');
    label.textContent = viz.label;
    el.appendChild(label);

    if (item.colorObj && item.colorObj.hex) {
      var swatch = document.createElement('span');
      swatch.className = 'viz-legend-swatch';
      swatch.style.backgroundColor = item.colorObj.hex;
      swatch.title = item.colorObj.hex;
      el.appendChild(swatch);
    }

    legend.appendChild(el);
  });
}

// ─── COLOR SWATCHES ───
function buildColorSwatches() {
  var container = document.getElementById('colorSwatches');
  if (!container || !lastFaceAnalysis) return;
  container.innerHTML = '';

  // Row 1: hair, eyebrow, eye  |  Row 2: skin, lip, neck
  var items = [
    { key: 'hair', label: '헤어', color: lastFaceAnalysis.hairColor },
    { key: 'eyebrow', label: '눈썹', color: lastFaceAnalysis.eyebrowColor },
    { key: 'eye', label: '눈동자', color: lastFaceAnalysis.eyeColor },
    { key: 'skin', label: '피부', color: lastFaceAnalysis.skinColor },
    { key: 'lip', label: '입술', color: lastFaceAnalysis.lipColor },
    { key: 'neck', label: '목', color: lastFaceAnalysis.neckColor }
  ];

  items.forEach(function(item) {
    if (!item.color) return;
    var el = document.createElement('div');
    el.className = 'color-swatch-item';

    var circle = document.createElement('div');
    circle.className = 'color-swatch-circle';
    circle.style.backgroundColor = item.color.hex;

    var label = document.createElement('div');
    label.className = 'color-swatch-label';
    label.textContent = item.label;

    var value = document.createElement('div');
    value.className = 'color-swatch-value';
    if (item.color.lab) {
      value.textContent = item.color.lab.l + ' / ' + item.color.lab.a + ' / ' + item.color.lab.b;
    }

    el.appendChild(circle);
    el.appendChild(label);
    el.appendChild(value);
    container.appendChild(el);
  });
}

// ─── CONTRAST BARS ───
var CONTRAST_LEVELS = ['Low', 'Slightly Low', 'Medium', 'Slightly High', 'High'];

function buildContrastBars() {
  var container = document.getElementById('contrastBars');
  if (!container || !lastFaceAnalysis || !lastFaceAnalysis.contrast) return;
  container.innerHTML = '';

  var title = document.createElement('h4');
  title.textContent = 'Contrast';
  container.appendChild(title);

  var items = [
    { label: '피부 ↔ 헤어', value: lastFaceAnalysis.contrast.skinHair },
    { label: '피부 ↔ 눈', value: lastFaceAnalysis.contrast.skinEye },
    { label: '피부 ↔ 입술', value: lastFaceAnalysis.contrast.skinLip }
  ];

  items.forEach(function(item) {
    if (item.value == null) return;

    var row = document.createElement('div');
    row.className = 'contrast-bar-item';

    var label = document.createElement('div');
    label.className = 'contrast-bar-label';
    label.textContent = item.label + ' (' + item.value + ')';

    var track = document.createElement('div');
    track.className = 'contrast-bar-track';

    // Map value to position: 0-300 range, clamped
    var pct = Math.min(100, Math.max(0, (item.value / 300) * 100));
    var marker = document.createElement('div');
    marker.className = 'contrast-bar-marker';
    marker.style.left = pct + '%';

    track.appendChild(marker);

    var scale = document.createElement('div');
    scale.className = 'contrast-bar-scale';
    CONTRAST_LEVELS.forEach(function(lvl) {
      var span = document.createElement('span');
      span.textContent = lvl;
      scale.appendChild(span);
    });

    row.appendChild(label);
    row.appendChild(track);
    row.appendChild(scale);
    container.appendChild(row);
  });
}

// ─── DISPLAY RESULTS ───
function displayResults(diagnosis) {
  // Personal Color
  document.getElementById('resultColorType').textContent = diagnosis.personalColor || '\u2014';

  // Extract explanation part only (after ◼︎ 설명)
  var detail = diagnosis.personalColorDetail || '';
  var explainIdx = detail.indexOf('◼︎ 설명');
  if (explainIdx !== -1) {
    detail = detail.substring(explainIdx);
  }
  document.getElementById('resultColorDetail').textContent = detail;

  // Face Shape
  document.getElementById('resultFaceType').textContent = diagnosis.faceShape || '\u2014';
  document.getElementById('resultFaceDetail').textContent = diagnosis.faceShapeDetail || '';

  // Body Type (only if body photo was uploaded and result exists)
  if (bodyImageLoaded && diagnosis.bodyType) {
    document.getElementById('resultBody').style.display = 'block';
    document.getElementById('resultBodyType').textContent = diagnosis.bodyType || '\u2014';
    document.getElementById('resultBodyDetail').textContent = diagnosis.bodyTypeDetail || '';
  } else {
    document.getElementById('resultBody').style.display = 'none';
  }

  goToStep(3);

  // Draw visualizations after step transition
  setTimeout(function() {
    buildColorSwatches();
    buildContrastBars();
    drawFaceVisualization();
    if (bodyImageLoaded && lastBodyAnalysis) {
      drawBodyVisualization();
    }
    buildLegend();
  }, 100);
}

// ─── TEST MODE — Internal Classifier via /api/demo/classify ───
// 얼굴형 한글 매핑 (Expert 패널과 동일)
var FACE_SHAPE_KO = {
  'Oval': '타원형 (Oval)',
  'Round': '둥근형 (Round)',
  'Square': '사각형 (Square)',
  'Oblong': '긴형 (Oblong)',
  'Heart': '하트형 (Heart)',
  'Diamond': '다이아몬드형 (Diamond)',
  'Inverted Triangle': '역삼각형 (Inverted Triangle)'
};

// 체형 한글 매핑
var BODY_TYPE_KO = {
  'Straight': '스트레이트 (Straight)',
  'Wave': '웨이브 (Wave)',
  'Natural': '내추럴 (Natural)',
  'Romantic': '로맨틱 (Romantic)',
  'Dramatic': '드라마틱 (Dramatic)'
};

async function runTestDiagnosis() {
  if (!faceImageLoaded) {
    alert('얼굴 사진을 먼저 업로드한 후 TEST 버튼을 눌러주세요.');
    return;
  }

  // Run MediaPipe if not already done
  if (!lastFaceAnalysis && window.FaceAnalyzer && window.FaceAnalyzer.isReady()) {
    const faceImg = document.getElementById('facePreview');
    lastFaceAnalysis = await window.FaceAnalyzer.analyzeFace(faceImg);
  }

  if (!lastFaceAnalysis || !lastFaceAnalysis.skinColor || !lastFaceAnalysis.skinColor.lab) {
    alert('얼굴 분석에 실패했습니다. 사진을 다시 업로드해주세요.');
    return;
  }

  openTestModal();
  document.getElementById('testResultBody').innerHTML = '<p style="color:var(--text-dim);font-size:13px;text-align:center;">분류 중...</p>';

  try {
    const response = await fetch(DEMO_API_BASE + '/api/demo/classify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        faceAnalysis: lastFaceAnalysis,
        bodyAnalysis: lastBodyAnalysis
      })
    });

    if (!response.ok) throw new Error('Classify API failed');
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Classification failed');

    renderTestResult(data.result);
  } catch (err) {
    document.getElementById('testResultBody').innerHTML =
      '<div class="error-box"><h3>오류</h3><p>' + err.message + '</p></div>';
  }
}

function openTestModal() {
  document.getElementById('testResultModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeTestModal() {
  document.getElementById('testResultModal').classList.remove('open');
  document.body.style.overflow = '';
}

function labToCss(lab) {
  // Approximate LAB to RGB for CSS display
  if (!lab) return '#888';
  var l = lab.l, a = lab.a, b = lab.b;
  var fy = (l + 16) / 116;
  var fx = a / 500 + fy;
  var fz = fy - b / 200;
  var d = 6/29;
  var xr = fx > d ? fx*fx*fx : (fx - 16/116)*3*d*d;
  var yr = l > 8 ? fy*fy*fy : l / 903.3;
  var zr = fz > d ? fz*fz*fz : (fz - 16/116)*3*d*d;
  var x = xr * 0.95047, y = yr * 1.0, z = zr * 1.08883;
  var rl = x*3.2406 + y*(-1.5372) + z*(-0.4986);
  var gl = x*(-0.9689) + y*1.8758 + z*0.0415;
  var bl = x*0.0557 + y*(-0.2040) + z*1.0570;
  function g(c) { return c <= 0.0031308 ? 12.92*c : 1.055*Math.pow(c,1/2.4)-0.055; }
  var r = Math.round(Math.min(255,Math.max(0,g(rl)*255)));
  var gr = Math.round(Math.min(255,Math.max(0,g(gl)*255)));
  var bl2 = Math.round(Math.min(255,Math.max(0,g(bl)*255)));
  return 'rgb('+r+','+gr+','+bl2+')';
}

function confidenceBadge(score) {
  if (score >= 0.75) return '<span class="test-badge test-badge-high">' + score + '</span>';
  if (score >= 0.50) return '<span class="test-badge test-badge-mid">' + score + '</span>';
  return '<span class="test-badge test-badge-low">' + score + '</span>';
}

function renderTestResult(r) {
  var pc = r.personalColor;
  var face = r.faceShape;
  var body = r.bodyType;
  var bg = r.backgroundCorrection;
  var conf = r.confidence;

  var html = '';

  // 퍼스널컬러
  var wc = r.warmCoolModule;
  var seasonColors = { Spring: '#e67e22', Summer: '#3498db', Autumn: '#a0522d', Winter: '#2c3e50' };
  var seasonKo = { Spring: '봄', Summer: '여름', Autumn: '가을', Winter: '겨울' };
  html += '<div class="test-section">';
  html += '<div class="test-section-title">퍼스널컬러</div>';

  if (wc) {
    // 1) 웜/쿨 (가장 위)
    var tendencyColors = {
      'Warm': '#e67e22', 'Neutral Warm': '#f0a04b',
      'Neutral': '#888',
      'Neutral Cool': '#5dade2', 'Cool': '#3498db'
    };
    var tendencyKo = {
      'Warm': '웜', 'Neutral Warm': '뉴트럴 웜',
      'Neutral': '뉴트럴',
      'Neutral Cool': '뉴트럴 쿨', 'Cool': '쿨'
    };
    var wcColor = tendencyColors[wc.warmCool.tendency] || '#888';
    var wcScore = Math.round(wc.warmCool.score * 100);
    html += '<div class="test-row"><span class="test-label">웜/쿨</span><span class="test-value" style="color:' + wcColor + '; font-weight:bold; font-size:16px;">' + wc.warmCool.tendency + ' (' + (tendencyKo[wc.warmCool.tendency] || '') + ')</span></div>';
    html += '<div class="test-row"><span class="test-label">웜 점수</span><span class="test-value">';
    html += '<div style="display:inline-flex;align-items:center;gap:6px;width:100%;">';
    html += '<span style="font-size:11px;color:#3498db;">Cool</span>';
    html += '<div style="flex:1;height:8px;background:#eee;border-radius:4px;position:relative;">';
    html += '<div style="width:' + wcScore + '%;height:100%;border-radius:4px;background:linear-gradient(to right,#3498db,#888,#e67e22);"></div>';
    html += '<div style="position:absolute;left:' + wcScore + '%;top:-3px;width:3px;height:14px;background:#333;border-radius:2px;transform:translateX(-50%);"></div>';
    html += '</div>';
    html += '<span style="font-size:11px;color:#e67e22;">Warm</span>';
    html += '<span style="margin-left:4px;font-weight:bold;">' + wcScore + '%</span>';
    html += '</div></span></div>';

    // 2) 시즌
    var ss = wc.season;
    html += '<div class="test-row"><span class="test-label">시즌</span><span class="test-value" style="font-size:16px; font-weight:bold; color:' + (seasonColors[ss.primary] || '#333') + ';">' + ss.primary + ' (' + (seasonKo[ss.primary] || '') + ')</span></div>';
    html += '<div class="test-row"><span class="test-label">점수</span><span class="test-value"><div style="display:flex;flex-direction:column;gap:3px;width:100%;">';
    ['Spring', 'Summer', 'Autumn', 'Winter'].forEach(function(s) {
      var pct = Math.round((ss.scores[s] || 0) * 100);
      html += '<div style="display:flex;align-items:center;gap:4px;">';
      html += '<span style="width:28px;font-size:11px;color:' + seasonColors[s] + ';">' + seasonKo[s] + '</span>';
      html += '<div style="flex:1;height:6px;background:#eee;border-radius:3px;">';
      html += '<div style="width:' + pct + '%;height:100%;background:' + seasonColors[s] + ';border-radius:3px;"></div>';
      html += '</div>';
      html += '<span style="width:32px;font-size:11px;text-align:right;">' + pct + '%</span>';
      html += '</div>';
    });
    html += '</div></span></div>';
  } else {
    // fallback
    html += '<div class="test-row"><span class="test-label">시즌</span><span class="test-value">' + pc.season + '</span></div>';
  }

  html += '<div class="test-row"><span class="test-label">명도 (Value)</span><span class="test-value">' + pc.characteristics.value + ' (' + pc.characteristics.valueScore + ')</span></div>';
  html += '<div class="test-row"><span class="test-label">채도 (Chroma)</span><span class="test-value">' + pc.characteristics.chroma + ' (' + pc.characteristics.chromaScore + ')</span></div>';
  html += '<div class="test-row"><span class="test-label">대비 (Contrast)</span><span class="test-value">' + pc.characteristics.contrast + ' (' + pc.characteristics.contrastScore + ')</span></div>';

  // 후보 타입
  if (pc.alternates && pc.alternates.length) {
    html += '<div style="padding-top:6px;">';
    pc.alternates.forEach(function(alt) {
      html += '<div class="test-alt">  &rarr; ' + alt.type + ' (' + alt.confidence + ')</div>';
    });
    html += '</div>';
  }
  html += '</div>';

  // 측정값 (3축 + 색상각)
  if (pc.debug) {
    html += '<div class="test-section">';
    html += '<div class="test-section-title">측정값 (3축 + 색상각)</div>';
    var skinLab = { l: pc.debug.skinL, a: pc.debug.skinA, b: pc.debug.skinB };
    html += '<div class="test-row"><span class="test-label"><span class="test-color-dot" style="background:' + labToCss(skinLab) + '"></span>피부 LAB</span><span class="test-value">' + pc.debug.skinL + ' / ' + pc.debug.skinA + ' / ' + pc.debug.skinB + '</span></div>';
    html += '<div class="test-row"><span class="test-label">축1: 피부 명도 (L*)</span><span class="test-value">' + pc.debug.skinL + ' [' + pc.debug.skinLightnessLevel + ']</span></div>';
    html += '<div class="test-row"><span class="test-label">축2: 피부 채도 √(a²+b²)</span><span class="test-value">' + pc.debug.skinChromaValue + ' [' + pc.debug.skinChromaLevel + ']</span></div>';
    html += '<div class="test-row"><span class="test-label">축3: 요소 채도 (평균)</span><span class="test-value">' + pc.debug.elemChromaValue + ' [' + pc.debug.elemChromaLevel + '] (' + pc.debug.elemChromaCount + '개)</span></div>';
    html += '<div class="test-row"><span class="test-label">색상각 atan2(b*,a*)</span><span class="test-value">' + pc.debug.hueAngle + '° → ' + pc.debug.hueTendency + '</span></div>';
    html += '<div class="test-row"><span class="test-label">웜 점수 / 쿨 점수</span><span class="test-value">' + pc.debug.warmScore + ' / ' + pc.debug.coolScore + '</span></div>';
    if (pc.debug.allScores) {
      html += '<div style="padding-top:4px;font-size:11px;color:#888;">';
      pc.debug.allScores.forEach(function(s) { html += s.type + ': ' + s.score + '&nbsp;&nbsp;'; });
      html += '</div>';
    }
    html += '</div>';
  }

  // 배경색 보정
  if (bg && bg.reasons && bg.reasons.length > 0) {
    html += '<div class="test-section">';
    html += '<div class="test-section-title">배경색 보정</div>';
    html += '<div class="test-row"><span class="test-label"><span class="test-color-dot" style="background:' + labToCss(bg.original) + '"></span>원본</span><span class="test-value">' + bg.original.l + ' / ' + bg.original.a + ' / ' + bg.original.b + '</span></div>';
    html += '<div class="test-row"><span class="test-label"><span class="test-color-dot" style="background:' + labToCss(bg.corrected) + '"></span>보정값</span><span class="test-value">' + bg.corrected.l + ' / ' + bg.corrected.a + ' / ' + bg.corrected.b + '</span></div>';
    html += '<div class="test-row"><span class="test-label">보정량</span><span class="test-value">dL=' + bg.adjustments.dL + ' dA=' + bg.adjustments.dA + ' dB=' + bg.adjustments.dB + '</span></div>';
    html += '<div class="test-row"><span class="test-label">신뢰도</span><span class="test-value">' + bg.confidence + '</span></div>';
    bg.reasons.forEach(function(reason) {
      html += '<div class="test-alt">  ' + reason + '</div>';
    });
    html += '</div>';
  }

  // 얼굴형
  if (face) {
    var faceKo = FACE_SHAPE_KO[face.type] || face.type;
    html += '<div class="test-section">';
    html += '<div class="test-section-title">얼굴형</div>';
    html += '<div class="test-row"><span class="test-label">타입</span><span class="test-value">' + faceKo + '</span></div>';
    html += '<div class="test-row"><span class="test-label">신뢰도</span><span class="test-value">' + confidenceBadge(face.confidence) + '</span></div>';
    if (face.proportions) {
      html += '<div class="test-row"><span class="test-label">이마 비율</span><span class="test-value">' + face.proportions.foreheadRatio + '</span></div>';
      html += '<div class="test-row"><span class="test-label">턱 비율</span><span class="test-value">' + face.proportions.jawRatio + '</span></div>';
      html += '<div class="test-row"><span class="test-label">세로 비율</span><span class="test-value">' + face.proportions.heightRatio + '</span></div>';
    }
    html += '</div>';
  }

  // 체형
  if (body) {
    var bodyKo = BODY_TYPE_KO[body.type] || body.type;
    html += '<div class="test-section">';
    html += '<div class="test-section-title">체형</div>';
    html += '<div class="test-row"><span class="test-label">타입</span><span class="test-value">' + bodyKo + '</span></div>';
    html += '<div class="test-row"><span class="test-label">신뢰도</span><span class="test-value">' + confidenceBadge(body.confidence) + '</span></div>';
    html += '</div>';
  }

  // 종합 신뢰도
  var strategyKo = { 'internal': '내부 분류기', 'hybrid': '하이브리드', 'gemini': 'Gemini 위임' };
  html += '<div class="test-section">';
  html += '<div class="test-section-title">종합</div>';
  html += '<div class="test-row"><span class="test-label">종합 신뢰도</span><span class="test-value">' + confidenceBadge(conf.overall) + '</span></div>';
  html += '<div class="test-row"><span class="test-label">전략</span><span class="test-value">' + (strategyKo[r.strategy] || r.strategy) + '</span></div>';
  html += '</div>';

  document.getElementById('testResultBody').innerHTML = html;
}

// ─── RESET ───
function resetDemo() {
  faceImageLoaded = false;
  bodyImageLoaded = false;
  faceModalDataUrl = null;
  bodyModalDataUrl = null;
  lastFaceAnalysis = null;
  lastBodyAnalysis = null;

  document.getElementById('faceInput').value = '';
  document.getElementById('bodyInput').value = '';
  document.getElementById('facePreview').src = '';
  document.getElementById('bodyPreview').src = '';
  document.getElementById('faceUploadZone').classList.remove('has-image');
  document.getElementById('bodyUploadZone').classList.remove('has-image');
  document.getElementById('faceModalPreview').src = '';
  document.getElementById('bodyModalPreview').src = '';
  document.getElementById('faceModalUpload').classList.remove('has-image');
  document.getElementById('bodyModalUpload').classList.remove('has-image');
  document.getElementById('faceSaveBtn').disabled = true;
  document.getElementById('bodySaveBtn').disabled = true;
  document.getElementById('ageInput').value = '';
  document.getElementById('genderSelect').value = '';
  document.getElementById('progressBar').style.width = '0%';

  // Reset visualization
  var faceCanvas = document.getElementById('faceResultCanvas');
  faceCanvas.getContext('2d').clearRect(0, 0, faceCanvas.width, faceCanvas.height);
  var bodyCanvas = document.getElementById('bodyResultCanvas');
  bodyCanvas.getContext('2d').clearRect(0, 0, bodyCanvas.width, bodyCanvas.height);
  document.getElementById('bodyCanvasWrap').style.display = 'none';
  document.getElementById('vizLegend').innerHTML = '';
  document.getElementById('colorSwatches').innerHTML = '';
  document.getElementById('contrastBars').innerHTML = '';

  document.querySelectorAll('.analyzing-step').forEach(el => {
    el.classList.remove('active', 'done');
  });
  document.getElementById('aStep1').classList.add('active');

  updateSubmitButton();
  goToStep(1);
}
