/**
 * ==========================================================================
 * INVITACIÓN WEB INTERACTIVA - EL CUMPLEAÑOS DE MAIA (4 AÑOS)
 * Desarrollado con HTML, CSS y JavaScript Puro (Secuencia Simplificada)
 * ==========================================================================
 */

// ==========================================================================
// CONFIGURACIÓN DE USUARIO - REEMPLAZÁ TU NÚMERO DE WHATSAPP AQUÍ
// ==========================================================================
// NOTA IMPORTANTE: Reemplazá el valor "54911XXXXXXXX" por tu número de teléfono real.
// Debe incluir el código de país (54 para Argentina), el prefijo móvil (9),
// y el número de teléfono con código de área, sin espacios, guiones ni el símbolo "+".
// Ejemplo para Argentina, CABA: "5491155556666" o Provincia: "5492214445555"
const WHATSAPP_NUMBER = "5491164272357";


// ==========================================================================
// VARIABLES Y ELEMENTOS DOM
// ==========================================================================
const FECHA_CUMPLE = new Date("2026-08-30T14:00:00-03:00"); // Zona Horaria de Argentina

// Escenas (Secciones)
const sceneApertura = document.getElementById("apertura");
const sceneHistoria = document.getElementById("historia");
const sceneFinal = document.getElementById("invitacion-final");

// Imagen de apertura y video de la historia
const imagenApertura = document.getElementById("imagen-apertura");
const videoHistoria = document.getElementById("video-historia");

// Elementos de la Escena 1 (Apertura)
const loaderApertura = document.getElementById("loader-apertura");
const btnAbrirInvitacion = document.getElementById("btn-abrir-invitacion");
const btnFallbackApertura = document.getElementById("btn-fallback-apertura");

// Audio de fondo (suena en loop durante toda la tarjeta)
const audioFondo = document.getElementById("audio-fondo");
const btnMusicaToggle = document.getElementById("btn-musica-toggle");
const musicaIcon = document.getElementById("musica-icon");

// Elementos de la Escena 2 (Historia)
const progressBar = document.getElementById("progress-bar");
const btnAudioToggle = document.getElementById("btn-audio-toggle");
const audioIcon = document.getElementById("audio-icon");
const btnSaltar = document.getElementById("btn-saltar");
const bntFallbackHistoria = document.getElementById("btn-fallback-historia");

// Frases de la historia
const phrase1 = document.getElementById("phrase-1");
const phrase2 = document.getElementById("phrase-2");
const phrase3 = document.getElementById("phrase-3");

// Elementos del Contador en la Escena 3
const daysSpan = document.getElementById("days");
const hoursSpan = document.getElementById("hours");
const minutesSpan = document.getElementById("minutes");
const secondsSpan = document.getElementById("seconds");
const countdownContainer = document.getElementById("countdown-wrapper");
const countdownTodayText = document.getElementById("countdown-today");

// Elementos del Modal RSVP
const modalRsvp = document.getElementById("modal-rsvp");
const btnAbrirRsvp = document.getElementById("btn-abrir-rsvp");
const btnCerrarRsvp = document.getElementById("btn-cerrar-rsvp");
const rsvpForm = document.getElementById("rsvp-form");
const whatsappErrorMsg = document.getElementById("whatsapp-error-msg");

let countdownInterval = null;


// ==========================================================================
// CONTROLADOR DE TRANSICIONES ENTRE ESCENAS
// ==========================================================================
function showScene(sceneElement) {
    document.querySelectorAll(".scene").forEach(scene => {
        scene.classList.remove("active");
    });
    sceneElement.classList.add("active");
}


// ==========================================================================
// ESCENA 1 - APERTURA CON IMAGEN A PANTALLA COMPLETA
// ==========================================================================
function initOpeningScene() {
    let avanzado = false;
    const avanzarUnaVez = () => {
        if (avanzado) return;
        avanzado = true;
        activarSonido();
        transitionToScene2();
    };

    // Cuando la imagen carga, ocultamos el loader y arrancamos la música ahí mismo
    // (en la escena 1, junto con la imagen de apertura). El avance de escena solo
    // ocurre al presionar el botón.
    const onImagenLista = () => {
        loaderApertura.classList.add("fade-out");
        iniciarMusicaFondo();
    };

    if (imagenApertura.complete && imagenApertura.naturalWidth > 0) {
        onImagenLista();
    } else {
        imagenApertura.addEventListener("load", onImagenLista);
    }

    // En caso de error de carga de la imagen
    imagenApertura.addEventListener("error", (e) => {
        console.error("Error al cargar la imagen de apertura:", e);
        loaderApertura.classList.add("fade-out");
        btnFallbackApertura.classList.remove("hidden");
    });

    // En celulares, mostrar el botón de "ABRIR INVITACIÓN" después de unos segundos
    setTimeout(() => {
        btnAbrirInvitacion.classList.remove("hidden");
        btnAbrirInvitacion.classList.add("visible");
    }, 2000);

    // Click en fallbacks o botón principal
    btnFallbackApertura.addEventListener("click", avanzarUnaVez);
    btnAbrirInvitacion.addEventListener("click", avanzarUnaVez);
}

function transitionToScene2() {
    initScene2();
}


// ==========================================================================
// MÚSICA DE FONDO (SUENA EN LOOP DESDE QUE SE ABRE LA INVITACIÓN EN LA ESCENA 1)
// ==========================================================================
// Los navegadores nunca permiten arrancar audio CON sonido sin que haya habido
// antes alguna interacción del usuario con la página (política anti-spam de todos
// los navegadores, no depende de este sitio). Por eso: la música arranca
// silenciada apenas carga la imagen de apertura (el autoplay silenciado sí
// está siempre permitido) y el sonido se activa al 100% justo cuando se toca
// el botón "ABRIR INVITACIÓN" (ver avanzarUnaVez en initOpeningScene).
function iniciarMusicaFondo() {
    audioFondo.volume = 1;
    if (audioFondo.paused) {
        audioFondo.muted = true;
        const playPromise = audioFondo.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn("No se pudo iniciar la música ni siquiera silenciada:", error);
            });
        }
    }
    btnMusicaToggle.classList.remove("hidden");
}

// ==========================================================================
// REFUERZO DE VOLUMEN (WEB AUDIO API)
// ==========================================================================
// El atributo .volume de <video>/<audio> tiene un tope duro de 1.0 (100%):
// el navegador no permite pasarse de ahí. Para que suene todavía más fuerte,
// se reenruta el audio a través de la Web Audio API con un nodo de ganancia
// por encima de 1.0. Esto amplifica la señal más allá del 100% nativo (a
// costa de algo de distorsión si el archivo ya venía grabado fuerte, lo cual
// es el trade-off buscado: la prioridad es que se escuche lo más fuerte
// posible). Como todo AudioContext, necesita una interacción del usuario
// para arrancar, así que se conecta recién en la primera interacción.
let audioCtx = null;
let volumeBoostConectado = false;

function activarRefuerzoDeVolumen() {
    if (volumeBoostConectado) return;
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContextClass();
        const source = audioCtx.createMediaElementSource(audioFondo);
        const gainNode = audioCtx.createGain();
        gainNode.gain.value = 2.5;
        source.connect(gainNode).connect(audioCtx.destination);
        volumeBoostConectado = true;
    } catch (error) {
        console.warn("No se pudo aplicar el refuerzo de volumen:", error);
    }
}

function activarSonido() {
    activarRefuerzoDeVolumen();
    if (audioCtx && audioCtx.state === "suspended") {
        audioCtx.resume().catch(() => {});
    }
    if (audioFondo.paused) {
        audioFondo.play().catch(error => {
            console.warn("Reproducción de música bloqueada, se reintentará con la próxima interacción:", error);
        });
    }
    audioFondo.muted = false;
}

// El ícono del botón siempre refleja el estado real del audio: suena solo si
// no está pausado NI silenciado.
function actualizarIconoMusica() {
    musicaIcon.textContent = (audioFondo.paused || audioFondo.muted) ? "🔇" : "🔊";
}
audioFondo.addEventListener("play", actualizarIconoMusica);
audioFondo.addEventListener("pause", actualizarIconoMusica);
audioFondo.addEventListener("volumechange", actualizarIconoMusica);

btnMusicaToggle.addEventListener("click", () => {
    activarRefuerzoDeVolumen();
    if (audioFondo.paused) {
        audioFondo.muted = false;
        audioFondo.play().catch(() => {});
    } else {
        audioFondo.muted = !audioFondo.muted;
    }
});


// ==========================================================================
// ESCENA 2 - SEGUNDO VIDEO (HISTORIA)
// ==========================================================================
function initScene2() {
    showScene(sceneHistoria);

    // Intentamos reproducir con sonido gracias a la interacción previa en "ABRIR INVITACIÓN"
    videoHistoria.muted = false;
    audioIcon.textContent = "🔊";

    let playPromise = videoHistoria.play();

    if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.warn("Mute preventivo por bloqueo de políticas de audio del navegador:", error);
            // Si el navegador bloqueó el sonido, reproducirlo silenciado sin romper la experiencia
            videoHistoria.muted = true;
            audioIcon.textContent = "🔇";
            videoHistoria.play().catch(err => {
                console.error("Fallo definitivo reproducir historia:", err);
                bntFallbackHistoria.classList.remove("hidden");
            });
        });
    }

    // Actualización de la barra de progreso e hilos subtítulos mediante timeupdate
    videoHistoria.addEventListener("timeupdate", () => {
        if (videoHistoria.duration) {
            const pct = (videoHistoria.currentTime / videoHistoria.duration) * 100;
            progressBar.style.width = `${pct}%`;
        }
        syncSubtitles(videoHistoria.currentTime);
    });

    // Control de audio manual (botón mute/unmute interactivo)
    btnAudioToggle.addEventListener("click", () => {
        if (videoHistoria.muted) {
            videoHistoria.muted = false;
            audioIcon.textContent = "🔊";
        } else {
            videoHistoria.muted = true;
            audioIcon.textContent = "🔇";
        }
    });

    // Botón Saltar video
    btnSaltar.addEventListener("click", () => {
        transitionToScene3();
    });

    // Botón fallback si el video falla
    bntFallbackHistoria.addEventListener("click", () => {
        transitionToScene3();
    });

    videoHistoria.addEventListener("error", (e) => {
        console.error("Error en video-historia:", e);
        bntFallbackHistoria.classList.remove("hidden");
    });

    // El video termina -> Transición suave a la tarjeta final
    videoHistoria.addEventListener("ended", () => {
        transitionToScene3();
    });
}

/**
 * Sincroniza la visibilidad de las imágenes de frases de acuerdo al tiempo del video.
 */
function syncSubtitles(currentTime) {
    const frase1Container = document.getElementById("frase-1-container");
    const frase2Container = document.getElementById("frase-2-container");
    const frase3Container = document.getElementById("frase-3-container");
    
    // Frase 1: de 0.5s a 4.5s
    if (currentTime >= 0.5 && currentTime < 4.5) {
        frase1Container.classList.remove("hidden");
        frase2Container.classList.add("hidden");
        frase3Container.classList.add("hidden");
    }
    // Frase 2: de 4.5s a 8.5s
    else if (currentTime >= 4.5 && currentTime < 8.5) {
        frase1Container.classList.add("hidden");
        frase2Container.classList.remove("hidden");
        frase3Container.classList.add("hidden");
    }
    // Frase 3: de 8.5s en adelante
    else if (currentTime >= 8.5) {
        frase1Container.classList.add("hidden");
        frase2Container.classList.add("hidden");
        frase3Container.classList.remove("hidden");
    }
    // Antes de las frases
    else {
        frase1Container.classList.add("hidden");
        frase2Container.classList.add("hidden");
        frase3Container.classList.add("hidden");
    }
}

function transitionToScene3() {
    videoHistoria.pause();
    initScene3();
}


// ==========================================================================
// ESCENA 3 - INVITACIÓN FINAL (TARJETA REGRESIVA - CON MARIPOSAS & PARTÍCULAS)
// ==========================================================================
function initScene3() {
    showScene(sceneFinal);
    startCountdown();
}


// ==========================================================================
// CONTADOR REGRESIVO (ZONA HORARIA ARGENTINA)
// ==========================================================================
function startCountdown() {
    if (countdownInterval) clearInterval(countdownInterval);

    function updateTimer() {
        const ahora = new Date().getTime();
        const distancia = FECHA_CUMPLE.getTime() - ahora;

        if (distancia < 0) {
            clearInterval(countdownInterval);
            countdownContainer.classList.add("hidden");
            countdownTodayText.classList.remove("hidden");
            return;
        }

        const dias = Math.floor(distancia / (1000 * 60 * 60 * 24));
        const horas = Math.floor((distancia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutos = Math.floor((distancia % (1000 * 60 * 60)) / (1000 * 60));
        const segundos = Math.floor((distancia % (1000 * 60)) / 1000);

        daysSpan.textContent = String(dias).padStart(2, "0");
        hoursSpan.textContent = String(horas).padStart(2, "0");
        minutesSpan.textContent = String(minutos).padStart(2, "0");
        secondsSpan.textContent = String(segundos).padStart(2, "0");
    }

    updateTimer();
    countdownInterval = setInterval(updateTimer, 1000);
}


// ==========================================================================
// MODAL RSVP (SISTEMA DE ASISTENCIA)
// ==========================================================================

// Abrir Modal
btnAbrirRsvp.addEventListener("click", () => {
    modalRsvp.classList.add("active");
    document.body.style.overflow = "hidden";
    
    if (WHATSAPP_NUMBER === "54911XXXXXXXX") {
        whatsappErrorMsg.classList.remove("hidden");
    } else {
        whatsappErrorMsg.classList.add("hidden");
    }
});

// Cerrar Modal
function closeModal() {
    modalRsvp.classList.remove("active");
    document.body.style.overflow = "";
}

btnCerrarRsvp.addEventListener("click", closeModal);

modalRsvp.addEventListener("click", (e) => {
    if (e.target === modalRsvp) {
        closeModal();
    }
});


// ==========================================================================
// ENVÍO DE CONFIRMACIÓN - MENSAJE DE WHATSAPP
// ==========================================================================
rsvpForm.addEventListener("submit", (e) => {
    e.preventDefault();

    if (WHATSAPP_NUMBER === "54911XXXXXXXX") {
        whatsappErrorMsg.classList.remove("hidden");
        whatsappErrorMsg.scrollIntoView({ behavior: "smooth" });
        return;
    }

    whatsappErrorMsg.classList.add("hidden");

    const name = document.getElementById("rsvp-name").value.trim();
    const adults = document.getElementById("rsvp-adults").value;
    const kids = document.getElementById("rsvp-kids").value;
    const message = document.getElementById("rsvp-message").value.trim();

    if (!name || adults === "" || kids === "") {
        alert("Por favor completá los campos obligatorios.");
        return;
    }

    const introMsg = `Hola, confirmo mi asistencia al cumpleaños de Maia.`;
    const detailsMsg = `Nombre: ${name}\nAdultos: ${adults}\nNiños: ${kids}`;
    const optMsg = message ? `\nMensaje: ${message}` : "";
    
    const textFinal = `${introMsg}\n\n${detailsMsg}${optMsg}`;
    const encodedText = encodeURIComponent(textFinal);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodedText}`;

    closeModal();
    rsvpForm.reset();
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
});


// ==========================================================================
// INICIALIZACIÓN COMPLETA
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    initOpeningScene();
});
