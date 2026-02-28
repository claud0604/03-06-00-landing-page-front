// ─── CONFIG ───
const DEMO_API_BASE = 'http://localhost:3060'; // TODO: update to production URL
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ─── STATE ───
let faceImageLoaded = false;
let bodyImageLoaded = false;

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
    el.textContent = '✓ On-device AI ready';
    el.className = 'mp-status ready';
    setTimeout(() => { el.style.opacity = '0'; }, 2000);
  } else if (e.detail === 'error') {
    el.textContent = '⚠ AI model failed to load';
    el.className = 'mp-status error';
  }
});

// ─── MODAL: FACE PHOTO ───
let faceModalDataUrl = null;
let bodyModalDataUrl = null;

function openFaceModal() {
  document.getElementById('faceModal').classList.add('open');
  document.body.style.overflow = 'hidden';
  // Restore preview if already has image
  if (faceModalDataUrl) {
    document.getElementById('faceModalPreview').src = faceModalDataUrl;
    document.getElementById('faceModalUpload').classList.add('has-image');
    document.getElementById('faceSaveBtn').disabled = false;
  }
}

function closeFaceModal() {
  document.getElementById('faceModal').classList.remove('open');
  document.body.style.overflow = '';
  // If not saved, reset modal upload state
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

    // Phase 2: Body analysis if body photo provided
    if (bodyImageLoaded && window.FaceAnalyzer) {
      const bodyImg = document.getElementById('bodyPreview');
      bodyAnalysis = await window.FaceAnalyzer.analyzeBody(bodyImg);
      if (bodyAnalysis && bodyAnalysis.error) {
        bodyAnalysis = null; // Non-critical, continue without body data
      }
    }

    // Phase 3: Send ONLY extracted JSON data to backend (NO images)
    const age = document.getElementById('ageInput').value || null;
    const gender = document.getElementById('genderSelect').value || null;

    const requestBody = {
      faceAnalysis: faceAnalysis,
      bodyAnalysis: bodyAnalysis,
      age: age ? parseInt(age) : null,
      gender: gender || null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      lang: navigator.language
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

// ─── DISPLAY RESULTS ───
function displayResults(diagnosis) {
  // Personal Color
  document.getElementById('resultColorType').textContent = diagnosis.personalColor || '—';
  document.getElementById('resultColorDetail').textContent = diagnosis.personalColorDetail || '';

  // Face Shape
  document.getElementById('resultFaceType').textContent = diagnosis.faceShape || '—';
  document.getElementById('resultFaceDetail').textContent = diagnosis.faceShapeDetail || '';

  // Body Type (only if body photo was uploaded and result exists)
  if (bodyImageLoaded && diagnosis.bodyType) {
    document.getElementById('resultBody').style.display = 'block';
    document.getElementById('resultBodyType').textContent = diagnosis.bodyType || '—';
    document.getElementById('resultBodyDetail').textContent = diagnosis.bodyTypeDetail || '';
  } else {
    document.getElementById('resultBody').style.display = 'none';
  }

  goToStep(3);
}

// ─── RESET ───
function resetDemo() {
  faceImageLoaded = false;
  bodyImageLoaded = false;
  faceModalDataUrl = null;
  bodyModalDataUrl = null;

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

  document.querySelectorAll('.analyzing-step').forEach(el => {
    el.classList.remove('active', 'done');
  });
  document.getElementById('aStep1').classList.add('active');

  updateSubmitButton();
  goToStep(1);
}
