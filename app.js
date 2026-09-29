/**
 * StitchGrid Studio - Core Engine
 * High-performance canvas-based scanned cross-stitch chart to normalized pixel art converter.
 */

(function () {
  'use strict';

  // --- DOM Elements ---
  const fileInput = document.getElementById('fileInput');
  const dropzone = document.getElementById('dropzone');
  const emptyState = document.getElementById('emptyState');
  const btnEmptyBrowse = document.getElementById('btnEmptyBrowse');
  const btnEmptySample = document.getElementById('btnEmptySample');
  const btnLoadSample = document.getElementById('btnLoadSample');
  const imageInfoBar = document.getElementById('imageInfoBar');
  const imageNameBadge = document.getElementById('imageNameBadge');
  const imageDimBadge = document.getElementById('imageDimBadge');

  // Calibration Elements
  const btnStartCalibrate = document.getElementById('btnStartCalibrate');
  const btnStartCalibrateText = document.getElementById('btnStartCalibrateText');
  const btnResetCalibrate = document.getElementById('btnResetCalibrate');
  const calibStatusBadge = document.getElementById('calibStatusBadge');
  const calibrationBanner = document.getElementById('calibrationBanner');
  const calibrationPromptText = document.getElementById('calibrationPromptText');
  const inputCols = document.getElementById('inputCols');
  const inputRows = document.getElementById('inputRows');
  const cellWInput = document.getElementById('cellW');
  const cellHInput = document.getElementById('cellH');
  const offsetXInput = document.getElementById('offsetX');
  const offsetYInput = document.getElementById('offsetY');

  // Fine-Tuning Elements
  const btnShiftUp = document.getElementById('btnShiftUp');
  const btnShiftDown = document.getElementById('btnShiftDown');
  const btnShiftLeft = document.getElementById('btnShiftLeft');
  const btnShiftRight = document.getElementById('btnShiftRight');
  const btnZeroOffset = document.getElementById('btnZeroOffset');
  const btnScaleWMinus = document.getElementById('btnScaleWMinus');
  const btnScaleWPlus = document.getElementById('btnScaleWPlus');
  const btnScaleHMinus = document.getElementById('btnScaleHMinus');
  const btnScaleHPlus = document.getElementById('btnScaleHPlus');
  const stepSizeGroup = document.getElementById('stepSizeGroup');
  const chkMajorLines = document.getElementById('chkMajorLines');
  const colorDots = document.querySelectorAll('.color-dot');

  // Extraction & Clustering Elements
  const sampleRatioInput = document.getElementById('sampleRatio');
  const sampleRatioVal = document.getElementById('sampleRatioVal');
  const darkDiscardInput = document.getElementById('darkDiscardRatio');
  const darkDiscardVal = document.getElementById('darkDiscardVal');
  const colorToleranceInput = document.getElementById('colorTolerance');
  const colorToleranceVal = document.getElementById('colorToleranceVal');
  const btnProcessGrid = document.getElementById('btnProcessGrid');
  const progressContainer = document.getElementById('progressContainer');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');

  // Palette & Tools Elements
  const panelPalette = document.getElementById('panelPalette');
  const panelExport = document.getElementById('panelExport');
  const clusterCountBadge = document.getElementById('clusterCountBadge');
  const clusterList = document.getElementById('clusterList');
  const btnAutoBackground = document.getElementById('btnAutoBackground');
  const toolPointer = document.getElementById('toolPointer');
  const toolBrush = document.getElementById('toolBrush');
  const toolEraser = document.getElementById('toolEraser');

  // Export Elements
  const exportScaleSelect = document.getElementById('exportScale');
  const chkExportGrid = document.getElementById('chkExportGrid');
  const chkTransparentBg = document.getElementById('chkTransparentBg');
  const btnExportPng = document.getElementById('btnExportPng');
  const btnCopyClipboard = document.getElementById('btnCopyClipboard');
  const btnExportJson = document.getElementById('btnExportJson');

  // Viewport & HUD Elements
  const viewport = document.getElementById('viewport');
  const canvasWrapper = document.getElementById('canvasWrapper');
  const canvas = document.getElementById('mainCanvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const viewModeGroup = document.getElementById('viewModeGroup');
  const btnZoomOut = document.getElementById('btnZoomOut');
  const btnZoomIn = document.getElementById('btnZoomIn');
  const btnZoomFit = document.getElementById('btnZoomFit');
  const btnTogglePan = document.getElementById('btnTogglePan');
  const zoomLevelText = document.getElementById('zoomLevelText');
  const compareControl = document.getElementById('compareControl');
  const compareOpacity = document.getElementById('compareOpacity');
  const cellInspector = document.getElementById('cellInspector');
  const inspectorDot = document.getElementById('inspectorDot');
  const inspectorCoords = document.getElementById('inspectorCoords');
  const inspectorHex = document.getElementById('inspectorHex');

  // Loupe Elements
  const magnifierLoupe = document.getElementById('magnifierLoupe');
  const loupeCanvas = document.getElementById('loupeCanvas');
  const loupeCtx = loupeCanvas.getContext('2d');
  const loupeCoord = document.getElementById('loupeCoord');

  // Modal & Toast
  const shortcutsDialog = document.getElementById('shortcutsDialog');
  const btnHelp = document.getElementById('btnHelp');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const toastContainer = document.getElementById('toastContainer');

  // --- Application State ---
  const state = {
    img: null,
    rawPixelData: null,
    viewMode: 'grid', // 'grid' | 'pixelart' | 'compare'
    gridColor: 'rgba(255, 0, 85, 0.75)',
    tuningStep: 0.25,

    // Calibration
    isCalibrating: false,
    calibStep: 0, // 0 = idle, 1 = wait for top-left, 2 = wait for bottom-right
    point1: { x: 67, y: 88 },
    point2: { x: 832, y: 770 },
    draggingPin: null, // 1 | 2 | null

    // Transform (Zoom & Pan)
    zoom: 1.0,
    panX: 0,
    panY: 0,
    isPanningMode: false,
    isDraggingPan: false,
    panStart: { x: 0, y: 0, panX: 0, panY: 0 },

    // Grid Matrix Data
    cols: 70,
    rows: 60,
    cellW: 11.35,
    cellH: 11.35,
    offsetX: 67.0,
    offsetY: 88.0,
    gridMatrix: [], // [r][c] = { clusterId, originalRgb, assignedHex, erased }
    clusters: [],   // [ { id, count, avgRgb, currentHex, isEmpty } ]
    highlightClusterId: null,

    // Canvas tools
    activeTool: 'pointer', // 'pointer' | 'brush' | 'eraser'
    selectedClusterId: null,
    isPainting: false,
    history: []
  };

  // --- Initialization ---
  function init() {
    setupEventListeners();
    setupDropzone();
    updateUIInputsFromState();
  }

  // --- Dropzone & File Loading ---
  function setupDropzone() {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      viewport.addEventListener(eventName, preventDefaults, false);
      dropzone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
      e.preventDefault();
      e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, () => dropzone.classList.add('dragover'), false);
      viewport.addEventListener(eventName, () => dropzone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, () => dropzone.classList.remove('dragover'), false);
      viewport.addEventListener(eventName, () => dropzone.classList.remove('dragover'), false);
    });

    viewport.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files && files.length > 0) handleFile(files[0]);
    });

    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files && files.length > 0) handleFile(files[0]);
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
    });

    btnEmptyBrowse.addEventListener('click', () => fileInput.click());
    btnEmptySample.addEventListener('click', loadSampleImage);
    btnLoadSample.addEventListener('click', loadSampleImage);

    // Clipboard paste support
    window.addEventListener('paste', (e) => {
      const items = (e.clipboardData || e.originalEvent.clipboardData).items;
      for (const item of items) {
        if (item.type.indexOf('image') === 0) {
          const blob = item.getAsFile();
          handleFile(blob, 'pasted_image.png');
          break;
        }
      }
    });
  }

  function handleFile(file, customName) {
    if (!file.type.match('image.*')) {
      showToast('Selected file is not an image.', 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      loadImageSource(e.target.result, customName || file.name);
    };
    reader.readAsDataURL(file);
  }

  function loadSampleImage() {
    loadImageSource('sample_chart.jpg', 'Vintage_Floral_Sampler_Demo.jpg', true);
  }

  function loadImageSource(src, filename, isSample = false) {
    const newImg = new Image();
    newImg.crossOrigin = 'anonymous';
    newImg.onload = () => {
      state.img = newImg;
      canvas.width = newImg.width;
      canvas.height = newImg.height;

      // Extract raw pixel data for fast analysis
      const offCanvas = document.createElement('canvas');
      offCanvas.width = newImg.width;
      offCanvas.height = newImg.height;
      const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
      offCtx.drawImage(newImg, 0, 0);
      state.rawPixelData = offCtx.getImageData(0, 0, newImg.width, newImg.height).data;

      // Reset calibration / grid parameters if needed
      emptyState.style.display = 'none';
      imageInfoBar.style.display = 'flex';
      imageNameBadge.textContent = filename || 'chart.jpg';
      imageDimBadge.textContent = `${newImg.width} × ${newImg.height} px`;

      if (isSample) {
        // High accuracy presets matching the floral sampler demo
        state.cols = 70;
        state.rows = 61;
        state.point1 = { x: 67.2, y: 88.0 };
        state.point2 = { x: 832.0, y: 752.0 };
        state.offsetX = state.point1.x;
        state.offsetY = state.point1.y;
        state.cellW = (state.point2.x - state.point1.x) / state.cols;
        state.cellH = (state.point2.y - state.point1.y) / state.rows;
      } else {
        // Sensible defaults based on image size
        state.cols = parseInt(inputCols.value) || 70;
        state.rows = parseInt(inputRows.value) || 60;
        state.offsetX = Math.round(newImg.width * 0.05);
        state.offsetY = Math.round(newImg.height * 0.05);
        const spanW = newImg.width * 0.9;
        const spanH = newImg.height * 0.9;
        state.cellW = +(spanW / state.cols).toFixed(2);
        state.cellH = +(spanH / state.rows).toFixed(2);
        state.point1 = { x: state.offsetX, y: state.offsetY };
        state.point2 = { x: state.offsetX + spanW, y: state.offsetY + spanH };
      }

      updateUIInputsFromState();
      switchViewMode('grid');
      fitCanvasToViewport();
      render();
      showToast('Image loaded successfully!', 'success');
    };
    newImg.onerror = () => {
      showToast('Failed to load image file.', 'danger');
    };
    newImg.src = src;
  }

  // --- UI Sync Helpers ---
  function updateUIInputsFromState() {
    inputCols.value = state.cols;
    inputRows.value = state.rows;
    cellWInput.value = state.cellW.toFixed(2);
    cellHInput.value = state.cellH.toFixed(2);
    offsetXInput.value = state.offsetX.toFixed(2);
    offsetYInput.value = state.offsetY.toFixed(2);
  }

  function readStateFromInputs() {
    state.cols = Math.max(1, parseInt(inputCols.value) || 1);
    state.rows = Math.max(1, parseInt(inputRows.value) || 1);
    state.cellW = Math.max(0.1, parseFloat(cellWInput.value) || 1);
    state.cellH = Math.max(0.1, parseFloat(cellHInput.value) || 1);
    state.offsetX = parseFloat(offsetXInput.value) || 0;
    state.offsetY = parseFloat(offsetYInput.value) || 0;
  }

  // --- 2-Point Calibration Engine ---
  function startCalibration() {
    if (!state.img) {
      showToast('Please load an image first.', 'warning');
      return;
    }
    state.isCalibrating = true;
    state.calibStep = 1;
    switchViewMode('grid');
    updateCalibrationBanner();
  }

  function cancelCalibration() {
    state.isCalibrating = false;
    state.calibStep = 0;
    magnifierLoupe.style.display = 'none';
    updateCalibrationBanner();
    render();
  }

  function updateCalibrationBanner() {
    if (state.calibStep === 1) {
      calibStatusBadge.textContent = 'Step 1/2: Top-Left';
      calibStatusBadge.className = 'badge status-pill waiting';
      calibrationBanner.classList.add('calibrating');
      calibrationPromptText.innerHTML = `<strong>Step 1:</strong> Click the <strong>top-left grid intersection (0, 0)</strong> on the scanned chart.`;
      btnStartCalibrateText.textContent = 'Cancel';
      canvasWrapper.style.cursor = 'none'; // Use loupe
    } else if (state.calibStep === 2) {
      calibStatusBadge.textContent = 'Step 2/2: Bottom-Right';
      calibStatusBadge.className = 'badge status-pill waiting';
      calibrationBanner.classList.add('calibrating');
      calibrationPromptText.innerHTML = `<strong>Step 2:</strong> Now click the <strong>bottom-right intersection (Col: ${state.cols}, Row: ${state.rows})</strong>.`;
      btnStartCalibrateText.textContent = 'Cancel';
      canvasWrapper.style.cursor = 'none';
    } else {
      calibStatusBadge.textContent = 'Calibrated';
      calibStatusBadge.className = 'badge status-pill';
      calibrationBanner.classList.remove('calibrating');
      calibrationPromptText.innerHTML = `Click <strong>"Calibrate (2 Points)"</strong> to align intersections, or fine-tune with arrow keys.`;
      btnStartCalibrateText.textContent = 'Calibrate (2 Points)';
      canvasWrapper.style.cursor = state.isPanningMode ? 'grab' : 'crosshair';
      magnifierLoupe.style.display = 'none';
    }
  }

  function apply2PointCalibration() {
    const x0 = Math.min(state.point1.x, state.point2.x);
    const y0 = Math.min(state.point1.y, state.point2.y);
    const x1 = Math.max(state.point1.x, state.point2.x);
    const y1 = Math.max(state.point1.y, state.point2.y);

    state.cols = Math.max(1, parseInt(inputCols.value) || 1);
    state.rows = Math.max(1, parseInt(inputRows.value) || 1);

    const spanX = x1 - x0;
    const spanY = y1 - y0;

    state.cellW = +(spanX / state.cols).toFixed(3);
    state.cellH = +(spanY / state.rows).toFixed(3);
    state.offsetX = +x0.toFixed(2);
    state.offsetY = +y0.toFixed(2);

    updateUIInputsFromState();
    state.isCalibrating = false;
    state.calibStep = 0;
    updateCalibrationBanner();
    render();
    showToast(`Calibrated! Cell size: ${state.cellW.toFixed(2)} × ${state.cellH.toFixed(2)} px`, 'success');
  }

  // --- Magnifier Loupe Rendering ---
  function updateLoupe(imgX, imgY, screenX, screenY) {
    if (!state.img || (!state.isCalibrating && !state.draggingPin)) {
      magnifierLoupe.style.display = 'none';
      return;
    }
    magnifierLoupe.style.display = 'block';
    
    // Position loupe offset from cursor
    const loupeSize = 140;
    const pad = 24;
    let lx = screenX + pad;
    let ly = screenY - loupeSize - pad;
    if (lx + loupeSize > window.innerWidth) lx = screenX - loupeSize - pad;
    if (ly < 60) ly = screenY + pad;

    magnifierLoupe.style.left = `${lx}px`;
    magnifierLoupe.style.top = `${ly}px`;

    // Render 5x zoomed view
    const zoomLevel = 5;
    const sWidth = loupeCanvas.width / zoomLevel;
    const sHeight = loupeCanvas.height / zoomLevel;
    const sx = imgX - sWidth / 2;
    const sy = imgY - sHeight / 2;

    loupeCtx.imageSmoothingEnabled = false;
    loupeCtx.clearRect(0, 0, loupeCanvas.width, loupeCanvas.height);

    if (state.img) {
      loupeCtx.drawImage(state.img, sx, sy, sWidth, sHeight, 0, 0, loupeCanvas.width, loupeCanvas.height);
    }

    loupeCoord.textContent = `X: ${Math.round(imgX)}, Y: ${Math.round(imgY)}`;
  }

  // --- Rendering Pipeline ---
  function render() {
    if (!state.img) return;

    // Apply viewport transform (pan & zoom)
    canvas.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.zoom})`;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (state.viewMode === 'grid') {
      renderAlignmentView();
    } else if (state.viewMode === 'pixelart') {
      renderPixelArtView();
    } else if (state.viewMode === 'compare') {
      renderCompareView();
    }

    // Always render hover cluster highlight if any
    renderClusterHighlight();
  }

  function renderAlignmentView() {
    // 1. Draw original scanned image
    ctx.drawImage(state.img, 0, 0);

    // 2. Draw Grid Lines
    const w = state.cellW;
    const h = state.cellH;
    const ox = state.offsetX;
    const oy = state.offsetY;
    const totalCols = state.cols;
    const totalRows = state.rows;
    const maxX = ox + totalCols * w;
    const maxY = oy + totalRows * h;

    ctx.lineWidth = 1;
    ctx.strokeStyle = state.gridColor;

    // Vertical lines
    for (let c = 0; c <= totalCols; c++) {
      const x = ox + c * w;
      const isMajor = chkMajorLines.checked && (c % 10 === 0);

      ctx.beginPath();
      ctx.lineWidth = isMajor ? 2.2 : 0.8;
      ctx.strokeStyle = isMajor ? '#ffffff' : state.gridColor;
      ctx.moveTo(x, oy);
      ctx.lineTo(x, maxY);
      ctx.stroke();
    }

    // Horizontal lines
    for (let r = 0; r <= totalRows; r++) {
      const y = oy + r * h;
      const isMajor = chkMajorLines.checked && (r % 10 === 0);

      ctx.beginPath();
      ctx.lineWidth = isMajor ? 2.2 : 0.8;
      ctx.strokeStyle = isMajor ? '#ffffff' : state.gridColor;
      ctx.moveTo(ox, y);
      ctx.lineTo(maxX, y);
      ctx.stroke();
    }

    // 3. Render Calibration Pins
    renderPin(state.point1.x, state.point1.y, '#10b981', '0,0');
    renderPin(state.point2.x, state.point2.y, '#ff0055', `${totalCols},${totalRows}`);
  }

  function renderPin(x, y, color, label) {
    if (x === null || y === null) return;
    const radius = 6;
    ctx.save();
    // Glowing outer ring
    ctx.beginPath();
    ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    ctx.stroke();

    // Solid inner dot
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Crosshair lines
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - 12, y); ctx.lineTo(x + 12, y);
    ctx.moveTo(x, y - 12); ctx.lineTo(x, y + 12);
    ctx.stroke();

    // Pin Label tag
    ctx.font = 'bold 11px JetBrains Mono, monospace';
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    const textW = ctx.measureText(label).width;
    ctx.fillRect(x + 10, y - 16, textW + 8, 16);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, x + 14, y - 4);
    ctx.restore();
  }

  function renderPixelArtView() {
    if (!state.gridMatrix || state.gridMatrix.length === 0) {
      renderAlignmentView();
      return;
    }

    const w = state.cellW;
    const h = state.cellH;
    const ox = state.offsetX;
    const oy = state.offsetY;

    for (let r = 0; r < state.rows; r++) {
      if (!state.gridMatrix[r]) continue;
      for (let c = 0; c < state.cols; c++) {
        const cell = state.gridMatrix[r][c];
        if (!cell || cell.erased) continue;

        ctx.fillStyle = cell.assignedHex;
        // Use Math.ceil or subpixel snapping to avoid gaps
        ctx.fillRect(
          Math.floor(ox + c * w),
          Math.floor(oy + r * h),
          Math.ceil(w),
          Math.ceil(h)
        );
      }
    }
  }

  function renderCompareView() {
    // 1. Draw Scanned Image base
    ctx.drawImage(state.img, 0, 0);

    // 2. Draw Pixel Art with Alpha blending
    const alpha = parseFloat(compareOpacity.value) / 100;
    ctx.save();
    ctx.globalAlpha = alpha;
    renderPixelArtView();
    ctx.restore();

    // 3. Grid line indicator
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 0.5;
    const w = state.cellW;
    const h = state.cellH;
    const ox = state.offsetX;
    const oy = state.offsetY;
    ctx.strokeRect(ox, oy, state.cols * w, state.rows * h);
  }

  function renderClusterHighlight() {
    if (state.highlightClusterId === null || !state.gridMatrix || state.gridMatrix.length === 0) return;

    const w = state.cellW;
    const h = state.cellH;
    const ox = state.offsetX;
    const oy = state.offsetY;

    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;

    for (let r = 0; r < state.rows; r++) {
      if (!state.gridMatrix[r]) continue;
      for (let c = 0; c < state.cols; c++) {
        const cell = state.gridMatrix[r][c];
        if (cell && cell.clusterId === state.highlightClusterId && !cell.erased) {
          const cx = ox + c * w;
          const cy = oy + r * h;
          ctx.fillRect(cx, cy, w, h);
          ctx.strokeRect(cx, cy, w, h);
        }
      }
    }
    ctx.restore();
  }

  // --- Color Extraction & Clustering Engine ---
  async function processGridColors() {
    if (!state.img || !state.rawPixelData) {
      showToast('No image loaded to process.', 'warning');
      return;
    }

    readStateFromInputs();

    progressContainer.style.display = 'block';
    progressBar.style.width = '0%';
    progressText.textContent = 'Sampling cells (Trimmed Mean)...';
    btnProcessGrid.disabled = true;

    const w = state.cellW;
    const h = state.cellH;
    const ox = state.offsetX;
    const oy = state.offsetY;
    const totalCols = state.cols;
    const totalRows = state.rows;
    const imgWidth = state.img.width;
    const imgHeight = state.img.height;
    const rawData = state.rawPixelData;

    // Config ratios
    const sampleFraction = parseInt(sampleRatioInput.value) / 100; // e.g. 0.60
    const marginFraction = (1.0 - sampleFraction) / 2.0;          // e.g. 0.20
    const darkDiscardFraction = parseInt(darkDiscardInput.value) / 100; // e.g. 0.30
    const tolerance = parseFloat(colorToleranceInput.value);      // e.g. 20

    state.gridMatrix = [];
    state.clusters = [];
    let clusterCounter = 0;

    const totalCells = totalCols * totalRows;
    let cellsDone = 0;

    const startTime = performance.now();

    // Async batching for ultra-smooth UI
    const batchSize = 10; // rows per frame
    for (let r = 0; r < totalRows; r += batchSize) {
      const endR = Math.min(r + batchSize, totalRows);

      for (let curR = r; curR < endR; curR++) {
        state.gridMatrix[curR] = [];

        for (let c = 0; c < totalCols; c++) {
          const startX = Math.floor(ox + c * w + w * marginFraction);
          const endX = Math.floor(ox + (c + 1) * w - w * marginFraction);
          const startY = Math.floor(oy + curR * h + h * marginFraction);
          const endY = Math.floor(oy + (curR + 1) * h - h * marginFraction);

          const samples = [];
          for (let py = startY; py < endY; py++) {
            if (py < 0 || py >= imgHeight) continue;
            for (let px = startX; px < endX; px++) {
              if (px < 0 || px >= imgWidth) continue;
              const idx = (py * imgWidth + px) * 4;
              const red = rawData[idx];
              const green = rawData[idx + 1];
              const blue = rawData[idx + 2];
              // Rec. 601 Luma
              const brightness = 0.299 * red + 0.587 * green + 0.114 * blue;
              samples.push({ r: red, g: green, b: blue, br: brightness });
            }
          }

          if (samples.length === 0) {
            state.gridMatrix[curR][c] = { clusterId: null, assignedHex: '#000000', erased: true };
            continue;
          }

          // Discard darkest 30% pixels to remove black stitch symbols and border artifacts
          samples.sort((a, b) => b.br - a.br); // brightest first
          const keepCount = Math.max(1, Math.floor(samples.length * (1.0 - darkDiscardFraction)));
          const cleanSlice = samples.slice(0, keepCount);

          // Trimmed Mean RGB
          let sumR = 0, sumG = 0, sumB = 0;
          for (let i = 0; i < cleanSlice.length; i++) {
            sumR += cleanSlice[i].r;
            sumG += cleanSlice[i].g;
            sumB += cleanSlice[i].b;
          }
          const avgR = Math.round(sumR / cleanSlice.length);
          const avgG = Math.round(sumG / cleanSlice.length);
          const avgB = Math.round(sumB / cleanSlice.length);

          // Group into cluster within Euclidean RGB distance <= tolerance
          let matched = null;
          let minDistance = Infinity;

          for (let cl of state.clusters) {
            const dist = Math.hypot(avgR - cl.avgRgb.r, avgG - cl.avgRgb.g, avgB - cl.avgRgb.b);
            if (dist <= tolerance && dist < minDistance) {
              minDistance = dist;
              matched = cl;
            }
          }

          if (!matched) {
            clusterCounter++;
            const hex = rgbToHex(avgR, avgG, avgB);
            matched = {
              id: clusterCounter,
              count: 0,
              avgRgb: { r: avgR, g: avgG, b: avgB },
              currentHex: hex,
              isEmpty: false
            };
            state.clusters.push(matched);
          }

          matched.count++;
          // Running average refinement
          matched.avgRgb.r = Math.round((matched.avgRgb.r * (matched.count - 1) + avgR) / matched.count);
          matched.avgRgb.g = Math.round((matched.avgRgb.g * (matched.count - 1) + avgG) / matched.count);
          matched.avgRgb.b = Math.round((matched.avgRgb.b * (matched.count - 1) + avgB) / matched.count);

          state.gridMatrix[curR][c] = {
            clusterId: matched.id,
            assignedHex: matched.currentHex,
            erased: false
          };
          cellsDone++;
        }
      }

      // Update progress bar
      const progress = Math.round((cellsDone / totalCells) * 100);
      progressBar.style.width = `${progress}%`;
      progressText.textContent = `Processing cell ${cellsDone}/${totalCells} (${progress}%)`;
      await new Promise(r => requestAnimationFrame(r));
    }

    // Sort clusters by frequency descending
    state.clusters.sort((a, b) => b.count - a.count);

    // Populate UI
    populatePaletteUI();
    panelPalette.style.display = 'block';
    panelExport.style.display = 'block';

    const elapsed = Math.round(performance.now() - startTime);
    progressBar.style.width = '100%';
    progressText.textContent = `Completed in ${elapsed}ms (${state.clusters.length} colors found)`;
    setTimeout(() => {
      progressContainer.style.display = 'none';
      btnProcessGrid.disabled = false;
    }, 1200);

    // Switch to Pixel Art view
    switchViewMode('pixelart');
    showToast(`Matrix generated! ${state.clusters.length} distinct colors clustered.`, 'success');
  }

  // --- Palette Remap UI & Interactions ---
  function populatePaletteUI() {
    clusterList.innerHTML = '';
    clusterCountBadge.textContent = `${state.clusters.length} Colors`;
    const totalCells = state.cols * state.rows;

    state.clusters.forEach((cl, index) => {
      const pct = ((cl.count / totalCells) * 100).toFixed(1);

      const item = document.createElement('div');
      item.className = `cluster-item ${cl.isEmpty ? 'is-empty' : ''}`;
      item.dataset.clusterId = cl.id;

      // Color swatch + native color picker
      const left = document.createElement('div');
      left.className = 'cluster-left';

      const swatchBox = document.createElement('div');
      swatchBox.className = 'color-swatch-box';
      swatchBox.style.backgroundColor = cl.currentHex;

      const colorInput = document.createElement('input');
      colorInput.type = 'color';
      colorInput.className = 'color-picker-native';
      colorInput.value = cl.currentHex;
      colorInput.title = 'Click to assign clean replacement color';

      colorInput.addEventListener('input', (e) => {
        const newHex = e.target.value;
        cl.currentHex = newHex;
        swatchBox.style.backgroundColor = newHex;
        hexText.textContent = newHex.toUpperCase();
        // Propagate across matrix
        for (let r = 0; r < state.rows; r++) {
          for (let c = 0; c < state.cols; c++) {
            if (state.gridMatrix[r] && state.gridMatrix[r][c]?.clusterId === cl.id) {
              state.gridMatrix[r][c].assignedHex = newHex;
            }
          }
        }
        render();
      });

      swatchBox.appendChild(colorInput);

      const meta = document.createElement('div');
      meta.className = 'cluster-meta';

      const hexText = document.createElement('span');
      hexText.className = 'cluster-hex';
      hexText.textContent = cl.currentHex.toUpperCase();

      const statsText = document.createElement('span');
      statsText.className = 'cluster-stats';
      statsText.textContent = `#${index + 1} • ${cl.count} cells (${pct}%)`;

      meta.appendChild(hexText);
      meta.appendChild(statsText);

      left.appendChild(swatchBox);
      left.appendChild(meta);

      // Actions: Mark as Empty / Background
      const actions = document.createElement('div');
      actions.className = 'cluster-actions';

      const btnToggleEmpty = document.createElement('button');
      btnToggleEmpty.type = 'button';
      btnToggleEmpty.className = `btn-icon-subtle ${cl.isEmpty ? 'active' : ''}`;
      btnToggleEmpty.title = cl.isEmpty ? 'Restore cells (Unmark Empty)' : 'Mark as Empty / Canvas Background';
      btnToggleEmpty.innerHTML = cl.isEmpty
        ? '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
        : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';

      btnToggleEmpty.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleClusterEmpty(cl.id);
      });

      actions.appendChild(btnToggleEmpty);

      item.appendChild(left);
      item.appendChild(actions);

      // Swatch hover highlights matching cells on canvas
      item.addEventListener('mouseenter', () => {
        state.highlightClusterId = cl.id;
        render();
      });
      item.addEventListener('mouseleave', () => {
        state.highlightClusterId = null;
        render();
      });

      // Swatch click selects this cluster as active drawing color
      item.addEventListener('click', () => {
        state.selectedClusterId = cl.id;
        document.querySelectorAll('.cluster-item').forEach(el => el.classList.remove('highlighted'));
        item.classList.add('highlighted');
        setDrawingTool('brush');
      });

      clusterList.appendChild(item);
    });
  }

  function toggleClusterEmpty(clusterId) {
    const cl = state.clusters.find(c => c.id === clusterId);
    if (!cl) return;
    cl.isEmpty = !cl.isEmpty;

    for (let r = 0; r < state.rows; r++) {
      if (!state.gridMatrix[r]) continue;
      for (let c = 0; c < state.cols; c++) {
        if (state.gridMatrix[r][c]?.clusterId === clusterId) {
          state.gridMatrix[r][c].erased = cl.isEmpty;
        }
      }
    }
    populatePaletteUI();
    render();
    showToast(cl.isEmpty ? 'Cluster marked as canvas background.' : 'Cluster restored.', 'success');
  }

  function autoDetectBackground() {
    if (!state.clusters || state.clusters.length === 0) return;
    // Mark the most frequent cluster as background
    const largest = state.clusters[0];
    if (largest) {
      largest.isEmpty = true;
      toggleClusterEmpty(largest.id);
    }
  }

  // --- Export Engine ---
  function exportPixelMatrixPng() {
    if (!state.gridMatrix || state.gridMatrix.length === 0) {
      showToast('Please process the grid before exporting.', 'warning');
      return;
    }

    const scale = parseInt(exportScaleSelect.value) || 1;
    const includeGrid = chkExportGrid.checked;
    const transparentBg = chkTransparentBg.checked;

    const outCols = state.cols;
    const outRows = state.rows;
    const outW = outCols * scale;
    const outH = outRows * scale;

    const expCanvas = document.createElement('canvas');
    expCanvas.width = outW;
    expCanvas.height = outH;
    const expCtx = expCanvas.getContext('2d');

    // Solid background if transparency is unchecked
    if (!transparentBg) {
      expCtx.fillStyle = '#ffffff';
      expCtx.fillRect(0, 0, outW, outH);
    }

    // Render cells
    for (let r = 0; r < outRows; r++) {
      if (!state.gridMatrix[r]) continue;
      for (let c = 0; c < outCols; c++) {
        const cell = state.gridMatrix[r][c];
        if (!cell || cell.erased) continue;
        expCtx.fillStyle = cell.assignedHex;
        expCtx.fillRect(c * scale, r * scale, scale, scale);
      }
    }

    // Optional Grid lines
    if (includeGrid && scale >= 3) {
      expCtx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
      expCtx.lineWidth = 1;
      for (let c = 0; c <= outCols; c++) {
        expCtx.beginPath();
        expCtx.moveTo(c * scale, 0);
        expCtx.lineTo(c * scale, outH);
        expCtx.stroke();
      }
      for (let r = 0; r <= outRows; r++) {
        expCtx.beginPath();
        expCtx.moveTo(0, r * scale);
        expCtx.lineTo(outW, r * scale);
        expCtx.stroke();
      }
    }

    // Download PNG
    const link = document.createElement('a');
    link.download = `stitch_matrix_${outCols}x${outRows}_${scale}x.png`;
    link.href = expCanvas.toDataURL('image/png');
    link.click();

    showToast(`Exported PNG (${outW} × ${outH} px)!`, 'success');
  }

  async function copyPngToClipboard() {
    if (!state.gridMatrix || state.gridMatrix.length === 0) {
      showToast('Please process grid first.', 'warning');
      return;
    }
    const scale = parseInt(exportScaleSelect.value) || 1;
    const expCanvas = document.createElement('canvas');
    expCanvas.width = state.cols * scale;
    expCanvas.height = state.rows * scale;
    const expCtx = expCanvas.getContext('2d');

    if (!chkTransparentBg.checked) {
      expCtx.fillStyle = '#ffffff';
      expCtx.fillRect(0, 0, expCanvas.width, expCanvas.height);
    }

    for (let r = 0; r < state.rows; r++) {
      if (!state.gridMatrix[r]) continue;
      for (let c = 0; c < state.cols; c++) {
        const cell = state.gridMatrix[r][c];
        if (!cell || cell.erased) continue;
        expCtx.fillStyle = cell.assignedHex;
        expCtx.fillRect(c * scale, r * scale, scale, scale);
      }
    }

    try {
      expCanvas.toBlob(async (blob) => {
        if (!blob) return;
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        showToast('Image copied to clipboard!', 'success');
      });
    } catch (err) {
      showToast('Failed to copy to clipboard.', 'danger');
    }
  }

  function exportMatrixJson() {
    if (!state.gridMatrix || state.gridMatrix.length === 0) {
      showToast('Please process grid first.', 'warning');
      return;
    }

    const exportData = {
      app: 'StitchGrid Studio',
      dimensions: { cols: state.cols, rows: state.rows },
      clusters: state.clusters.map(c => ({
        id: c.id,
        hex: c.currentHex,
        rgb: c.avgRgb,
        count: c.count,
        isEmpty: c.isEmpty
      })),
      matrix: state.gridMatrix.map(row =>
        row.map(cell => (cell.erased ? null : { clusterId: cell.clusterId, hex: cell.assignedHex }))
      )
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = `stitch_matrix_${state.cols}x${state.rows}.json`;
    link.href = URL.createObjectURL(blob);
    link.click();
    showToast('JSON metadata exported!', 'success');
  }

  // --- Zoom & Pan Viewport Helpers ---
  function fitCanvasToViewport() {
    if (!state.img) return;
    const pad = 40;
    const vW = viewport.clientWidth - pad * 2;
    const vH = viewport.clientHeight - pad * 2;
    const scale = Math.min(vW / state.img.width, vH / state.img.height, 1.0);
    state.zoom = +scale.toFixed(2);
    state.panX = Math.round((viewport.clientWidth - state.img.width * state.zoom) / 2);
    state.panY = Math.round((viewport.clientHeight - state.img.height * state.zoom) / 2);
    zoomLevelText.textContent = `${Math.round(state.zoom * 100)}%`;
    render();
  }

  function setZoom(factor, centerX, centerY) {
    if (!state.img) return;
    const prevZoom = state.zoom;
    const nextZoom = Math.min(Math.max(factor, 0.1), 10.0);

    const rect = viewport.getBoundingClientRect();
    const cx = centerX !== undefined ? centerX - rect.left : viewport.clientWidth / 2;
    const cy = centerY !== undefined ? centerY - rect.top : viewport.clientHeight / 2;

    state.panX = cx - (cx - state.panX) * (nextZoom / prevZoom);
    state.panY = cy - (cy - state.panY) * (nextZoom / prevZoom);
    state.zoom = nextZoom;

    zoomLevelText.textContent = `${Math.round(state.zoom * 100)}%`;
    render();
  }

  // --- Coordinate Mapping Helpers ---
  function screenToImageCoords(screenX, screenY) {
    const rect = canvasWrapper.getBoundingClientRect();
    const viewportX = screenX - rect.left;
    const viewportY = screenY - rect.top;
    const imgX = (viewportX - state.panX) / state.zoom;
    const imgY = (viewportY - state.panY) / state.zoom;
    return { x: imgX, y: imgY };
  }

  // --- Canvas Interaction & Painting ---
  function handleCanvasPointerDown(e) {
    if (!state.img) return;

    // Space key or middle click or Pan tool activates pan
    if (e.button === 1 || e.spaceKey || state.isPanningMode) {
      state.isDraggingPan = true;
      state.panStart = { x: e.clientX, y: e.clientY, panX: state.panX, panY: state.panY };
      canvasWrapper.classList.add('is-panning');
      return;
    }

    const { x, y } = screenToImageCoords(e.clientX, e.clientY);

    // 2-Point Calibration Click
    if (state.isCalibrating) {
      if (state.calibStep === 1) {
        state.point1 = { x: +x.toFixed(2), y: +y.toFixed(2) };
        state.calibStep = 2;
        updateCalibrationBanner();
        render();
        showToast('Top-left point recorded. Now click bottom-right.', 'success');
      } else if (state.calibStep === 2) {
        state.point2 = { x: +x.toFixed(2), y: +y.toFixed(2) };
        apply2PointCalibration();
      }
      return;
    }

    // Check if clicked near calibration pin for dragging
    const pinRadius = 14 / state.zoom;
    if (Math.hypot(x - state.point1.x, y - state.point1.y) <= pinRadius) {
      state.draggingPin = 1;
      return;
    }
    if (Math.hypot(x - state.point2.x, y - state.point2.y) <= pinRadius) {
      state.draggingPin = 2;
      return;
    }

    // Canvas tools in pixel art or compare view
    if (state.viewMode !== 'grid') {
      state.isPainting = true;
      applyToolAt(x, y);
    }
  }

  function handleCanvasPointerMove(e) {
    if (!state.img) return;

    if (state.isDraggingPan) {
      const dx = e.clientX - state.panStart.x;
      const dy = e.clientY - state.panStart.y;
      state.panX = state.panStart.panX + dx;
      state.panY = state.panStart.panY + dy;
      render();
      return;
    }

    const { x, y } = screenToImageCoords(e.clientX, e.clientY);

    // Pin dragging
    if (state.draggingPin === 1) {
      state.point1 = { x: +x.toFixed(2), y: +y.toFixed(2) };
      apply2PointCalibration();
      updateLoupe(x, y, e.clientX, e.clientY);
      return;
    }
    if (state.draggingPin === 2) {
      state.point2 = { x: +x.toFixed(2), y: +y.toFixed(2) };
      apply2PointCalibration();
      updateLoupe(x, y, e.clientX, e.clientY);
      return;
    }

    // Calibration Loupe
    if (state.isCalibrating) {
      updateLoupe(x, y, e.clientX, e.clientY);
    } else {
      magnifierLoupe.style.display = 'none';
    }

    // Painting / Erasing
    if (state.isPainting && state.viewMode !== 'grid') {
      applyToolAt(x, y);
    }

    // Cell Inspector update
    updateCellInspector(x, y);
  }

  function handleCanvasPointerUp() {
    state.isDraggingPan = false;
    state.isPainting = false;
    state.draggingPin = null;
    canvasWrapper.classList.remove('is-panning');
    magnifierLoupe.style.display = 'none';
  }

  function applyToolAt(imgX, imgY) {
    const w = state.cellW;
    const h = state.cellH;
    const ox = state.offsetX;
    const oy = state.offsetY;

    const c = Math.floor((imgX - ox) / w);
    const r = Math.floor((imgY - oy) / h);

    if (r < 0 || r >= state.rows || c < 0 || c >= state.cols) return;
    if (!state.gridMatrix[r]) return;

    const cell = state.gridMatrix[r][c];
    if (!cell) return;

    if (state.activeTool === 'eraser') {
      cell.erased = true;
      render();
    } else if (state.activeTool === 'brush' && state.selectedClusterId !== null) {
      const cl = state.clusters.find(k => k.id === state.selectedClusterId);
      if (cl) {
        cell.clusterId = cl.id;
        cell.assignedHex = cl.currentHex;
        cell.erased = false;
        render();
      }
    } else if (state.activeTool === 'pointer') {
      // Pick cluster on click
      if (cell.clusterId) {
        state.selectedClusterId = cell.clusterId;
        document.querySelectorAll('.cluster-item').forEach(el => {
          el.classList.toggle('highlighted', el.dataset.clusterId == cell.clusterId);
        });
      }
    }
  }

  function updateCellInspector(imgX, imgY) {
    const w = state.cellW;
    const h = state.cellH;
    const ox = state.offsetX;
    const oy = state.offsetY;

    const c = Math.floor((imgX - ox) / w);
    const r = Math.floor((imgY - oy) / h);

    if (r >= 0 && r < state.rows && c >= 0 && c < state.cols) {
      cellInspector.style.display = 'flex';
      inspectorCoords.textContent = `Col: ${c}, Row: ${r}`;

      if (state.gridMatrix[r] && state.gridMatrix[r][c] && !state.gridMatrix[r][c].erased) {
        const hex = state.gridMatrix[r][c].assignedHex;
        inspectorHex.textContent = hex;
        inspectorDot.style.backgroundColor = hex;
      } else {
        inspectorHex.textContent = 'Empty';
        inspectorDot.style.backgroundColor = 'transparent';
      }
    } else {
      cellInspector.style.display = 'none';
    }
  }

  // --- View Mode Switcher ---
  function switchViewMode(mode) {
    state.viewMode = mode;
    document.querySelectorAll('.seg-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    compareControl.style.display = mode === 'compare' ? 'flex' : 'none';
    render();
  }

  function setDrawingTool(tool) {
    state.activeTool = tool;
    toolPointer.classList.toggle('active', tool === 'pointer');
    toolBrush.classList.toggle('active', tool === 'brush');
    toolEraser.classList.toggle('active', tool === 'eraser');
  }

  // --- Keyboard Shortcuts & Event Listeners ---
  function setupEventListeners() {
    // Mode Switcher
    viewModeGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('.seg-btn');
      if (btn && btn.dataset.mode) switchViewMode(btn.dataset.mode);
    });

    // Calibration Buttons
    btnStartCalibrate.addEventListener('click', () => {
      if (state.isCalibrating) {
        cancelCalibration();
      } else {
        startCalibration();
      }
    });

    btnResetCalibrate.addEventListener('click', cancelCalibration);

    // Reactive input updates
    [inputCols, inputRows, cellWInput, cellHInput, offsetXInput, offsetYInput].forEach(inp => {
      inp.addEventListener('input', () => {
        readStateFromInputs();
        render();
      });
    });

    // Fine-Tuning Step Size selector
    stepSizeGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('.seg-btn');
      if (btn && btn.dataset.step) {
        document.querySelectorAll('#stepSizeGroup .seg-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.tuningStep = parseFloat(btn.dataset.step);
      }
    });

    // D-Pad Offset buttons
    btnShiftUp.addEventListener('click', () => adjustOffset(0, -state.tuningStep));
    btnShiftDown.addEventListener('click', () => adjustOffset(0, state.tuningStep));
    btnShiftLeft.addEventListener('click', () => adjustOffset(-state.tuningStep, 0));
    btnShiftRight.addEventListener('click', () => adjustOffset(state.tuningStep, 0));
    btnZeroOffset.addEventListener('click', () => {
      state.offsetX = 0;
      state.offsetY = 0;
      updateUIInputsFromState();
      render();
    });

    // Micro Scaling buttons
    const scaleFactor = 0.05;
    btnScaleWMinus.addEventListener('click', () => adjustCellSize(-scaleFactor, 0));
    btnScaleWPlus.addEventListener('click', () => adjustCellSize(scaleFactor, 0));
    btnScaleHMinus.addEventListener('click', () => adjustCellSize(0, -scaleFactor));
    btnScaleHPlus.addEventListener('click', () => adjustCellSize(0, scaleFactor));

    // Overlay line color dots
    colorDots.forEach(dot => {
      dot.addEventListener('click', () => {
        colorDots.forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        state.gridColor = dot.dataset.color;
        render();
      });
    });

    chkMajorLines.addEventListener('change', render);

    // Extraction Sliders
    sampleRatioInput.addEventListener('input', (e) => {
      sampleRatioVal.textContent = `Middle ${e.target.value}%`;
    });
    darkDiscardInput.addEventListener('input', (e) => {
      darkDiscardVal.textContent = `${e.target.value}%`;
    });
    colorToleranceInput.addEventListener('input', (e) => {
      colorToleranceVal.textContent = `≤ ${e.target.value}`;
    });

    // Process Grid Button
    btnProcessGrid.addEventListener('click', processGridColors);

    // Palette Tools
    toolPointer.addEventListener('click', () => setDrawingTool('pointer'));
    toolBrush.addEventListener('click', () => setDrawingTool('brush'));
    toolEraser.addEventListener('click', () => setDrawingTool('eraser'));
    btnAutoBackground.addEventListener('click', autoDetectBackground);

    // Export Buttons
    btnExportPng.addEventListener('click', exportPixelMatrixPng);
    btnCopyClipboard.addEventListener('click', copyPngToClipboard);
    btnExportJson.addEventListener('click', exportMatrixJson);

    // Canvas Pointer events
    canvasWrapper.addEventListener('mousedown', handleCanvasPointerDown);
    window.addEventListener('mousemove', handleCanvasPointerMove);
    window.addEventListener('mouseup', handleCanvasPointerUp);

    // Zoom & Pan Wheel handler
    canvasWrapper.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? state.zoom * 1.15 : state.zoom / 1.15;
      setZoom(zoomFactor, e.clientX, e.clientY);
    }, { passive: false });

    btnZoomIn.addEventListener('click', () => setZoom(state.zoom * 1.25));
    btnZoomOut.addEventListener('click', () => setZoom(state.zoom / 1.25));
    btnZoomFit.addEventListener('click', fitCanvasToViewport);
    btnTogglePan.addEventListener('click', () => {
      state.isPanningMode = !state.isPanningMode;
      btnTogglePan.classList.toggle('active', state.isPanningMode);
      canvasWrapper.style.cursor = state.isPanningMode ? 'grab' : 'crosshair';
    });

    compareOpacity.addEventListener('input', render);

    // Keyboard Shortcuts
    window.addEventListener('keydown', handleKeyNavigation);

    // Modal Help
    btnHelp.addEventListener('click', () => shortcutsDialog.showModal());
    btnCloseModal.addEventListener('click', () => shortcutsDialog.close());
    shortcutsDialog.addEventListener('click', (e) => {
      if (e.target === shortcutsDialog) shortcutsDialog.close();
    });
  }

  function adjustOffset(dx, dy) {
    state.offsetX = +(state.offsetX + dx).toFixed(2);
    state.offsetY = +(state.offsetY + dy).toFixed(2);
    updateUIInputsFromState();
    render();
  }

  function adjustCellSize(dw, dh) {
    state.cellW = Math.max(0.1, +(state.cellW + dw).toFixed(3));
    state.cellH = Math.max(0.1, +(state.cellH + dh).toFixed(3));
    updateUIInputsFromState();
    render();
  }

  function handleKeyNavigation(e) {
    // Skip if user is typing in a form input
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

    if (e.key === '?') {
      if (shortcutsDialog.open) shortcutsDialog.close();
      else shortcutsDialog.showModal();
      return;
    }

    if (e.key === '1') { switchViewMode('grid'); return; }
    if (e.key === '2') { switchViewMode('pixelart'); return; }
    if (e.key === '3') { switchViewMode('compare'); return; }

    if (!state.img) return;

    const isShift = e.shiftKey;
    const isAlt = e.altKey;
    let handled = false;

    if (isShift) {
      // Shift + Arrows for fine scaling
      const step = isAlt ? 0.01 : 0.05;
      if (e.key === 'ArrowLeft')  { adjustCellSize(-step, 0); handled = true; }
      if (e.key === 'ArrowRight') { adjustCellSize(step, 0);  handled = true; }
      if (e.key === 'ArrowUp')    { adjustCellSize(0, -step); handled = true; }
      if (e.key === 'ArrowDown')  { adjustCellSize(0, step);  handled = true; }
    } else {
      // Normal Arrows for Offset shifting
      const step = isAlt ? 0.05 : state.tuningStep;
      if (e.key === 'ArrowLeft')  { adjustOffset(-step, 0); handled = true; }
      if (e.key === 'ArrowRight') { adjustOffset(step, 0);  handled = true; }
      if (e.key === 'ArrowUp')    { adjustOffset(0, -step); handled = true; }
      if (e.key === 'ArrowDown')  { adjustOffset(0, step);  handled = true; }
    }

    if (handled) e.preventDefault();
  }

  // --- Utility Functions ---
  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => Math.min(255, Math.max(0, x)).toString(16).padStart(2, '0')).join('');
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
