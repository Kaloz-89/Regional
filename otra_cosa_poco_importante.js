
// === Configuración básica ===
const canvas  = document.getElementById('game');
const context = canvas.getContext('2d');
const grid    = 16;                    // tamaño de celda
const COLS    = canvas.width  / grid;  // 25
const ROWS    = canvas.height / grid;  // 25

// HUD / Overlay
const scoreEl     = document.getElementById('score');
const hiEl        = document.getElementById('hiscore');
const overlayEl   = document.getElementById('overlay');
const finalScore  = document.getElementById('finalScore');
const finalHi     = document.getElementById('finalHi');
const HISCORE_KEY = 'snake_highscore';

// Estado del juego
let running = true;
let rAF = null;
let score = 0;
let hiscore = Number(localStorage.getItem(HISCORE_KEY) || 0);
hiEl && (hiEl.textContent = hiscore);

// Serpiente
const snake = {
  x: 160,
  y: 160,
  dx: grid,
  dy: 0,
  cells: [],
  maxCells: 4
};

// Manzana
const apple = { x: 320, y: 320 };

// ====== Velocidad progresiva ======
// Usamos un “step” por tiempo, no por frames.
const STEP_START_MS = 220;   // más alto = más lento, arranca lento
const STEP_MIN_MS   = 70;    // límite inferior (más rápido)
const STEP_DELTA_MS = 6;     // cuánto se acelera por fruta
let stepMs = STEP_START_MS;  // step actual
let lastTime = 0;            // timestamp del último frame
let acc = 0;                 // acumulador de tiempo

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min; // [min, max)
}

function placeApple() {
  apple.x = randInt(0, COLS) * grid;
  apple.y = randInt(0, ROWS) * grid;
  // Evitar aparecer sobre la serpiente
  while (snake.cells.some(c => c.x === apple.x && c.y === apple.y)) {
    apple.x = randInt(0, COLS) * grid;
    apple.y = randInt(0, ROWS) * grid;
  }
}

function resetGame() {
  score = 0;
  if (scoreEl) scoreEl.textContent = score;
  running = true;
  overlayEl && overlayEl.classList.remove('show');
  overlayEl && overlayEl.setAttribute('aria-hidden', 'true');

  snake.x = 160;
  snake.y = 160;
  snake.dx = grid;
  snake.dy = 0;
  snake.cells = [];
  snake.maxCells = 4;

  stepMs = STEP_START_MS; // volver a velocidad inicial
  placeApple();

  cancelAnimationFrame(rAF);
  lastTime = performance.now();
  acc = 0;
  rAF = requestAnimationFrame(loop);
}

function gameOver() {
  running = false;
  cancelAnimationFrame(rAF);
  if (score > hiscore) {
    hiscore = score;
    localStorage.setItem(HISCORE_KEY, String(hiscore));
    hiEl && (hiEl.textContent = hiscore);
  }
  if (finalScore) finalScore.textContent = score;
  if (finalHi) finalHi.textContent = hiscore;
  overlayEl && overlayEl.classList.add('show');
  overlayEl && overlayEl.setAttribute('aria-hidden', 'false');
}

// Loop principal con control de tiempo (delta)
function loop(now) {
  rAF = requestAnimationFrame(loop);
  if (!lastTime) lastTime = now;
  const dt = now - lastTime;
  lastTime = now;
  acc += dt;

  // sólo actualizamos estado cuando pasa el “step”
  if (acc < stepMs) return;
  acc -= stepMs;

  context.clearRect(0, 0, canvas.width, canvas.height);
  if (!running) return;

  // Mover snake
  snake.x += snake.dx;
  snake.y += snake.dy;

  // Colisión con paredes => Game Over
  if (snake.x < 0 || snake.x >= canvas.width || snake.y < 0 || snake.y >= canvas.height) {
    return gameOver();
  }

  // Registrar posiciones
  snake.cells.unshift({ x: snake.x, y: snake.y });
  if (snake.cells.length > snake.maxCells) snake.cells.pop();

  // Dibujar manzana
  context.fillStyle = '#ff0000ff';
  context.fillRect(apple.x, apple.y, grid - 1, grid - 1);

  // Dibujar snake y comprobar eventos
  context.fillStyle = '#006002ff';
  for (let i = 0; i < snake.cells.length; i++) {
    const cell = snake.cells[i];
    context.fillRect(cell.x, cell.y, grid - 1, grid - 1);

    // ¿Comió manzana?
    if (cell.x === apple.x && cell.y === apple.y) {
      snake.maxCells++;
      score += 1;
      if (scoreEl) scoreEl.textContent = score;

      // Acelerar un poco (hasta el mínimo)
      stepMs = Math.max(STEP_MIN_MS, stepMs - STEP_DELTA_MS);
      placeApple();
    }

    // Colisión con cola
    for (let j = i + 1; j < snake.cells.length; j++) {
      if (cell.x === snake.cells[j].x && cell.y === snake.cells[j].y) {
        return gameOver();
      }
    }
  }
}

// Controles — teclado
document.addEventListener('keydown', (e) => {
  if (!running && (e.key === ' ' || e.key === 'Enter')) {
    e.preventDefault();
    return resetGame();
  }
  // Evitar retroceder en el mismo eje
  if ((e.key === 'ArrowLeft' || e.key === 'a') && snake.dx === 0) {
    snake.dx = -grid; snake.dy = 0;
  } else if ((e.key === 'ArrowUp' || e.key === 'w') && snake.dy === 0) {
    snake.dy = -grid; snake.dx = 0;
  } else if ((e.key === 'ArrowRight' || e.key === 'd') && snake.dx === 0) {
    snake.dx = grid; snake.dy = 0;
  } else if ((e.key === 'ArrowDown' || e.key === 's') && snake.dy === 0) {
    snake.dy = grid; snake.dx = 0;
  }
});

// =================== Controles — táctil (móvil) =============================
// Gestos: swipe horizontal/vertical => giro 90° (sin reversa).
// Tap corto con Game Over => reinicio.
// Se evita el scroll del navegador sobre el canvas.
canvas.style.touchAction = 'none';

const SWIPE_THRESHOLD = 18; // px mínimos para considerar swipe
let tStartX = 0, tStartY = 0, tStartTime = 0, tActive = false;

function onTouchStart(e){
  if (e.target !== canvas) return;
  const t = e.touches[0];
  if (!t) return;
  tActive = true;
  tStartX = t.clientX;
  tStartY = t.clientY;
  tStartTime = performance.now();
  e.preventDefault();
}

function onTouchMove(e){
  // Solo prevenimos scroll cuando el gesto está activo
  if (tActive) e.preventDefault();
}

function onTouchEnd(e){
  if (!tActive) return;
  tActive = false;

  const t = e.changedTouches && e.changedTouches[0];
  if (!t) return;

  const dx = t.clientX - tStartX;
  const dy = t.clientY - tStartY;
  const adx = Math.abs(dx);
  const ady = Math.abs(dy);
  const dt  = performance.now() - tStartTime;

  // Tap corto en Game Over => reset
  const isTap = adx < 10 && ady < 10 && dt < 250;
  if (!running && isTap) {
    resetGame();
    return;
  }

  if (!running) return;

  // Elegimos el eje dominante del swipe
  if (adx > ady && adx > SWIPE_THRESHOLD) {
    // Horizontal: solo si venía en vertical (misma regla que teclado)
    if (snake.dx === 0) {
      snake.dx = dx > 0 ? grid : -grid;
      snake.dy = 0;
    }
  } else if (ady > SWIPE_THRESHOLD) {
    // Vertical: solo si venía en horizontal
    if (snake.dy === 0) {
      snake.dy = dy > 0 ? grid : -grid;
      snake.dx = 0;
    }
  }
  e.preventDefault();
}

canvas.addEventListener('touchstart', onTouchStart, {passive:false});
canvas.addEventListener('touchmove',  onTouchMove,  {passive:false});
canvas.addEventListener('touchend',   onTouchEnd,   {passive:false});

// Click/tap en overlay para reiniciar
overlayEl && overlayEl.addEventListener('click', () => {
  if (!running) resetGame();
});

// Inicio
placeApple();
lastTime = performance.now();
rAF = requestAnimationFrame(loop);

// Mensaje secreto (fade)
(function () {
  const el = document.getElementById('secretMsg');
  if (!el) return;
  // Espera 4.5s, inicia el fade y luego quita el elemento al 5º segundo
  setTimeout(() => {
    el.classList.add('hide');
    setTimeout(() => { el.remove(); }, 600); // espera al transition (0.5s)
  }, 4500);
})();

