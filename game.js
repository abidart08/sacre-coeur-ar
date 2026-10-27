(() => {
  'use strict';

  if (window.SacreMarkers) window.SacreMarkers.applyPatternUrls();

  const STORAGE_KEY = 'sacreCoeurTreasureStateV1';
  const steps = {
    1: { icon: '🧭', title: 'La brújula despertó', body: 'Primera pista superada. Ahora buscá el lugar donde la geometría se vuelve sagrada y las voces de la comunidad se reúnen: el Aula Magna.' },
    2: { icon: '🗝️', title: 'Encontraste la llave', body: 'La llave señala el último destino. Buscá un espacio de contemplación donde el arte y la espiritualidad se encuentran: la Capilla del Encuentro.' },
    3: { icon: '✨', title: 'El sello final se abrió', body: 'Los tres símbolos están completos. El tesoro del Sacré Coeur acaba de revelarse.' }
  };

  const defaultState = () => ({ found: [false, false, false], startedAt: null, completedAt: null });
  let state = loadState();
  let audioCtx = null;
  let timerInterval = null;
  let lastStatus = '';

  const $ = (id) => document.getElementById(id);
  const welcome = $('welcome');
  const messageModal = $('message-modal');
  const finalModal = $('final-modal');
  const helpModal = $('help-modal');
  const statusEl = $('scan-status');

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed.found) || parsed.found.length !== 3) return defaultState();
      return parsed;
    } catch (_) { return defaultState(); }
  }
  function saveState() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {} }
  function firstMissingStep() { const idx = state.found.findIndex((v) => !v); return idx === -1 ? 4 : idx + 1; }
  function setStatus(text) { if (text === lastStatus) return; lastStatus = text; statusEl.textContent = text; }
  function formatElapsed(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    return `${Math.floor(total / 60).toString().padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}`;
  }
  function elapsedMs() { if (!state.startedAt) return 0; return (state.completedAt || Date.now()) - state.startedAt; }
  function render() {
    const foundCount = state.found.filter(Boolean).length;
    $('progress-text').textContent = `${foundCount} / 3`;
    state.found.forEach((found, i) => $('step-' + (i + 1)).classList.toggle('found', found));
    $('timer').textContent = formatElapsed(elapsedMs());
    if (state.completedAt) setStatus('Tesoro encontrado · misión completada');
    else { const next = firstMissingStep(); setStatus(next <= 3 ? `Buscá el marcador ${next} de 3` : 'Tesoro encontrado'); }
  }
  function startTimer() { clearInterval(timerInterval); timerInterval = setInterval(() => { $('timer').textContent = formatElapsed(elapsedMs()); }, 1000); }
  function ensureStarted() { if (!state.startedAt) { state.startedAt = Date.now(); saveState(); } }
  function initAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!audioCtx) audioCtx = new AudioContext();
      if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch (_) {}
  }
  function tone(freq, offset, duration, type = 'sine', volume = 0.05) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator(), gain = audioCtx.createGain(), t = audioCtx.currentTime + offset;
    osc.type = type; osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.0001, t); gain.gain.exponentialRampToValueAtTime(volume, t + 0.02); gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain).connect(audioCtx.destination); osc.start(t); osc.stop(t + duration + 0.04);
  }
  function playFoundSound(step) {
    initAudio(); if (!audioCtx) return;
    if (step < 3) { tone(523.25, 0, .17); tone(659.25, .12, .18); tone(783.99, .25, .28); }
    else { tone(523.25,0,.18,'triangle',.07); tone(659.25,.11,.18,'triangle',.07); tone(783.99,.22,.18,'triangle',.07); tone(1046.5,.34,.48,'triangle',.08); }
  }
  function openMessage(step) {
    const data = steps[step];
    $('message-icon').textContent = data.icon; $('message-title').textContent = data.title; $('message-body').textContent = data.body;
    $('message-kicker').textContent = step === 3 ? 'ÚLTIMO SÍMBOLO' : `PISTA ${step} ENCONTRADA`;
    messageModal.classList.add('visible');
  }
  function showFinal() { $('final-time').textContent = formatElapsed(elapsedMs()); finalModal.classList.add('visible'); launchConfetti(); }
  function processStep(step, source = 'marker') {
    ensureStarted(); const next = firstMissingStep();
    if (state.found[step - 1]) { setStatus(`Marcador ${step} ya registrado. Buscá el ${next <= 3 ? next : 'tesoro'}.`); return; }
    if (step !== next) { setStatus(`Ese marcador todavía está bloqueado. Primero encontrá el marcador ${next}.`); if (navigator.vibrate) navigator.vibrate(80); return; }
    state.found[step - 1] = true; if (step === 3) state.completedAt = Date.now(); saveState(); render(); playFoundSound(step);
    if (navigator.vibrate) navigator.vibrate(step === 3 ? [80,60,120] : 80); openMessage(step);
    if (source === 'debug') console.info(`[debug] step ${step} accepted`);
  }
  function attachMarkerListeners() {
    [1,2,3].forEach((step) => {
      const marker = $('marker-' + step); if (!marker) return;
      marker.addEventListener('markerFound', () => processStep(step));
      marker.addEventListener('markerLost', () => {
        if (!messageModal.classList.contains('visible') && !finalModal.classList.contains('visible')) {
          const next = firstMissingStep(); if (next <= 3) setStatus(`Marcador fuera de cámara. Buscá el marcador ${next}.`);
        }
      });
    });
  }
  function launchConfetti() {
    const container = $('confetti'); container.innerHTML = '';
    const palette = ['#38bdf8','#fbbf24','#f8fafc','#22c55e','#a78bfa'];
    for (let i=0;i<70;i++) {
      const el=document.createElement('i'); el.className='confetti-piece'; el.style.left=`${Math.random()*100}%`; el.style.background=palette[i%palette.length];
      el.style.setProperty('--duration',`${2.8+Math.random()*2.2}s`); el.style.setProperty('--drift',`${-120+Math.random()*240}px`); el.style.setProperty('--rotation',`${Math.random()*180}deg`);
      el.style.animationDelay=`${Math.random()*.55}s`; container.appendChild(el);
    }
    setTimeout(()=>{container.innerHTML='';},5600);
  }
  function resetGame() {
    if (!window.confirm('¿Reiniciar todo el progreso de la búsqueda?')) return;
    state=defaultState(); saveState(); render(); welcome.classList.add('visible'); messageModal.classList.remove('visible'); finalModal.classList.remove('visible'); helpModal.classList.remove('visible');
  }
  function initDebug() {
    const params=new URLSearchParams(location.search); if (params.get('debug')!=='1') return;
    const panel=$('debug-panel'); panel.hidden=false; panel.querySelectorAll('[data-debug-step]').forEach((btn)=>btn.addEventListener('click',()=>processStep(Number(btn.dataset.debugStep),'debug')));
  }
  function initUI() {
    $('start-button').addEventListener('click',()=>{initAudio();ensureStarted();welcome.classList.remove('visible');render();});
    $('continue-button').addEventListener('click',()=>{const done=Boolean(state.completedAt);messageModal.classList.remove('visible');if(done)setTimeout(showFinal,180);else render();});
    $('close-final-button').addEventListener('click',()=>finalModal.classList.remove('visible'));
    $('help-button').addEventListener('click',()=>helpModal.classList.add('visible')); $('close-help-button').addEventListener('click',()=>helpModal.classList.remove('visible')); $('reset-button').addEventListener('click',resetGame);
  }
  window.addEventListener('DOMContentLoaded',()=>{initUI();attachMarkerListeners();initDebug();render();startTimer();if(state.startedAt)welcome.classList.remove('visible');if(state.completedAt){$('final-time').textContent=formatElapsed(elapsedMs());setStatus('Tesoro encontrado · misión completada');}});
})();