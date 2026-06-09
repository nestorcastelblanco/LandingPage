(function () {
  'use strict';

  const WEBHOOK_URL = 'https://n8n.srv1227996.hstgr.cloud/webhook/sysdatec-chat';
  const SESSION_KEY = 'sds_edu_session_id';
  const REQUEST_TIMEOUT_MS = 60000;
  const SALUDO_FALLBACK =
    '¡Hola! Soy el asesor virtual de Sysdatec. Puedo informarte sobre carreras técnicas, ' +
    'horarios, costos e inscripciones. ¿En qué te puedo ayudar?';

  const widget = document.getElementById('chat-widget-edu');
  const mensajesEl = document.getElementById('chat-edu-mensajes');
  const form = document.getElementById('chat-edu-form');
  const input = document.getElementById('chat-edu-input');
  const abrirBtns = document.querySelectorAll('[data-abrir-chat-edu]');
  const cerrarEls = document.querySelectorAll('[data-cerrar-chat-edu]');

  if (!widget || !mensajesEl || !form || !input) return;

  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = 'edu_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    localStorage.setItem(SESSION_KEY, sessionId);
  }

  let iniciado = false;
  let enviando = false;
  let conversationHistory = [];
  let sessionEstado = {};

  function scrollAbajo() {
    mensajesEl.scrollTop = mensajesEl.scrollHeight;
  }

  function agregarMensaje(texto, origen) {
    const burbuja = document.createElement('div');
    burbuja.className = 'chat-msg chat-msg-' + origen;
    burbuja.textContent = texto;
    mensajesEl.appendChild(burbuja);
    scrollAbajo();
    return burbuja;
  }

  function mostrarEscribiendo() {
    const el = document.createElement('div');
    el.className = 'chat-msg chat-msg-bot chat-typing';
    el.innerHTML = '<span></span><span></span><span></span>';
    mensajesEl.appendChild(el);
    scrollAbajo();
    return el;
  }

  async function enviarAlWebhook(mensaje) {
    const controlador = new AbortController();
    const timer = setTimeout(() => controlador.abort(), REQUEST_TIMEOUT_MS);
    try {
      const payload = JSON.stringify({
        message: mensaje,
        sessionId: sessionId,
        contactName: '',
        historial: conversationHistory.slice(-12),
        estado: sessionEstado,
      });
      const resp = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        signal: controlador.signal,
      });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const data = await resp.json();
      if (data.estado && typeof data.estado === 'object') {
        sessionEstado = data.estado;
      }
      return data.message || 'Lo siento, no pude procesar tu mensaje.';
    } finally {
      clearTimeout(timer);
    }
  }

  async function manejarEnvio(evento) {
    evento.preventDefault();
    const texto = input.value.trim();
    if (!texto || enviando) return;

    enviando = true;
    input.value = '';
    agregarMensaje(texto, 'user');
    conversationHistory.push({ role: 'user', content: texto });

    const escribiendo = mostrarEscribiendo();
    try {
      const respuesta = await enviarAlWebhook(texto);
      escribiendo.remove();
      conversationHistory.push({ role: 'assistant', content: respuesta });
      agregarMensaje(respuesta, 'bot');
    } catch (error) {
      escribiendo.remove();
      conversationHistory.pop();
      const msg =
        error.name === 'AbortError'
          ? 'El servidor tardó demasiado en responder. Inténtalo de nuevo.'
          : 'No pude conectar con el asesor. Vuelve a intentarlo en unos segundos.';
      agregarMensaje(msg, 'error');
    } finally {
      enviando = false;
      input.focus();
    }
  }

  async function iniciarConversacion() {
    const escribiendo = mostrarEscribiendo();
    try {
      const saludo = await enviarAlWebhook('hola');
      escribiendo.remove();
      conversationHistory.push({ role: 'assistant', content: saludo });
      agregarMensaje(saludo, 'bot');
    } catch {
      escribiendo.remove();
      agregarMensaje(SALUDO_FALLBACK, 'bot');
    }
  }

  function abrirChat() {
    widget.hidden = false;
    document.body.style.overflow = 'hidden';
    if (!iniciado) {
      iniciado = true;
      iniciarConversacion();
    }
    input.focus();
  }

  function cerrarChat() {
    widget.hidden = true;
    document.body.style.overflow = '';
  }

  abrirBtns.forEach((btn) => btn.addEventListener('click', abrirChat));
  cerrarEls.forEach((el) => el.addEventListener('click', cerrarChat));
  form.addEventListener('submit', manejarEnvio);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !widget.hidden) cerrarChat();
  });
})();
