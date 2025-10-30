const canvas  = document.getElementById('game');
const context = canvas.getContext('2d');
const grid = 32;
const cols = 10;
const rows = 20;
let rAF = null;
let gameOver = false;
let paused   = false;

// Marcadores
let score = 0;
let lines = 0;
let level = 1;
let best  = loadBest();

// Velocidad (frames necesarios para que caiga una celda)
let dropFrames = 35;

// Bolsa aleatoria (7-bag)
const tetrominoSequence = [];

// Estado del tablero (incluye filas “negativas” invisibles)
const playfield = [];
for (let r = -2; r < rows; r++) {
  playfield[r] = [];
  for (let c = 0; c < cols; c++) playfield[r][c] = 0;
}

// Piezas (SRS)
const tetrominos = {
  'I': [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
  'J': [[1,0,0],[1,1,1],[0,0,0]],
  'L': [[0,0,1],[1,1,1],[0,0,0]],
  'O': [[1,1],[1,1]],
  'S': [[0,1,1],[1,1,0],[0,0,0]],
  'Z': [[1,1,0],[0,1,1],[0,0,0]],
  'T': [[0,1,0],[1,1,1],[0,0,0]]
};
const colors = {
  'I':'#001632ff', 'O':'#a7a700ff', 'T':'#3b0058ff',
  'S':'#008100ff', 'Z':'#b30000ff', 'J':'#006b8cff', 'L':'#bdbdbdff'
};

// Pieza actual / siguiente
let tetromino = null;
let nextName  = null;

// Frames contados para caída
let frameCount = 0;

// =================== Utilidades ============================================
function getRandomInt(min, max) {
  min = Math.ceil(min); max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function generateSequence() {
  const seq = ['I','J','L','O','S','T','Z'];
  while (seq.length) {
    const rand = getRandomInt(0, seq.length - 1);
    tetrominoSequence.push(seq.splice(rand, 1)[0]);
  }
}
function pullNextName() {
  if (tetrominoSequence.length === 0) generateSequence();
  return tetrominoSequence.pop();
}
function makeTetromino(name) {
  const matrix = tetrominos[name];
  const col = playfield[0].length / 2 - Math.ceil(matrix[0].length / 2);
  const row = name === 'I' ? -1 : -2;
  return { name, matrix, row, col };
}
function rotate(matrix) {
  const N = matrix.length - 1;
  return matrix.map((row, i) => row.map((_, j) => matrix[N - j][i]));
}
function isValidMove(matrix, cellRow, cellCol) {
  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r].length; c++) {
      if (matrix[r][c] &&
         (cellCol + c < 0 ||
          cellCol + c >= cols ||
          cellRow + r >= rows ||
          playfield[cellRow + r][cellCol + c])) {
        return false;
      }
    }
  }
  return true;
}
function hardDropDistance() {
  let dist = 0;
  while (isValidMove(tetromino.matrix, tetromino.row + dist + 1, tetromino.col)) {
    dist++;
  }
  return dist;
}
function loadBest() {
  try { return parseInt(localStorage.getItem('tetris_best') || '0', 10) || 0; }
  catch { return 0; }
}
function saveBest(v) {
  try { localStorage.setItem('tetris_best', String(v)); } catch {}
}
function updateLevelSpeed() {
  level = Math.floor(lines / 10) + 1;
  dropFrames = Math.max(5, 35 - (level - 1) * 3); // baja hasta 5
}

// =================== Juego ==================================================
function placeTetromino() {
  // Fijar en tablero
  for (let r = 0; r < tetromino.matrix.length; r++) {
    for (let c = 0; c < tetromino.matrix[r].length; c++) {
      if (tetromino.matrix[r][c]) {
        if (tetromino.row + r < 0) return showGameOver();
        playfield[tetromino.row + r][tetromino.col + c] = tetromino.name;
      }
    }
  }
  // Revisar líneas
  let cleared = 0;
  for (let r = rows - 1; r >= 0; ) {
    if (playfield[r].every(cell => !!cell)) {
      cleared++;
      // “Bajar” todo
      for (let rr = r; rr >= 0; rr--) {
        for (let cc = 0; cc < cols; cc++) {
          playfield[rr][cc] = playfield[rr - 1]?.[cc] || 0;
        }
      }
    } else {
      r--;
    }
  }
  if (cleared > 0) {
    // Puntuación por líneas (clásica): 1/2/3/4
    const lineScores = [0, 100, 300, 500, 800];
    score += lineScores[cleared] * level;
    lines += cleared;
    updateLevelSpeed();
  }
  // Siguiente pieza
  tetromino = makeTetromino(nextName ?? pullNextName());
  nextName  = pullNextName();
}
function showGameOver() {
  cancelAnimationFrame(rAF);
  gameOver = true;
  if (score > best) { best = score; saveBest(best); }
  // Overlay
  context.fillStyle = 'rgba(0,0,0,0.75)';
  context.fillRect(0, canvas.height/2 - 60, canvas.width, 120);
  context.fillStyle = '#fff';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = '28px monospace';
  context.fillText('GAME OVER', canvas.width/2, canvas.height/2 - 10);
  context.font = '16px monospace';
  context.fillText(`Score: ${score}  ·  Best: ${best}`, canvas.width/2, canvas.height/2 + 16);
  context.fillText('Pulsa R para reiniciar', canvas.width/2, canvas.height/2 + 40);
}
function resetGame() {
  // Vaciar tablero
  for (let r = -2; r < rows; r++) for (let c = 0; c < cols; c++) playfield[r][c] = 0;
  score = 0; lines = 0; level = 1; updateLevelSpeed();
  frameCount = 0; gameOver = false; paused = false;
  tetrominoSequence.length = 0;
  tetromino = null; nextName = null;
  // Inicializar piezas
  nextName  = pullNextName();
  tetromino = makeTetromino(pullNextName());
  cancelAnimationFrame(rAF);
  rAF = requestAnimationFrame(loop);
}

// =================== Dibujo =================================================
function drawGridBackground() {
  context.save();
  context.strokeStyle = 'rgba(255,255,255,0.06)';
  context.lineWidth = 1;
  for (let x = grid; x < canvas.width; x += grid) {
    context.beginPath(); context.moveTo(x,0); context.lineTo(x,canvas.height); context.stroke();
  }
  for (let y = grid; y < canvas.height; y += grid) {
    context.beginPath(); context.moveTo(0,y); context.lineTo(0+canvas.width,y); context.stroke();
  }
  context.restore();
}
function drawHUD() {
  // Panel semitransparente
  context.save();
  context.fillStyle = 'rgba(0,0,0,0.5)';
  context.fillRect(4, 4, 176, 56); // HUD principal
  context.fillRect(canvas.width - 116, 4, 112, 112); // preview
  context.fillStyle = '#fff';
  context.font = '12px monospace';
  context.textAlign = 'left';
  context.textBaseline = 'top';
  context.fillText(`Score: ${score}`, 10, 10);
  context.fillText(`Lines: ${lines}`, 10, 26);
  context.fillText(`Level: ${level}`, 10, 42);
  context.fillText(`Best : ${best}`, 94, 42);
  // Controles
  context.globalAlpha = 0.8;
  context.fillText('P: pausa   R: reiniciar', 10, 60);
  context.globalAlpha = 1;
  // Preview
  context.fillText('Next', canvas.width - 108, 10);
  drawPreview(nextName, canvas.width - 104, 26);
  context.restore();
}
function drawPreview(name, ox, oy) {
  if (!name) return;
  const m = tetrominos[name];
  const size = 16;
  context.save();
  context.translate(ox, oy);
  context.fillStyle = colors[name];
  for (let r = 0; r < m.length; r++) {
    for (let c = 0; c < m[r].length; c++) {
      if (m[r][c]) {
        context.fillRect(c * size, r * size, size-1, size-1);
      }
    }
  }
  context.restore();
}
function drawBoardAndPiece() {
  // Tablero
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (playfield[r][c]) {
        const name = playfield[r][c];
        context.fillStyle = colors[name];
        context.fillRect(c * grid, r * grid, grid-1, grid-1);
      }
    }
  }
  // Pieza activa
  if (tetromino) {
    context.fillStyle = colors[tetromino.name];
    for (let r = 0; r < tetromino.matrix.length; r++) {
      for (let c = 0; c < tetromino.matrix[r].length; c++) {
        if (tetromino.matrix[r][c]) {
          context.fillRect((tetromino.col + c) * grid, (tetromino.row + r) * grid, grid-1, grid-1);
        }
      }
    }
  }
}
function loop() {
  rAF = requestAnimationFrame(loop);
  context.clearRect(0,0,canvas.width,canvas.height);
  drawGridBackground();

  if (paused) {
    drawBoardAndPiece();
    drawHUD();
    context.fillStyle = 'rgba(0,0,0,0.6)';
    context.fillRect(0, canvas.height/2 - 40, canvas.width, 80);
    context.fillStyle = '#fff';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = '28px monospace';
    context.fillText('PAUSA', canvas.width/2, canvas.height/2);
    return;
  }

  // Caída
  if (++frameCount > dropFrames) {
    frameCount = 0;
    tetromino.row++;
    if (!isValidMove(tetromino.matrix, tetromino.row, tetromino.col)) {
      tetromino.row--;
      placeTetromino();
    }
  }

  drawBoardAndPiece();
  drawHUD();
}

// =================== Controles — teclado ====================================
document.addEventListener('keydown', (e) => {
  if (gameOver) {
    if (e.key.toLowerCase() === 'r') resetGame();
    return;
  }
  if (e.key.toLowerCase() === 'p') {
    paused = !paused;
    return;
  }
  if (paused) return;

  // Mover izquierda/derecha
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    const col = tetromino.col + (e.key === 'ArrowLeft' ? -1 : 1);
    if (isValidMove(tetromino.matrix, tetromino.row, col)) tetromino.col = col;
  }
  // Rotar
  if (e.key === 'ArrowUp') {
    const m = rotate(tetromino.matrix);
    if (isValidMove(m, tetromino.row, tetromino.col)) tetromino.matrix = m;
  }
  // Soft drop (↓) — 1 punto por celda
  if (e.key === 'ArrowDown') {
    const row = tetromino.row + 1;
    if (!isValidMove(tetromino.matrix, row, tetromino.col)) {
      tetromino.row = row - 1;
      placeTetromino();
    } else {
      tetromino.row = row;
      score += 1;
    }
  }
  // Hard drop (Espacio) — 2 puntos por celda
  if (e.code === 'Space') {
    const d = hardDropDistance();
    if (d > 0) score += d * 2;
    tetromino.row += d;
    placeTetromino();
  }
  // Reiniciar en caliente
  if (e.key.toLowerCase() === 'r') resetGame();
}, false);

// =================== Controles — táctil (móvil) =============================
// Interacción natural: swipe L/R = mover; arrastrar abajo = soft drop;
// flick rápido hacia abajo = hard drop; tap = rotar; long-press = pausa.
canvas.style.touchAction = 'none'; // evita el scroll/zoom del navegador sobre el canvas

const SWIPE_COL_PX = 24;   // píxeles por “paso” horizontal (1 columna)
const SWIPE_ROW_PX = 24;   // píxeles por “paso” vertical (1 fila)
let tActive = false;
let tStartX = 0, tStartY = 0, tLastX = 0, tLastY = 0, tStartTime = 0;

function onTouchStart(e){
  // Solo si el toque inicia sobre el canvas del juego
  if (!e.target || e.target !== canvas) return;
  if (gameOver) return; // evita consumir toques tras game over
  const t = e.touches[0];
  if (!t) return;
  tActive = true;
  tStartX = tLastX = t.clientX;
  tStartY = tLastY = t.clientY;
  tStartTime = performance.now();
  e.preventDefault();
}
function onTouchMove(e){
  if (!tActive || paused || gameOver) return;
  const t = e.touches[0];
  if (!t) return;

  let dx = t.clientX - tLastX;
  let dy = t.clientY - tLastY;

  // Mover en pasos por umbral, permitiendo arrastre continuo
  // Izquierda
  while (dx <= -SWIPE_COL_PX) {
    const col = tetromino.col - 1;
    if (isValidMove(tetromino.matrix, tetromino.row, col)) tetromino.col = col;
    tLastX -= SWIPE_COL_PX;
    dx += SWIPE_COL_PX;
  }
  // Derecha
  while (dx >= SWIPE_COL_PX) {
    const col = tetromino.col + 1;
    if (isValidMove(tetromino.matrix, tetromino.row, col)) tetromino.col = col;
    tLastX += SWIPE_COL_PX;
    dx -= SWIPE_COL_PX;
  }
  // Soft drop en pasos verticales
  while (dy >= SWIPE_ROW_PX) {
    const row = tetromino.row + 1;
    if (!isValidMove(tetromino.matrix, row, tetromino.col)) {
      tetromino.row = row - 1;
      placeTetromino();
      break;
    } else {
      tetromino.row = row;
      score += 1; // mismo bonus que ↓
      tLastY += SWIPE_ROW_PX;
      dy -= SWIPE_ROW_PX;
    }
  }

  e.preventDefault();
}
function onTouchEnd(e){
  if (!tActive) return;
  const dt = performance.now() - tStartTime;
  const totalDx = tLastX - tStartX;
  const totalDy = tLastY - tStartY;
  const dist = Math.hypot(totalDx, totalDy);

  if (!paused && !gameOver){
    if (dt < 250 && dist < 10) {
      // Tap corto: rotar
      const m = rotate(tetromino.matrix);
      if (isValidMove(m, tetromino.row, tetromino.col)) tetromino.matrix = m;
    } else if (dt < 220 && totalDy > 120) {
      // Flick rápido hacia abajo: hard drop
      const d = hardDropDistance();
      if (d > 0) score += d * 2;
      tetromino.row += d;
      placeTetromino();
    } else if (dt > 450 && dist < 12) {
      // Long press: pausa
      paused = !paused;
    }
  }

  tActive = false;
}

canvas.addEventListener('touchstart', onTouchStart, {passive:false});
canvas.addEventListener('touchmove',  onTouchMove,  {passive:false});
canvas.addEventListener('touchend',   onTouchEnd,   {passive:false});

// =================== Inicio =================================================
// Inicial pieza actual y siguiente
nextName  = pullNextName();
tetromino = makeTetromino(pullNextName());
rAF = requestAnimationFrame(loop);

// --- Panel del easter egg: cerrar ---
(function(){
  const close = document.getElementById('eggClose');
  const panel = document.getElementById('eggPanel');
  if (!close || !panel) return;
  close.addEventListener('click', () => {
    panel.style.display = 'none';
  });
})();

// Oculta el mensaje secreto después de 5s con un suave fade
(function () {
  const el = document.getElementById('secretMsg');
  if (!el) return;
  setTimeout(() => {
    el.classList.add('hide');
    setTimeout(() => el.remove(), 600); // espera la transición
  }, 5000);
})();

