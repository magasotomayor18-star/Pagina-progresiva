# Informe de Auditoría de Accesibilidad (WCAG 2.2 AA), UX y Diseño Responsive

**Proyecto:** Fit Girl Studio  
**Fecha de auditoría:** 4 de octubre de 2026  
**Tipo de auditoría:** Auditoría técnica no destructiva e inspección estática y computada  
**Alcance analizado:** `index.html`, `assets/css/styles.css` (referenciado como `styles.css` en la consigna) y módulos JavaScript (`js/app.js`, `js/routines.js`, `js/storage.js`, `js/validation.js`, `sw.js` — nota: el archivo `script.js` no existe en el proyecto y su funcionalidad se distribuye en estos módulos).

---

## 1. Resumen Ejecutivo

La aplicación web **Fit Girl Studio** presenta una base técnica moderna y cuidada en aspectos esenciales de desarrollo web:
- Estructura semántica rica (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`, `<aside>`, `<form>`).
- Jerarquía de encabezados estrictamente ordenada (`<h1>` a `<h4>` sin saltos).
- Declaración de textos alternativos (`alt`) en todas las imágenes.
- Enlace de salto directo al contenido principal (`.skip-link`) visible con foco de teclado.
- Separación rigurosa de elementos interactivos (enlaces `<a>` para navegación y botones `<button type="button">` para acciones).
- Soporte para preferencias de usuario respecto a reducción de movimiento (`prefers-reduced-motion`).
- Sintaxis de JavaScript 100% limpia y funcional, validada mediante Node.js v24 sin errores sintácticos.

No obstante, la auditoría identificó **18 hallazgos** (3 críticos, 4 altos, 6 medios y 5 bajos) que comprometen el cumplimiento normativo **WCAG 2.2 Nivel AA**, la experiencia de usuario (UX) y la estabilidad visual responsive:
1. **Contraste insuficiente en llamadas a la acción principales:** El color de marca `--primary: #ec4899` con texto blanco `#ffffff` ofrece una relación de contraste de **3.53:1**, incumpliendo el mínimo de **4.5:1** exigido por WCAG 2.2 AA (SC 1.4.3) para texto normal en botones y filtros activos.
2. **Validación excluyente de campos opcionales en el formulario:** El campo de teléfono no es obligatorio en el HTML (`index.html`), pero el script `validation.js` exige obligatoriamente un valor no vacío, impidiendo el envío del formulario a usuarios que decidan no proporcionarlo.
3. **Desbordamiento horizontal (Overflow horizontal):** El uso de pseudo-elementos decorativos con ancho relativo `inset: 0 calc((100vw - 100%) / -2)` sin `overflow-x: hidden` en el documento genera un desborde lateral continuo de ~8.5 px en navegadores con barra de scroll vertical clásica.
4. **Saturación en lectores de pantalla:** La presencia de `aria-live="polite"` sobre el contenedor completo de la cuadrícula de ejercicios (`#exercises-container`) provoca la lectura forzada e ininterrumpida de decenas de tarjetas cada vez que se filtra o busca un ejercicio.
5. **Ergonomía táctil reducida y cabecera sobrecargada en móviles:** En resoluciones pequeñas (320 px y 398 px), la cabecera fija (`position: sticky`) sin menú hamburguesa ocupa hasta 145 px de altura (casi el 25% del alto de la pantalla), mientras los enlaces de navegación poseen una altura de 33 px y una separación de apenas 2.4 px, generando riesgo de pulsaciones erróneas.

A continuación, se detalla cada hallazgo con su severidad, evidencia de código, recomendaciones técnicas y el protocolo de pruebas de revalidación.

---

## 2. Hallazgos Críticos, Altos, Medios y Bajos

### Criterios que Cumplen (Conformidad Verificada)
* **Estructura semántica general (WCAG 1.3.1 - Nivel A):** Uso adecuado de marcas estructurales nativas HTML5 (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`, `<aside>`, `<form>`).
* **Jerarquía de encabezados (WCAG 1.3.1 - Nivel A):** Existe exactamente un único `<h1>` en la página, seguido secuencialmente por `<h2>`, `<h3>` y `<h4>` sin omisión de niveles.
* **Textos alternativos en imágenes (WCAG 1.1.1 - Nivel A):** Todas las etiquetas `<img>` estáticas y generadas dinámicamente contienen atributos `alt` contextuales y descriptivos.
* **Separación de roles botón vs. enlace (WCAG 4.1.2 - Nivel A):** Los enlaces `<a>` se reservan para navegación interna mediante anclas y los botones `<button>` gestionan eventos de interfaz con `type="button"` explícito.
* **Enlace de salto (WCAG 2.4.1 - Nivel A):** Se implementa `.skip-link` al inicio del documento, visible al recibir foco (`transform: translateY(0)`).
* **Etiquetado de formularios (WCAG 3.3.2 - Nivel A):** Todos los campos de formulario (`<input>`, `<select>`) cuentan con etiquetas `<label>` vinculadas mediante `for` e `id`.
* **Estados de selección en filtros (WCAG 4.1.2 - Nivel A):** Los botones de categorías implementan `aria-pressed="true|false"` y se agrupan bajo `role="group"` con `aria-label`.
* **Preferencia de reducción de movimiento (WCAG 2.3.3 - Nivel AAA):** La regla `@media (prefers-reduced-motion: reduce)` neutraliza transiciones y animaciones para usuarios con trastornos vestibulares.
* **Sintaxis de JavaScript:** Todos los módulos (`app.js`, `routines.js`, `storage.js`, `validation.js`, `sw.js`) compilan sin errores en Node.js v24 (`node --check`).

---

### Clasificación de Hallazgos Detectados

| ID | Severidad | Aspecto / Criterio Afectado | Resumen del Problema |
| :--- | :--- | :--- | :--- |
| **H-01** | **Crítico** | WCAG 1.4.3 Contraste Mínimo | Texto blanco sobre fondo rosa primario (`#ec4899`) presenta ratio **3.53:1** (mínimo exigido: 4.5:1). |
| **H-02** | **Crítico** | WCAG 3.3.2 / UX Formulario | Campo teléfono no es requerido en HTML pero `validation.js` bloquea el envío si está vacío. |
| **H-03** | **Crítico** | Diseño Responsive / WCAG 1.4.10 Reflow | `calc((100vw - 100%) / -2)` en fondos de sección genera scroll horizontal indeseado. |
| **H-04** | **Alto** | WCAG 4.1.3 Mensajes de Estado | `aria-live="polite"` en el contenedor `#exercises-container` satura el lector de pantalla con decenas de tarjetas. |
| **H-05** | **Alto** | WCAG 2.4.4 / 4.1.2 Nombres Accesibles | Botones "Repetir", "Modificar" y "Eliminar" en rutinas guardadas no identifican la rutina afectada. |
| **H-06** | **Alto** | WCAG 1.4.11 Contraste no Textual | Bordes de inputs (`#d1d5db` sobre blanco) tienen contraste **1.47:1** (mínimo exigido: 3:1). |
| **H-07** | **Alto** | WCAG 3.3.1 / 4.1.3 Interrupciones ARIA | `aria-live="assertive"` en mensajes de error del formulario interrumpe en cada pulsación de tecla (`input`). |
| **H-08** | **Medio** | WCAG 2.5.8 / UX Táctil Móvil | Enlaces de navegación móvil tienen altura de 33 px y separación de 2.4 px (riesgo de toque erróneo). |
| **H-09** | **Medio** | UX Móvil (320 px y 398 px) | Cabecera fija (`position: sticky`) sin colapsar ocupa 145 px de alto (~25% de la pantalla útil). |
| **H-10** | **Medio** | WCAG 2.5.3 / UX Favoritos | Texto visible de favoritos siempre es `"💖 Favorito"` y al eliminar muestra feedback engañoso `"✓ Agregado"`. |
| **H-11** | **Medio** | WCAG 1.4.3 Contraste Mínimo | Subtítulos `.section-heading > p` (`#6b7280`) sobre fondo `--bg-light` (`#fdf2f8`) tienen ratio **4.43:1** (< 4.5:1). |
| **H-12** | **Medio** | WCAG 3.1.2 Idioma de las Partes | Título principal `<h1>` en inglés dentro de página declarada con `<html lang="es">` sin atributo `lang="en"`. |
| **H-13** | **Medio** | UX / Core Web Vitals (CLS) | Imágenes sin atributos `width`/`height` intrínsecos ni `srcset` responsive para móviles. |
| **H-14** | **Bajo** | WCAG 2.4.13 Apariencia del Foco | Foco `:focus-visible` (`#7c2d12`) sobre fondo oscuro del footer (`#1f2937`) tiene contraste **1.57:1** (< 3:1). |
| **H-15** | **Bajo** | WCAG 2.4.3 Orden del Foco | Banner de cookies ubicado al final del DOM y oculta el foco reiniciándolo al `<body>` al interactuar. |
| **H-16** | **Bajo** | Buenas Prácticas WAI-ARIA | Atributo `aria-label` en elementos genéricos `<div>` sin rol de región (`hero-gallery` y `progress-summary`). |
| **H-17** | **Bajo** | PWA / Resiliencia Offline | Iconos en `manifest.json` referenciados a servicio externo `via.placeholder.com` inaccesible sin conexión. |
| **H-18** | **Bajo** | Organización de Archivos | Discrepancia entre la ruta esperada de la consigna (`script.js` y `styles.css` en raíz) y la estructura real. |

---

## 3. Evidencia Concreta

### Hallazgo H-01 (Crítico): Contraste insuficiente en botones primarios y filtros activos
* **Archivos afectados:**
  - `assets/css/styles.css` (líneas 3, 368-370, 476-480, 615-621).
  - `index.html` (líneas 53, 152, 230, 250).
  - `js/app.js` (líneas 253, 368, 429).
* **Elementos afectados:**
  - `.button-primary` ("Explorar Ejercicios", "Guardar mi rutina", "Enviar", "Aceptar", "Marcar entrenamiento como completado", "🔄 Repetir / Entrenar").
  - `.filter-button.is-active`, `.filter-button[aria-pressed="true"]`.
  - `.btn-add-routine`, `.exercise-card button[class*="routine"]`.
* **Evidencia técnica:**
  - Color de texto: `#ffffff` (luminancia 1.0).
  - Color de fondo: `--primary: #ec4899` (luminancia 0.247).
  - **Relación de contraste calculada:** **3.53:1**.
  - **Requisito WCAG 2.2 AA (SC 1.4.3):** Mínimo **4.5:1** para texto normal de 16 px (1 rem) con peso 750 (requiere 18.66 px para calificar como texto grande).

### Hallazgo H-02 (Crítico): Validación indebida de campo opcional que bloquea el formulario
* **Archivos afectados:**
  - `index.html` (líneas 214-217).
  - `js/validation.js` (líneas 13-16, 42-47, 55-62).
* **Elementos afectados:**
  - `<input id="phone" name="phone" type="tel">` y función `validateField` en `initValidation`.
* **Evidencia técnica:**
  - En `index.html`: el campo `<input id="phone">` **no posee** el atributo `required`.
  - En `js/validation.js` (línea 43):
    ```javascript
    const isValid = validate(input.value) && input.value.trim() !== "";
    ```
  - Al ejecutar `test_validation.js`, si el usuario deja el teléfono vacío, `isValid` devuelve `false`, se asigna `aria-invalid="true"`, se muestra el mensaje *"Ingresa un teléfono de 9 o 10 dígitos"* y en la línea 59 se ejecuta `event.preventDefault()`, impidiendo el envío.

### Hallazgo H-03 (Crítico): Desbordamiento horizontal por pseudo-elementos decorativos
* **Archivos afectados:**
  - `assets/css/styles.css` (líneas 35, 420-428).
* **Elementos afectados:**
  - `.exercises-section::before`, `.progress-section::before`, `.contact-section::before`.
* **Evidencia técnica:**
  - Regla CSS en línea 425:
    ```css
    inset: 0 calc((100vw - 100%) / -2);
    ```
  - En sistemas con barra de scroll vertical (como Windows Chrome, Edge, Firefox), `100vw` incluye el ancho de la barra (~17 px), mientras que `100%` del contenedor lo excluye.
  - El cálculo produce `(100vw - 100%) / -2 = -8.5px`, expandiendo el pseudo-elemento 8.5 px hacia la derecha fuera del viewport visible.
  - Al no haber `overflow-x: hidden` en `html`, `body` ni `.section`, la página genera una barra de desplazamiento horizontal persistente.

### Hallazgo H-04 (Alto): Invasión de lectura por `aria-live="polite"` en cuadrícula completa
* **Archivos afectados:**
  - `index.html` (líneas 107 y 190).
* **Elementos afectados:**
  - `<div id="exercises-container" class="exercise-grid" aria-live="polite">`
  - `<div id="favorites-container" class="exercise-grid" aria-live="polite">`
* **Evidencia técnica:**
  - En `js/app.js` (líneas 285-302), cada búsqueda o clic de categoría ejecuta `container.replaceChildren()` y agrega entre 1 y 20 elementos `<article class="exercise-card">`, cada uno con imagen, badges, título, párrafo descriptivo y dos botones.
  - Un contenedor completo marcado con `aria-live="polite"` encola la lectura íntegra de todos sus nodos hijos modificados, monopolizando el sintetizador de voz durante varios minutos.

### Hallazgo H-05 (Alto): Nombres accesibles genéricos en acciones de rutinas guardadas
* **Archivos afectados:**
  - `js/app.js` (líneas 429-475).
* **Elementos afectados:**
  - `trainButton` ("🔄 Repetir / Entrenar").
  - `modifyButton` ("✏️ Modificar").
  - `deleteButton` ("🗑️ Eliminar").
* **Evidencia técnica:**
  - Los botones se instancian como:
    ```javascript
    const deleteButton = createElement("button", "button button-outline", "🗑️ Eliminar");
    ```
  - No se define `aria-label`. Al navegar con lectores de pantalla mediante la lista de botones (rotor), el usuario escucha reiteradamente *"Eliminar, botón"*, *"Modificar, botón"*, sin contexto de a qué rutina corresponde cada uno.

### Hallazgo H-06 (Alto): Contraste deficiente de bordes en campos de formulario
* **Archivos afectados:**
  - `assets/css/styles.css` (líneas 444-450).
* **Elementos afectados:**
  - `#search-exercise`, `.form-field input`, `.form-field select`, `.routine-add-controls input`.
* **Evidencia técnica:**
  - Propiedad: `border: 1px solid #d1d5db;` sobre fondo `background: var(--white);` (`#ffffff`).
  - **Relación de contraste calculada:** **1.47:1**.
  - **Requisito WCAG 2.2 AA (SC 1.4.11):** Mínimo **3:1** para los límites visuales de componentes de interfaz que permiten al usuario identificar el área interactiva.

### Hallazgo H-07 (Alto): Interrupción constante por `aria-live="assertive"` en validación `input`
* **Archivos afectados:**
  - `index.html` (líneas 206, 211, 216, 228).
  - `js/validation.js` (líneas 49-51).
* **Elementos afectados:**
  - `<span class="error-msg" id="error-name" aria-live="assertive">` (y homólogos de email, phone, fitness-goal).
* **Evidencia técnica:**
  - Cada campo ya tiene `aria-describedby="error-[campo]"`.
  - En `validation.js`: `input.addEventListener("input", validateField)`. Al escribir la primera letra (longitud < 3), `aria-live="assertive"` interrumpe inmediatamente la pronunciación de la letra tecleada para anunciar el error a mitad de la escritura.

### Hallazgo H-08 (Medio): Objetivos táctiles comprimidos en navegación móvil
* **Archivos afectados:**
  - `assets/css/styles.css` (líneas 1023-1030).
* **Elementos afectados:**
  - `.main-navigation a` en media query `@media (max-width: 46rem)`.
* **Evidencia técnica:**
  - Padding: `0.4rem` (6.4 px) superior e inferior. Con `font-size: 0.8rem` (12.8 px) y `line-height: 1.6`, la altura total calculada es de **33.28 px**.
  - Separación horizontal y vertical: `gap: 0.15rem;` (**2.4 px**).
  - Aunque supera el mínimo absoluto de 24 px de WCAG 2.2 (SC 2.5.8), está sustancialmente por debajo de los **44 a 48 px** requeridos para una experiencia táctil fluida sin pulsaciones accidentales.

### Hallazgo H-09 (Medio): Cabecera fija desproporcionada en pantallas de 320 px y 398 px
* **Archivos afectados:**
  - `assets/css/styles.css` (líneas 90-103, 992-1003, 1013-1031).
* **Elementos afectados:**
  - `.site-header` (`position: sticky; top: 0;`).
* **Evidencia técnica:**
  - Al no implementarse menú colapsable (hamburguesa), los 6 enlaces de navegación envuelven en 2 o 3 líneas junto con la marca y el botón de instalación.
  - La altura total de la cabecera sticky alcanza entre **135 px y 145 px**. En un dispositivo móvil típico con 600 px de alto, consume el **24.1%** del espacio visual vertical de forma permanente.

### Hallazgo H-10 (Medio): Inconsistencia de etiqueta visual y feedback erróneo en favoritos
* **Archivos afectados:**
  - `js/app.js` (líneas 230-251).
* **Elementos afectados:**
  - `favoriteButton` en `renderExerciseCard`.
* **Evidencia técnica:**
  - Línea 233: `isFavorite ? "💖 Favorito" : "💖 Favorito"`. El texto visible no cambia nunca de estado.
  - Línea 249: al hacer clic sobre un ejercicio ya guardado para removerlo de favoritos, se ejecuta `showButtonFeedback(button, "✓ Agregado")`, comunicando falsamente que se ha agregado.

### Hallazgo H-11 (Medio): Contraste insuficiente en subtítulos de sección con fondo tintado
* **Archivos afectados:**
  - `assets/css/styles.css` (líneas 9, 410-412, 425-427).
* **Elementos afectados:**
  - `.section-heading > p:last-child` dentro de `.exercises-section`, `.progress-section` y `.contact-section`.
* **Evidencia técnica:**
  - Color de texto: `--text-muted: #6b7280` (luminancia 0.169).
  - Color de fondo: `--bg-light: #fdf2f8` (luminancia 0.932).
  - **Relación de contraste calculada:** **4.43:1**.
  - Incumple el umbral estricto de **4.5:1** para texto normal de tamaño 16 px.

### Hallazgo H-12 (Medio): Título principal en inglés sin cambio de idioma declarado
* **Archivos afectados:**
  - `index.html` (línea 48).
* **Elementos afectados:**
  - `<h1 id="hero-title">Are you ready to unleash your inner strength?</h1>`
* **Evidencia técnica:**
  - El documento raíz define `<html lang="es">`.
  - El texto del `<h1>` está en inglés pero carece del atributo `lang="en"`, lo que provoca que los sintetizadores de voz en español apliquen reglas fonéticas en castellano, distorsionando completamente la pronunciación.

### Hallazgo H-13 (Medio): Ausencia de dimensiones intrínsecas y responsive sizing en imágenes
* **Archivos afectados:**
  - `index.html` (líneas 61-72).
  - `js/app.js` (líneas 209-214).
* **Elementos afectados:**
  - Elementos `<img>` en hero gallery y en tarjetas de ejercicios.
* **Evidencia técnica:**
  - Ninguna imagen incluye atributos `width` o `height` en el marcado HTML, lo que provoca desplazamientos de diseño acumulados (CLS) durante la descarga inicial.
  - Las imágenes del hero solicitan anchos fijos de 1000 px y 700 px (`&w=1000`, `&w=700`) sin alternativas mediante `srcset` o `<picture>`.

### Hallazgo H-14 (Bajo): Bajo contraste del indicador de foco sobre superficies oscuras
* **Archivos afectados:**
  - `assets/css/styles.css` (líneas 68-72, 74-88, 918-927).
* **Elementos afectados:**
  - `:focus-visible` al enfocar `.skip-link` o `.site-footer a`.
* **Evidencia técnica:**
  - El color del outline es `#7c2d12` (marrón rojizo oscuro).
  - El fondo de `.site-footer` y `.skip-link` es `--text-dark: #1f2937`.
  - **Relación de contraste calculada:** **1.57:1** (< 3:1 exigido por WCAG 2.2 AA SC 2.4.13 para el indicador de foco contra su fondo adyacente).

### Hallazgo H-15 (Bajo): Orden de foco y pérdida de foco en el banner de cookies
* **Archivos afectados:**
  - `index.html` (línea 244).
  - `js/app.js` (líneas 618-624).
* **Elementos afectados:**
  - `<aside id="cookie-banner">` y botones `#accept-cookies` / `#decline-cookies`.
* **Evidencia técnica:**
  - El banner se encuentra posicionado al final del HTML, requiriendo decenas de tabulaciones para ser alcanzado por teclado.
  - Al pulsar cualquiera de los dos botones, se ejecuta `banner.hidden = true;` mientras el botón posee el foco, provocando que el navegador desplace el foco al elemento raíz `<body>`.

### Hallazgo H-16 (Bajo): Uso inadecuado de `aria-label` en contenedores genéricos `<div>`
* **Archivos afectados:**
  - `index.html` (líneas 59 y 165).
* **Elementos afectados:**
  - `<div class="hero-gallery" aria-label="Entrenamiento y bienestar">`
  - `<div class="progress-summary" aria-label="Resumen de actividad">`
* **Evidencia técnica:**
  - De acuerdo con la especificación WAI-ARIA 1.2, un elemento `<div>` estático sin rol semántico no constituye una región de navegación y la mayoría de los lectores de pantalla ignoran el `aria-label` o generan anuncios anómalos.

### Hallazgo H-17 (Bajo): Iconos PWA no almacenados localmente
* **Archivos afectados:**
  - `manifest.json` (líneas 9-20).
* **Elementos afectados:**
  - Array `icons` en el manifiesto web.
* **Evidencia técnica:**
  - Los iconos apuntan a `https://via.placeholder.com/...`. En modo offline o bajo bloqueadores de rastreo, los iconos no se renderizan al instalar la aplicación en el dispositivo.

### Hallazgo H-18 (Bajo): Ubicación de hojas de estilo y scripts auditados
* **Archivos afectados:**
  - Estructura de carpetas del proyecto.
* **Evidencia técnica:**
  - La hoja de estilo se encuentra en `assets/css/styles.css` (no en la raíz `./styles.css`).
  - El archivo `script.js` solicitado en la consigna no existe; la lógica se encuentra modularizada en `js/app.js`, `js/routines.js`, `js/storage.js`, `js/validation.js` y `sw.js`.

---

## 4. Recomendación de Corrección para Cada Hallazgo

### Corrección H-01 (Contraste en botones y filtros)
Ajustar el color `--primary` o crear una variable específica para fondos con texto blanco que garantice un ratio >= 4.5:1 (por ejemplo, `#be185d`, que otorga un ratio de **6.04:1**):
```css
/* assets/css/styles.css */
:root {
  --primary: #be185d; /* Modificado de #ec4899 para cumplir WCAG AA */
  --primary-light: #ec4899; /* Reservado para acentos decorativos */
}
```
*O alternativamente*, mantener `--primary: #ec4899` y oscurecer el fondo de botones sólidos a `#be185d` o `#9d174d`.

### Corrección H-02 (Validación de teléfono opcional)
En `js/validation.js`, condicionar la validación del campo de teléfono para que solo aplique si el usuario ha introducido contenido:
```javascript
// js/validation.js
const validateField = () => {
  const isRequired = input.hasAttribute("required");
  const value = input.value.trim();
  
  if (!isRequired && value === "") {
    input.setAttribute("aria-invalid", "false");
    errorMessage.textContent = "";
    return true;
  }
  
  const isValid = validate(input.value) && value !== "";
  input.setAttribute("aria-invalid", String(!isValid));
  errorMessage.textContent = isValid ? "" : definition.message;
  return isValid;
};
```

### Corrección H-03 (Eliminación de overflow horizontal)
Prevenir la expansión horizontal mediante `overflow-x: clip` en el documento o acotar el pseudo-elemento:
```css
/* assets/css/styles.css */
html, body {
  overflow-x: clip; /* Evita que el breakout lateral genere barra de scroll */
}

/* Opcionalmente ajustar el breakout a límites seguros: */
.exercises-section::before,
.progress-section::before,
.contact-section::before {
  inset: 0 calc(50% - 50vw);
  max-width: 100vw;
}
```

### Corrección H-04 (Control de regiones live en la biblioteca)
Remover `aria-live="polite"` de los contenedores de cuadrícula masivos y crear un elemento de estado conciso:
```html
<!-- index.html -->
<div class="exercise-controls">
  <!-- ... filtros ... -->
  <p id="exercises-live-status" class="visually-hidden" role="status" aria-live="polite"></p>
</div>
<div id="exercises-container" class="exercise-grid">
  <!-- tarjetas aquí sin aria-live -->
</div>
```
En `js/app.js`:
```javascript
// Actualizar únicamente el mensaje de conteo
const statusEl = document.querySelector("#exercises-live-status");
if (statusEl) {
  statusEl.textContent = `Se muestran ${visibleExercises.length} ejercicios.`;
}
```

### Corrección H-05 (Nombres accesibles contextuales en rutinas)
Añadir `aria-label` descriptivo con el nombre de la rutina en cada botón de acción:
```javascript
// js/app.js en renderSavedRoutines()
trainButton.setAttribute("aria-label", `Repetir o entrenar rutina: ${routine.nombre}`);
modifyButton.setAttribute("aria-label", `Modificar rutina: ${routine.nombre}`);
deleteButton.setAttribute("aria-label", `Eliminar rutina: ${routine.nombre}`);
```

### Corrección H-06 (Contraste de bordes de controles)
Incrementar el contraste del borde de inputs y selects a un tono que cumpla ratio >= 3:1 contra blanco (por ejemplo, `#64748b` o `#71717a`):
```css
/* assets/css/styles.css */
#search-exercise,
.form-field input,
.form-field select,
.routine-add-controls input,
.routine-add-controls select {
  border: 1.5px solid #6b7280; /* Ratio 4.83:1 contra blanco */
}
```

### Corrección H-07 (Gestión de alertas de error en formulario)
Eliminar `aria-live="assertive"` de los `<span class="error-msg">`. El enlace semántico `aria-describedby` ya comunica el error al enfocar el campo:
```html
<!-- index.html -->
<span class="error-msg" id="error-name"></span>
<!-- El span permanece vinculado mediante aria-describedby sin interrumpir el tecleo -->
```

### Corrección H-08 (Dimensiones táctiles en móviles)
Aumentar el padding y el tamaño del objetivo táctil en la navegación para pantallas móviles:
```css
/* assets/css/styles.css */
@media (max-width: 46rem) {
  .main-navigation ul {
    gap: 0.5rem;
  }
  .main-navigation a {
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    padding: 0.5rem 0.75rem;
    font-size: 0.85rem;
  }
}
```

### Corrección H-09 (Optimización de cabecera responsive)
Implementar un botón de apertura/cierre de menú (hamburguesa) en pantallas menores a 768 px:
```html
<!-- index.html -->
<button class="menu-toggle" id="menu-toggle" aria-expanded="false" aria-controls="main-menu" aria-label="Abrir menú de navegación">
  ☰
</button>
<nav class="main-navigation" id="main-menu" aria-label="Navegación principal">
  <!-- ... enlaces ... -->
</nav>
```

### Corrección H-10 (Etiquetado y feedback de favoritos)
Actualizar el texto visible del botón según el estado y corregir el mensaje de feedback:
```javascript
// js/app.js
const favoriteButton = createElement(
  "button",
  "button button-outline favorite-button",
  isFavorite ? "💖 Guardado" : "🤍 Guardar favorito"
);
// Al remover:
showButtonFeedback(button, isFavorite ? "✓ Eliminado" : "✓ Guardado");
```

### Corrección H-11 (Contraste de subtítulos)
Oscurecer la variable `--text-muted` a `#4b5563` (contraste **7.12:1** sobre blanco y **6.52:1** sobre `#fdf2f8`):
```css
/* assets/css/styles.css */
:root {
  --text-muted: #4b5563; /* Modificado de #6b7280 */
}
```

### Corrección H-12 (Idioma de partes en título principal)
Declarar el atributo `lang="en"` en el elemento `<h1>`:
```html
<!-- index.html -->
<h1 id="hero-title" lang="en">Are you ready to unleash your inner strength?</h1>
```

### Corrección H-13 (Dimensiones intrínsecas de imágenes)
Agregar atributos `width` y `height` en el HTML y en la creación dinámica:
```html
<!-- index.html -->
<img
  src="https://images.unsplash.com/..."
  alt="Deportista entrenando al aire libre"
  width="1000"
  height="667"
  fetchpriority="high"
>
```

### Corrección H-14 (Foco visible sobre fondos oscuros)
Definir un indicador de foco específico o un halo de doble contorno que garantice contraste en cualquier fondo:
```css
/* assets/css/styles.css */
.site-footer :focus-visible,
.skip-link:focus-visible {
  outline: 3px solid #f472b6; /* Contraste 5.5:1 contra #1f2937 */
  outline-offset: 4px;
}
```

### Corrección H-15 (Posicionamiento y gestión de foco en cookies)
Colocar el banner de cookies accesible al inicio del DOM y devolver el foco al elemento previo al cerrarlo:
```javascript
// js/app.js
let lastFocusedElement = null;
// Al mostrar el banner:
lastFocusedElement = document.activeElement;
// Al pulsar aceptar o declinar:
banner.hidden = true;
if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
  lastFocusedElement.focus();
}
```

### Corrección H-16 (Limpieza de roles y etiquetas en `<div>`)
Reemplazar los contenedores genéricos con etiquetas semánticas o retirar el `aria-label`:
```html
<!-- index.html -->
<section class="hero-gallery" aria-label="Galería visual de entrenamiento">
<!-- o simplemente <div class="hero-gallery"> sin aria-label si es puramente visual -->
```

### Corrección H-17 (Localización de iconos PWA)
Guardar los iconos en `assets/icons/icon-192.png` y `assets/icons/icon-512.png` e incluirlos en el caché estático del Service Worker (`STATIC_ASSETS` en `sw.js`).

### Corrección H-18 (Sincronización de nomenclatura de archivos)
Documentar formalmente en el proyecto o crear enlaces simbólicos/redirecciones si algún validador externo automatizado evalúa específicamente las rutas `./script.js` o `./styles.css` en la raíz.

---

## 5. Pruebas que Deberían Repetirse Después de Corregir los Problemas

Una vez implementadas las soluciones recomendadas, se debe ejecutar la siguiente batería de pruebas de regresión y validación:

### 1. Pruebas Automatizadas de Accesibilidad
- [ ] **Lighthouse Accessibility Audit:** Comprobar que la puntuación de Accesibilidad alcance 100/100 en Chrome DevTools.
- [ ] **Axe-core / WAVE:** Ejecutar análisis automático sobre la página en sus estados: estado inicial, catálogo con filtros activos, rutina con ejercicios añadidos y formulario con errores. Verificar cero violaciones de contraste y cero violaciones ARIA.

### 2. Verificación de Contraste Cromático
- [ ] **Herramienta Colour Contrast Analyser (CCA):**
  - Botones primarios (fondo vs. texto en reposo y hover).
  - Botones de filtro activos.
  - Subtítulos de sección sobre fondo `--bg-light`.
  - Bordes de inputs sobre fondo blanco.
  - Anillo de foco sobre fondo blanco y sobre el pie de página oscuro.

### 3. Navegación Estricta por Teclado y Foco
- [ ] **Recorrido secuencial Tab / Shift+Tab:**
  1. Verificar que el `.skip-link` aparece inmediatamente con la primera pulsación de Tab y que al presionar Enter el foco se traslada al contenido principal.
  2. Verificar que el foco nunca queda oculto detrás de la cabecera fija al desplazarse por anclas (`#ejercicios`, `#rutinas`, etc.).
  3. Navegar por los filtros y verificar activación con Enter y Barra Espaciadora.
  4. Agregar una rutina y verificar que los botones "Repetir", "Modificar" y "Eliminar" se enfocan secuencialmente.
  5. Cerrar el banner de cookies y comprobar que el foco no se pierde ni regresa al `<body>`.

### 4. Pruebas con Lectores de Pantalla (Screen Readers)
- [ ] **NVDA / JAWS (Windows) y VoiceOver (macOS / iOS):**
  - Escuchar el título `<h1>`: constatar que se pronuncia con voz en inglés gracias a `lang="en"`.
  - Al realizar una búsqueda en la biblioteca de ejercicios, verificar que no se anuncian las 20 tarjetas completas, sino únicamente el mensaje sintético de resultados.
  - Abrir la lista de botones de la página (Elements List): verificar que los botones de rutinas guardadas anuncian su contexto (*"Eliminar rutina Piernas, botón"*).
  - Interactuar con el botón de favoritos: verificar que anuncia claramente si el elemento está seleccionado o no.

### 5. Validación Funcional del Formulario
- [ ] **Envío con datos válidos sin teléfono:** Rellenar nombre, email y objetivo fitness dejando el teléfono vacío. Enviar el formulario y constatar que se procesa exitosamente sin bloquearse.
- [ ] **Envío con teléfono inválido:** Introducir letras o 5 dígitos en el teléfono. Constatar que se activa el mensaje de error y el foco se sitúa en el primer campo inválido.
- [ ] **Prueba de escritura:** Comprobar que al escribir en un campo no se interrumpe al lector de pantalla con mensajes de error prematuros antes de completar el valor o perder el foco.

### 6. Inspección de Diseño Responsive y Scroll
- [ ] **Resolución 320 px (móvil ultra compacto):**
  - Medir `document.documentElement.scrollWidth === document.documentElement.clientWidth` (verificar ausencia total de scrollbar horizontal).
  - Verificar que los objetivos táctiles del menú tienen al menos 44 px de altura.
  - Constatar que la cabecera no cubre más del 15% del alto de pantalla si se implementa el menú colapsable.
- [ ] **Resolución 398 px (móvil estándar):**
  - Verificar distribución de las tarjetas de ejercicios en columna única.
  - Comprobar padding horizontal uniforme de al menos 16 px.
- [ ] **Resolución 768 px (tablet):**
  - Comprobar que la cuadrícula de ejercicios pasa fluidamente a 2 columnas.
  - Comprobar que el formulario de contacto se distribuye en 2 columnas equilibradas.
- [ ] **Resolución de Escritorio (1280 px y 1440 px):**
  - Comprobar centrado de contenedor máximo (`max-width: 75rem`).
  - Constatar ausencia de desborde lateral con barra de scroll activa.

### 7. Pruebas de PWA y Resiliencia Offline
- [ ] Desconectar la red en el panel *Application > Service Workers > Offline*.
- [ ] Recargar la página: constatar que la aplicación carga desde el Service Worker, los ejercicios de respaldo se muestran y los iconos locales se renderizan correctamente.
