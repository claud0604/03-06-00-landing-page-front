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

  var items = [
    { key: 'skin', label: '피부', color: lastFaceAnalysis.skinColor },
    { key: 'hair', label: '헤어', color: lastFaceAnalysis.hairColor },
    { key: 'eye', label: '눈', color: lastFaceAnalysis.eyeColor },
    { key: 'eyebrow', label: '눈썹', color: lastFaceAnalysis.eyebrowColor },
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
