# Fit Girl Studio

Fit Girl Studio es una Progressive Web App (PWA) de fitness pensada para mujeres. Reúne una biblioteca de ejercicios, búsqueda y filtros, creación de rutinas personalizadas, favoritos y un resumen del historial de entrenamientos. La interfaz es adaptable a pantallas móviles y de escritorio y puede instalarse en navegadores compatibles.

## Estructura del proyecto

```text
.
├── index.html                 # Estructura semántica, navegación y puntos de montaje de la interfaz
├── manifest.json              # Metadatos para la instalación como PWA
├── sw.js                      # Precaché de recursos y respuesta offline
├── assets/
│   └── css/
│       └── styles.css         # Paleta, componentes, layouts responsive y estados accesibles
├── data/
│   └── ejercicios.json        # Catálogo local de ejercicios para respaldo
└── js/
    ├── app.js                 # Arranque, API, renderizado e integración de interacciones
    ├── routines.js            # Favoritos, rutinas, cálculos e historial de entrenamientos
    ├── storage.js             # Persistencia en localStorage, sessionStorage y cookie
    └── validation.js          # Validación accesible del formulario de contacto
```

### Responsabilidad de los módulos

- **`js/app.js`** inicializa la aplicación, consulta la API de ejercicios, carga respaldos, construye tarjetas y controla filtros, rutina, favoritos, progreso, consentimiento, estado de red, instalación y registro del Service Worker.
- **`js/routines.js`** implementa las operaciones de favoritos y rutinas y los cálculos estimados de duración y calorías. También registra entrenamientos completados.
- **`js/storage.js`** serializa las listas persistentes y provee funciones de lectura, escritura y eliminación. Los favoritos, rutinas e historial se guardan en `localStorage`; la categoría activa, en `sessionStorage`; el consentimiento también se conserva en `localStorage`.
- **`js/validation.js`** valida los campos del formulario en `input`, `blur` y `submit`, informa errores mediante texto y actualiza `aria-invalid`.
- **`data/ejercicios.json`** es el catálogo incluido con la aplicación. Se utiliza cuando la API no está disponible y no hay ejercicios en la caché local.
- **`sw.js`** almacena recursos y respuestas GET en Cache API para mejorar las cargas posteriores y ofrecer fallback cuando la red falla.

## Tecnologías

- **HTML5 semántico:** estructura por secciones, navegación, formularios y controles.
- **CSS Grid y Flexbox:** rejilla de tarjetas y layouts adaptables.
- **JavaScript ES6+:** módulos ES, funciones asíncronas, eventos y manipulación del DOM.
- **Fetch API:** consulta al endpoint público de ejercicios de Wger y lectura del JSON local.
- **JSON:** catálogo local, respuestas de la API, manifest y datos serializados de almacenamiento.
- **LocalStorage:** favoritos, rutinas, historial, catálogo en caché y elección del aviso de cookies.
- **SessionStorage:** última categoría elegida durante la sesión del navegador.
- **Cookie:** `fit_last_update` almacena la fecha del último entrenamiento o rutina guardada solo tras aceptar el consentimiento.
- **Service Worker y Cache API:** precaché de archivos de la PWA, caché de datos y soporte de respuestas sin conexión.
- **Web App Manifest:** nombre, apariencia, modo de visualización, orientación e iconos de la aplicación.

## Modo online y offline

### Con conexión

`loadExercises()` en `js/app.js` consulta `https://wger.de/api/v2/exerciseinfo/?limit=10`. La respuesta se adapta al formato de las tarjetas de Fit Girl Studio y se guarda en `localStorage` como caché de ejercicios. Si no hay conexión, la petición falla, devuelve un estado HTTP no exitoso o la respuesta no contiene ejercicios utilizables, la aplicación intenta cargar los ejercicios guardados y luego `data/ejercicios.json`.

El Service Worker usa `Network First with Cache Fallback` en las solicitudes GET: intenta la red, guarda respuestas exitosas en `fitgirl-static-v1` (recursos del mismo origen) o `fitgirl-data-v1` (solicitudes de datos, incluidas rutas `/api/`) y usa una copia guardada cuando la petición de red falla. Los errores HTTP no exitosos se tratan como fallo de red para poder buscar una respuesta previa en caché.

### Sin conexión

Al instalarse, el Service Worker precarga la página, los módulos, estilos, manifest y catálogo local. Si no hay red, sirve primero la respuesta exacta almacenada. Para navegación sin copia exacta intenta devolver `index.html`; para una solicitud sin respaldo responde con estado `503`. `app.js` además puede cargar ejercicios desde su caché de `localStorage` o desde `data/ejercicios.json`.

La primera carga de la aplicación requiere conectividad con el servidor para instalar el Service Worker y completar su precaché. La API externa depende de la disponibilidad del servicio y de que el navegador pueda acceder a ella. El uso de `localStorage` como respaldo de ejercicios y la Cache API del Service Worker son mecanismos distintos y complementarios.

## Accesibilidad y persistencia

- La interfaz proporciona navegación semántica, etiquetas asociadas a campos, mensajes de estado con `role="status"` y `aria-live`, nombres accesibles para botones y valores de `aria-pressed` en los filtros.
- Los errores de validación se asocian a cada campo con `aria-describedby`, `aria-invalid` y un contenedor de mensaje anunciado por tecnologías de asistencia.
- Se incluye un enlace para saltar al contenido y un estilo `:focus-visible` de alto contraste para identificar el foco al navegar con teclado.
- Los layouts y controles se adaptan a pantallas pequeñas; también se contempla `prefers-reduced-motion`.
- Los colores se eligieron para mantener contraste y legibilidad. **No se ha documentado una auditoría formal de contraste WCAG AA**; se recomienda comprobar el texto, estados, controles y componentes dinámicos con una herramienta de contraste antes de certificar conformidad.
- El aviso de cookies permite aceptar o rechazar y recuerda la elección en `localStorage`. `fit_last_update` solo se escribe cuando la elección es “Aceptar”; si se rechaza, se elimina esa cookie. Las preferencias y datos de entrenamiento guardados en `localStorage` son independientes de esa cookie.
- Favoritos, rutinas e historial permanecen en el almacenamiento local de ese navegador y dispositivo; no se sincronizan con un servidor.

## Ejecución local

La aplicación debe servirse por HTTP desde un servidor local: los módulos ES, las peticiones `fetch()` al JSON y los Service Workers no funcionan correctamente al abrir `index.html` directamente mediante `file://`. Los Service Workers requieren un contexto seguro (HTTPS o `localhost`).

Por ejemplo, si tienes Python instalado:

```bash
python -m http.server 8000
```

Ejecuta el comando desde la carpeta raíz del proyecto y visita <http://localhost:8000/>. También se puede usar cualquier servidor estático local que sirva los archivos manteniendo las rutas del árbol.

Para comprobar el modo offline:

1. Abre la página mediante `localhost` y espera a que termine la primera carga.
2. En las herramientas de desarrollo del navegador, confirma que `sw.js` se instaló y activó.
3. Cambia la red a offline y recarga; verifica la página, los estilos y el catálogo local.
4. Comprueba las acciones de favoritos y rutinas y revisa el estado de red mostrado por la aplicación.

## Despliegue en Neocities.org

1. Prueba primero el sitio servido en `localhost`, con la consola del navegador abierta y sin errores de carga.
2. En Neocities, abre el administrador de archivos del sitio y carga los archivos y carpetas del proyecto conservando exactamente esta estructura: `index.html`, `manifest.json`, `sw.js`, `assets/`, `data/` y `js/`.
3. Confirma que las rutas sean sensibles a mayúsculas y minúsculas y que la URL pública se sirva por HTTPS. HTTPS es necesario para el funcionamiento del Service Worker fuera de `localhost`.
4. Visita la URL del sitio, comprueba que el manifest y el Service Worker carguen sin errores y prueba una recarga después de la primera visita.
5. Prueba el flujo offline desde las herramientas del navegador. El precaché se completa durante la instalación del Service Worker; si se modifican recursos, aumenta las versiones `CACHE_NAME` y `DATA_CACHE_NAME` en `sw.js` para renovar las cachés existentes.

La configuración actual del manifest usa iconos remotos de ejemplo de `via.placeholder.com`. Para un despliegue final, conviene reemplazarlos por iconos PNG propios alojados dentro del sitio y actualizar las rutas del manifest.

## Consideraciones

- El formulario valida los datos en el cliente; no los envía ni almacena en un backend.
- Las calorías y la duración son estimaciones mostradas por ejercicio, no mediciones fisiológicas.
- La PWA no requiere un proceso de compilación ni dependencias de npm.
