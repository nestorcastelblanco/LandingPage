import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, addDoc, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCQYSG7gpvQjRELJl_qVVU6nVM03vHEhGc",
  authDomain: "nexuscsa-01.firebaseapp.com",
  projectId: "nexuscsa-01",
  storageBucket: "nexuscsa-01.firebasestorage.app",
  messagingSenderId: "1093590455675",
  appId: "1:1093590455675:web:c2354b13a0c3530ac2d9de"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-contacto');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn    = form.querySelector('button[type="submit"]');
    const status = document.getElementById('form-status');
    const original = btn.textContent;
    btn.textContent = 'Enviando...';
    btn.disabled = true;
    status.textContent = '';
    status.className = 'form-status';

    const datos = {
      nombre:   form.nombre.value.trim(),
      empresa:  form.empresa.value.trim(),
      email:    form.email.value.trim(),
      telefono: form.telefono.value.trim(),
      mensaje:  form.mensaje.value.trim()
    };

    try {
      // Guardar registro en Firestore
      await addDoc(collection(db, 'contactos'), {
        ...datos,
        fecha: serverTimestamp()
      });

      // Disparar correo via extensión Trigger Email
      await addDoc(collection(db, 'mail'), {
        to: ['ncastelblanco@sysdatec.edu.co', 'sebastianagudelomendez@gmail.com'],
        message: {
          subject: `Nuevo contacto Nexus CSA — ${datos.nombre}`,
          text: `Nombre: ${datos.nombre}\nEmpresa: ${datos.empresa}\nEmail: ${datos.email}\nTeléfono: ${datos.telefono}\n\nMensaje:\n${datos.mensaje}`,
          html: `
            <h2 style="color:#294959">Nuevo contacto desde Nexus CSA</h2>
            <p><strong>Nombre:</strong> ${datos.nombre}</p>
            <p><strong>Empresa:</strong> ${datos.empresa}</p>
            <p><strong>Email:</strong> <a href="mailto:${datos.email}">${datos.email}</a></p>
            <p><strong>Teléfono:</strong> ${datos.telefono}</p>
            <hr>
            <p><strong>Mensaje:</strong></p>
            <p>${datos.mensaje.replace(/\n/g, '<br>')}</p>
          `
        }
      });

      form.reset();
      status.textContent = '¡Mensaje enviado! Te contactamos pronto.';
      status.className = 'form-status ok';
    } catch (err) {
      console.error(err);
      status.textContent = 'Error al enviar. Intenta de nuevo o escríbenos por WhatsApp.';
      status.className = 'form-status error';
    } finally {
      btn.textContent = original;
      btn.disabled = false;
    }
  });
});
