const CHARSETS = {
  complex: '@#S%?*+;:,. ',
  simple:  '@#*+:. ',
  blocks:  '█▓▒░ · ',
  binary:  '10 ',
  braille: '⣿⣷⣶⣤⣀ '
};

let currentImage = null;
let renderTimer = null;
let cameraStream = null;
let currentTheme = 'cyan';

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const asciiOutput = document.getElementById('ascii-output');
const asciiContainer = document.getElementById('ascii-container');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const emptyState = document.getElementById('empty-state');
const processingCanvas = document.getElementById('processing-canvas');
const ctx = processingCanvas.getContext('2d', { willReadFrequently: true });

dropZone.addEventListener('dragover', e => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) loadFile(file);
});
fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) loadFile(fileInput.files[0]);
});

function loadFile(file) {
  if (!file.type.match(/image\/(jpeg|png|webp)/)) {
    showToast('ERR: INVALID_FORMAT');
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      currentImage = img;
      render();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function updateLabel(el, labelId, suffix) {
  document.getElementById(labelId).textContent = el.value + suffix;
}

function scheduleRender() {
  clearTimeout(renderTimer);
  if (!currentImage) return;
  renderTimer = setTimeout(render, 50);
}

function render() {
  if (!currentImage) return;

  const charsetKey = document.getElementById('charset-select').value;
  const fontSize = parseInt(document.getElementById('font-size').value);
  const outWidth = parseInt(document.getElementById('out-width').value);
  const brightness = parseFloat(document.getElementById('brightness').value) / 100;
  const contrast = parseFloat(document.getElementById('contrast').value) / 100;
  const invert = document.getElementById('invert-toggle').checked;
  const chars = CHARSETS[charsetKey];

  const aspectRatio = currentImage.height / currentImage.width;
  const outHeight = Math.round(outWidth * aspectRatio * 0.45);

  processingCanvas.width = outWidth;
  processingCanvas.height = outHeight;
  ctx.clearRect(0, 0, outWidth, outHeight);
  ctx.drawImage(currentImage, 0, 0, outWidth, outHeight);

  const imgData = ctx.getImageData(0, 0, outWidth, outHeight);
  const data = imgData.data;

  let ascii = '';
  for (let y = 0; y < outHeight; y++) {
    for (let x = 0; x < outWidth; x++) {
      const idx = (y * outWidth + x) * 4;
      let r = data[idx], g = data[idx+1], b = data[idx+2];
      let gray = 0.299 * r + 0.587 * g + 0.114 * b;
      gray = (gray * brightness - 128) * contrast + 128;
      gray = Math.max(0, Math.min(255, gray));
      if (invert) gray = 255 - gray;
      const charIndex = Math.floor((gray / 255) * (chars.length - 1));
      ascii += chars[chars.length - 1 - charIndex];
    }
    ascii += '\n';
  }

  asciiOutput.textContent = ascii;
  asciiOutput.style.fontSize = fontSize + 'px';
  emptyState.style.display = 'none';
  setStatus(`RESOLUTION: ${outWidth}x${outHeight} | FONT: ${fontSize}px`, true);
}

function setStatus(msg, active) {
  statusText.textContent = msg;
  statusDot.classList.toggle('active', !!active);
}

function applyPreset(name) {
  document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  asciiOutput.className = '';
  const presets = {
    terminal: { brightness: 110, contrast: 120, invert: false, charset: 'simple', theme: 'terminal' },
    matrix:   { brightness: 100, contrast: 150, invert: false, charset: 'binary', theme: 'matrix' },
    contrast: { brightness: 100, contrast: 200, invert: false, charset: 'complex', theme: 'contrast' },
    purple:   { brightness: 100, contrast: 120, invert: true,  charset: 'blocks', theme: 'purple' },
  };
  const p = presets[name];
  if (!p) return;
  document.getElementById('brightness').value = p.brightness;
  document.getElementById('brightness-val').textContent = p.brightness + '%';
  document.getElementById('contrast').value = p.contrast;
  document.getElementById('contrast-val').textContent = p.contrast + '%';
  document.getElementById('invert-toggle').checked = p.invert;
  document.getElementById('charset-select').value = p.charset;
  asciiOutput.classList.add('theme-' + p.theme);
  currentTheme = p.theme;
  scheduleRender();
}

function toggleLightBg() {
  const on = document.getElementById('light-bg-toggle').checked;
  asciiContainer.classList.toggle('light-bg', on);
}

function copyToClipboard() {
  const text = asciiOutput.textContent;
  if (!text.trim()) { showToast('BUFFER_EMPTY'); return; }
  navigator.clipboard.writeText(text)
    .then(() => showToast('TEXT_BUFFER_COPIED'))
    .catch(() => showToast('ERR: ACCESS_DENIED'));
}

function downloadTxt() {
  const text = asciiOutput.textContent;
  if (!text.trim()) { showToast('BUFFER_EMPTY'); return; }
  const blob = new Blob([text], { type: 'text/plain' });
  triggerDownload(URL.createObjectURL(blob), 'pixelglyph.txt');
  showToast('DATA_EXPORT_SUCCESS');
}

function downloadPng() {
  const text = asciiOutput.textContent;
  if (!text.trim()) { showToast('BUFFER_EMPTY'); return; }
  const fontSize = parseInt(document.getElementById('font-size').value);
  const lines = text.split('\n');
  const lineHeight = fontSize * 1.1;
  const charWidth = fontSize * 0.6;
  const maxLen = Math.max(...lines.map(l => l.length));
  const W = Math.ceil(maxLen * charWidth) + 40;
  const H = Math.ceil(lines.length * lineHeight) + 40;
  const c = document.getElementById('export-canvas');
  c.width = W; c.height = H;
  const ectx = c.getContext('2d');
  const lightBg = document.getElementById('light-bg-toggle').checked;
  ectx.fillStyle = lightBg ? '#f0f0f0' : '#080b10';
  ectx.fillRect(0, 0, W, H);
  const themeColors = { cyan: '#00ffe7', matrix: '#00ff41', contrast: '#ffffff', terminal: '#ffb700', purple: '#b400ff' };
  ectx.fillStyle = lightBg ? '#111' : (themeColors[currentTheme] || '#00ffe7');
  ectx.font = `${fontSize}px 'Share Tech Mono', monospace`;
  ectx.textBaseline = 'top';
  lines.forEach((line, i) => ectx.fillText(line, 20, 20 + i * lineHeight));
  c.toBlob(blob => {
    triggerDownload(URL.createObjectURL(blob), 'pixelglyph.png');
    showToast('IMAGE_RENDER_SUCCESS');
  });
}

function triggerDownload(url, filename) {
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function openCamera() {
  document.getElementById('camera-modal').classList.add('open');
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      cameraStream = stream;
      document.getElementById('camera-video').srcObject = stream;
    })
    .catch(() => {
      showToast('ERR: CAM_DENIED');
      closeCamera();
    });
}

function closeCamera() {
  if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
  document.getElementById('camera-video').srcObject = null;
  document.getElementById('camera-modal').classList.remove('open');
}

function captureCamera() {
  const video = document.getElementById('camera-video');
  const cap = document.createElement('canvas');
  cap.width = video.videoWidth; cap.height = video.videoHeight;
  const ctx_c = cap.getContext('2d');
  ctx_c.translate(cap.width, 0);
  ctx_c.scale(-1, 1);
  ctx_c.drawImage(video, 0, 0);
  const img = new Image();
  img.onload = () => { currentImage = img; closeCamera(); render(); };
  img.src = cap.toDataURL('image/png');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}