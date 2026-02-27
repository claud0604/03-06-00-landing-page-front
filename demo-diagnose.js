// ─── CONFIG ───
const DEMO_API_BASE = 'http://localhost:3060'; // TODO: update to production URL
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ─── STATE ───
let faceImageData = null; // { base64, mimeType }
let bodyImageData = null; // { base64, mimeType }

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

// ─── FILE HANDLING ───
function handleFileSelect(input, type) {
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
    const base64 = dataUrl.split(',')[1];
    const mimeType = file.type || 'image/jpeg';

    if (type === 'face') {
      faceImageData = { base64, mimeType };
      document.getElementById('facePreview').src = dataUrl;
      document.getElementById('faceUploadZone').classList.add('has-image');
    } else {
      bodyImageData = { base64, mimeType };
      document.getElementById('bodyPreview').src = dataUrl;
      document.getElementById('bodyUploadZone').classList.add('has-image');
    }

    updateSubmitButton();
  };
  reader.readAsDataURL(file);
}

function removeImage(event, type) {
  event.stopPropagation();

  if (type === 'face') {
    faceImageData = null;
    document.getElementById('faceInput').value = '';
    document.getElementById('facePreview').src = '';
    document.getElementById('faceUploadZone').classList.remove('has-image');
  } else {
    bodyImageData = null;
    document.getElementById('bodyInput').value = '';
    document.getElementById('bodyPreview').src = '';
    document.getElementById('bodyUploadZone').classList.remove('has-image');
  }

  updateSubmitButton();
}

function updateSubmitButton() {
  const btn = document.getElementById('submitBtn');
  btn.disabled = !faceImageData;
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
  if (!faceImageData) return;

  goToStep(2);

  const analysisAnimation = animateAnalysis();

  try {
    const age = document.getElementById('ageInput').value || null;

    const body = {
      image: faceImageData.base64,
      mimeType: faceImageData.mimeType
    };

    if (bodyImageData) {
      body.bodyImage = bodyImageData.base64;
      body.bodyMimeType = bodyImageData.mimeType;
    }

    if (age) body.age = parseInt(age);

    const response = await fetch(DEMO_API_BASE + '/api/demo/diagnose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
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
  if (bodyImageData && diagnosis.bodyType) {
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
  faceImageData = null;
  bodyImageData = null;

  document.getElementById('faceInput').value = '';
  document.getElementById('bodyInput').value = '';
  document.getElementById('facePreview').src = '';
  document.getElementById('bodyPreview').src = '';
  document.getElementById('faceUploadZone').classList.remove('has-image');
  document.getElementById('bodyUploadZone').classList.remove('has-image');
  document.getElementById('ageInput').value = '';
  document.getElementById('progressBar').style.width = '0%';

  document.querySelectorAll('.analyzing-step').forEach(el => {
    el.classList.remove('active', 'done');
  });
  document.getElementById('aStep1').classList.add('active');

  updateSubmitButton();
  goToStep(1);
}
