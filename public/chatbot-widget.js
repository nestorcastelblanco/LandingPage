/**
 * Widget de demo del Chatbot IA para consultorios (Sofía · Clínica Salud Vital).
 * Conversa en vivo contra el backend FastAPI vía POST /chat.
 *
 * Nota de seguridad: la API key viaja en el cliente porque es una demo pública
 * de bajo privilegio. Rotar/limitar si se detecta abuso.
 */
(function () {
  'use strict';

  const API_URL = 'https://chatbot-clinica-adsw.onrender.com/chat';
  const API_KEY = 'clinica-salud-vital-2026';
  const REQUEST_TIMEOUT_MS = 60000; // Render free tier puede tener arranque en frío
  const SALUDO =
    '¡Hola! Soy Sofía, la asistente virtual de la Clínica Salud Vital. ' +
    'Puedo ayudarte a agendar una cita o resolver tus dudas. ¿En qué te ayudo?';

  const widget = document.getElementById('chat-widget');
  const mensajesEl = document.getElementById('chat-mensajes');
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const abrirBtns = document.querySelectorAll('[data-abrir-chat]');
  const cerrarEls = document.querySelectorAll('[data-cerrar-chat]');

  if (!widget || !mensajesEl || !form || !input) return;

  let sessionId = null;
  let iniciado = false;
  let enviando = false;

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

  async function enviarAlBackend(mensaje) {
    const controlador = new AbortController();
    const timer = setTimeout(() => controlador.abort(), REQUEST_TIMEOUT_MS);
    try {
      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
        body: JSON.stringify({ session_id: sessionId, message: mensaje }),
        signal: controlador.signal,
      });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const data = await resp.json();
      if (data.session_id) sessionId = data.session_id;
      return data.reply || 'Lo siento, no pude procesar tu mensaje.';
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

    const escribiendo = mostrarEscribiendo();
    try {
      const respuesta = await enviarAlBackend(texto);
      escribiendo.remove();
      agregarMensaje(respuesta, 'bot');
    } catch (error) {
      escribiendo.remove();
      const msg =
        error.name === 'AbortError'
          ? 'El servidor tardó demasiado en responder. Inténtalo de nuevo.'
          : 'No pude conectar con el asistente. Vuelve a intentarlo en unos segundos.';
      agregarMensaje(msg, 'error');
    } finally {
      enviando = false;
      input.focus();
    }
  }

  function abrirChat() {
    widget.hidden = false;
    document.body.style.overflow = 'hidden';
    if (!iniciado) {
      iniciado = true;
      agregarMensaje(SALUDO, 'bot');
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
