import {
  getActiveCategory,
  getCachedExercises,
  getCookieConsent,
  getFavorites,
  getUserRoutines,
  getWorkoutHistory,
  saveActiveCategory,
  saveCachedExercises,
  saveCookieConsent,
} from "./storage.js";
import {
  addExerciseToRoutine,
  createRoutine,
  deleteRoutine,
  registerCompletedWorkout,
  removeExerciseFromRoutine,
  saveRoutine,
  toggleFavorite,
  updateSavedRoutine,
} from "./routines.js";
import { initValidation } from "./validation.js";

const EXERCISES_API_URL = "https://wger.de/api/v2/exerciseinfo/?limit=10";
const FALLBACK_EXERCISES_URL = new URL("../data/ejercicios.json", import.meta.url);
const FALLBACK_EXERCISE_IMAGES = [
  "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80",
];
const FEEDBACK_DURATION_MS = 600;
const feedbackTimers = new WeakMap();

let exercises = [];
let activeRoutine = createRoutine("Mi rutina");
let editingRoutineId = null;
let deferredInstallPrompt = null;
let activeCategory = "Todos";
let searchTerm = "";

function normalizeExerciseCategory(exercise) {
  const category = typeof exercise.category === "string"
    ? exercise.category
    : exercise.category?.name ?? "";
  const searchableText = `${category} ${exercise.nombre} ${exercise.descripcion}`.toLowerCase();

  if (/pilates/.test(searchableText)) return "Pilates";
  if (/yoga/.test(searchableText)) return "Yoga";
  if (/dance|dancing|zumba/.test(searchableText)) return "Power Dance";
  if (/cardio|aerobic|endurance|running|cycling/.test(searchableText)) return "Cardio";
  return "Fuerza";
}

function getSafeImageUrl(image, fallbackImage) {
  if (typeof image !== "string" || image.trim() === "") {
    return fallbackImage;
  }

  try {
    const imageUrl = new URL(image, "https://wger.de");
    return imageUrl.protocol === "https:" ? imageUrl.href : fallbackImage;
  } catch {
    return fallbackImage;
  }
}

function stripHtml(html) {
  const parsedDocument = new DOMParser().parseFromString(html, "text/html");
  return parsedDocument.body.textContent.trim();
}

function mapApiExercise(apiExercise, index, fallbackImages) {
  const baseExercise = apiExercise.exercise_base && typeof apiExercise.exercise_base === "object"
    ? apiExercise.exercise_base
    : {};
  const translations = Array.isArray(apiExercise.translations) ? apiExercise.translations : [];
  const translation = translations.find((entry) => entry.language === 2) ?? translations[0] ?? {};
  const name = apiExercise.name || baseExercise.name || translation.name;
  const description = apiExercise.description || baseExercise.description || translation.description || "";

  if (typeof name !== "string" || name.trim() === "") {
    return null;
  }

  const images = apiExercise.images ?? baseExercise.images ?? [];
  const image = Array.isArray(images)
    ? images.find((entry) => typeof entry?.image === "string")?.image
    : apiExercise.image ?? baseExercise.image;
  const fallback = fallbackImages[index % fallbackImages.length];
  const id = Number(apiExercise.id ?? baseExercise.id);

  return {
    id: Number.isFinite(id) ? id : index + 1,
    nombre: name.trim(),
    categoria: normalizeExerciseCategory({
      category: apiExercise.category ?? baseExercise.category,
      nombre: name,
      descripcion: description,
    }),
    descripcion: stripHtml(description) || "Ejercicio de entrenamiento para añadir a tu sesión.",
    nivel: "Intermedio",
    duracion: "15 min",
    calorias: 120,
    imagen: getSafeImageUrl(image, fallback),
    etiqueta: "Nuevo",
  };
}

async function fetchJson(url) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 9000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`La solicitud a ${url} respondió con HTTP ${response.status}.`);
    }
    return await response.json();
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function loadBundledExercises() {
  const bundledExercises = await fetchJson(FALLBACK_EXERCISES_URL);

  if (!Array.isArray(bundledExercises) || bundledExercises.length === 0) {
    throw new TypeError("El archivo data/ejercicios.json no contiene ejercicios válidos.");
  }

  return bundledExercises;
}

export async function loadExercises() {
  try {
    if (!navigator.onLine) {
      throw new Error("No hay conexión a internet.");
    }

    const apiResponse = await fetchJson(EXERCISES_API_URL);

    if (!Array.isArray(apiResponse.results)) {
      throw new TypeError("La API de ejercicios no devolvió una lista de resultados.");
    }

    const mappedExercises = apiResponse.results
      .map((exercise, index) => mapApiExercise(exercise, index, FALLBACK_EXERCISE_IMAGES))
      .filter(Boolean);

    if (mappedExercises.length === 0) {
      throw new TypeError("La API de ejercicios no devolvió ejercicios utilizables.");
    }

    exercises = mappedExercises;
    try {
      saveCachedExercises(exercises);
    } catch (error) {
      console.error("No se pudo guardar la caché de ejercicios.", error);
    }
    return exercises;
  } catch (error) {
    console.warn("La API de ejercicios no está disponible; se usará una fuente de respaldo.", error);

    try {
      const cachedExercises = getCachedExercises();
      if (cachedExercises.length > 0) {
        exercises = cachedExercises;
        return exercises;
      }
    } catch (cacheError) {
      console.error("No se pudo leer la caché local de ejercicios.", cacheError);
    }

    try {
      exercises = await loadBundledExercises();
      return exercises;
    } catch (fallbackError) {
      console.error("No se pudieron cargar ejercicios de la API ni del archivo local.", fallbackError);
      throw new Error("No fue posible cargar los ejercicios. Comprueba tu conexión e inténtalo de nuevo.", {
        cause: fallbackError,
      });
    }
  }
}

function createElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function showButtonFeedback(button, label) {
  const previousTimer = feedbackTimers.get(button);
  if (previousTimer) window.clearTimeout(previousTimer);

  const originalLabel = button.dataset.originalLabel ?? button.textContent;
  button.dataset.originalLabel = originalLabel;
  button.textContent = label;
  button.classList.add("is-added");

  const timer = window.setTimeout(() => {
    button.textContent = originalLabel;
    button.classList.remove("is-added");
    feedbackTimers.delete(button);
  }, FEEDBACK_DURATION_MS);
  feedbackTimers.set(button, timer);
}

function renderExerciseCard(exercise, isFavorite = false) {
  const card = createElement("article", "exercise-card");
  card.dataset.exerciseId = String(exercise.id);
  const image = createElement("img");
  image.src = exercise.imagen;
  image.alt = `${exercise.nombre}: entrenamiento ${exercise.categoria}`;
  image.loading = "lazy";
  image.decoding = "async";
  image.width = 800;
  image.height = 600;
  card.append(image);

  const content = createElement("div", "exercise-card-content");
  const badges = createElement("div", "exercise-badges");
  badges.append(
    createElement("span", "exercise-category", exercise.categoria),
    createElement("span", "exercise-level", exercise.nivel),
    createElement("span", "exercise-badge", exercise.etiqueta),
  );
  content.append(
    badges,
    createElement("h3", "", exercise.nombre),
    createElement("p", "", exercise.descripcion),
    createElement("p", "exercise-details", `${exercise.duracion} · ${exercise.calorias} kcal`),
  );

  const favoriteButton = createElement(
    "button",
    "button button-outline favorite-button",
    isFavorite ? "💖 Guardado" : "🤍 Guardar favorito",
  );
  favoriteButton.type = "button";
  favoriteButton.setAttribute("aria-pressed", String(isFavorite));
  favoriteButton.setAttribute(
    "aria-label",
    `${isFavorite ? "Quitar de" : "Añadir a"} favoritos: ${exercise.nombre}`,
  );
  favoriteButton.addEventListener("click", () => {
    toggleFavorite(exercise);
    renderFavorites();
    renderExerciseLibrary();
    const feedback = isFavorite ? "✓ Eliminado" : "✓ Agregado";
    const matchingButtons = document.querySelectorAll(
      `.exercise-card[data-exercise-id="${CSS.escape(String(exercise.id))}"] .favorite-button`,
    );
    for (const button of matchingButtons) {
      showButtonFeedback(button, feedback);
    }
  });

  const addButton = createElement("button", "button button-secondary btn-add-routine", "Agregar a Rutina");
  addButton.type = "button";
  addButton.setAttribute("aria-label", `Agregar ${exercise.nombre} a mi rutina`);
  addButton.addEventListener("click", () => {
    const sets = Number(document.querySelector("#routine-sets").value);
    const repetitions = Number(document.querySelector("#routine-reps").value);

    try {
      activeRoutine = addExerciseToRoutine(activeRoutine, exercise, sets, repetitions);
      renderActiveRoutine();
      showButtonFeedback(addButton, "✓ Agregado");
    } catch (error) {
      showFeedback("routine-feedback", error.message, true);
    }
  });

  content.append(favoriteButton, addButton);
  card.append(content);
  return card;
}

function matchesExerciseFilters(exercise) {
  const matchesCategory = activeCategory === "Todos" || exercise.categoria === activeCategory;
  const query = searchTerm.toLocaleLowerCase();
  const matchesSearch = !query
    || `${exercise.nombre} ${exercise.categoria} ${exercise.descripcion}`
      .toLocaleLowerCase()
      .includes(query);

  return matchesCategory && matchesSearch;
}

function renderExerciseLibrary() {
  const container = document.querySelector("#exercises-container");
  if (!container) return;

  const favorites = getFavorites();
  const visibleExercises = exercises.filter(matchesExerciseFilters);
  const liveStatus = document.querySelector("#exercises-live-status");
  if (liveStatus) {
    liveStatus.textContent = `Se muestran ${visibleExercises.length} ejercicios`;
  }
  container.replaceChildren();

  if (visibleExercises.length === 0) {
    container.append(createElement("p", "", "No encontramos ejercicios con esos filtros."));
    return;
  }

  for (const exercise of visibleExercises) {
    const isFavorite = favorites.some((favorite) => favorite.id === exercise.id);
    container.append(renderExerciseCard(exercise, isFavorite));
  }
}

function renderFavorites() {
  const container = document.querySelector("#favorites-container");
  if (!container) return;

  const favorites = getFavorites();
  container.replaceChildren();

  if (favorites.length === 0) {
    container.append(createElement("p", "", "Todavía no tienes favoritos. Guarda un ejercicio de la biblioteca para verlo aquí."));
    return;
  }

  for (const exercise of favorites) {
    container.append(renderExerciseCard(exercise, true));
  }
}

function populateRoutineExerciseSelect() {
  const select = document.querySelector("#routine-exercise-select");
  if (!select) return;

  select.replaceChildren(new Option("Selecciona un ejercicio", ""));
  for (const exercise of exercises) {
    select.add(new Option(`${exercise.nombre} · ${exercise.categoria}`, String(exercise.id)));
  }
}

function renderActiveRoutine() {
  const container = document.querySelector("#routine-exercises");
  if (!container) return;

  container.replaceChildren();
  if (activeRoutine.ejercicios.length === 0) {
    container.append(createElement("p", "", "Aún no has agregado ejercicios. Explora la biblioteca para empezar."));
    return;
  }

  const list = createElement("ul", "routine-exercise-list");
  activeRoutine.ejercicios.forEach((entry) => {
    const item = createElement("li", "routine-exercise-item");
    const details = createElement(
      "span",
      "",
      `${entry.ejercicio.nombre} — ${entry.series} series × ${entry.repeticiones} repeticiones`,
    );
    const removeButton = createElement("button", "button button-outline", "Quitar");
    removeButton.type = "button";
    removeButton.setAttribute("aria-label", `Quitar ${entry.ejercicio.nombre} de la rutina`);
    removeButton.addEventListener("click", () => {
      activeRoutine = removeExerciseFromRoutine(activeRoutine, entry.ejercicio.id);
      renderActiveRoutine();
    });
    item.append(details, removeButton);
    list.append(item);
  });

  const summary = createElement(
    "p",
    "routine-estimate",
    `Estimado: ${activeRoutine.duracion} · ${activeRoutine.calorias} kcal`,
  );
  container.append(list, summary);

  if (!container.querySelector("#complete-workout")) {
    const completeButton = createElement("button", "button button-primary", "Marcar entrenamiento como completado");
    completeButton.id = "complete-workout";
    completeButton.type = "button";
    completeButton.addEventListener("click", () => {
      try {
        const workout = registerCompletedWorkout(activeRoutine);
        renderProgress();
        showFeedback("routine-feedback", `${workout.nombre}: entrenamiento registrado.`);
      } catch (error) {
        showFeedback("routine-feedback", error.message, true);
      }
    });
    container.append(completeButton);
  }
}

function ensureSavedRoutinesContainer() {
  const routineSave = document.querySelector(".routine-save");
  if (!routineSave || document.querySelector("#rutinas-guardadas")) return;

  const section = createElement("section", "saved-routines");
  section.id = "rutinas-guardadas";
  section.setAttribute("aria-labelledby", "saved-routines-title");
  const heading = createElement("h3", "", "Rutinas guardadas");
  heading.id = "saved-routines-title";
  const list = createElement("div", "saved-routines-list");
  list.id = "saved-routines-list";
  section.append(heading, list);
  routineSave.after(section);
}

function renderSavedRoutines() {
  const container = document.querySelector("#saved-routines-list");
  if (!container) return;

  container.replaceChildren();
  const routines = getUserRoutines();
  if (routines.length === 0) {
    container.append(createElement("p", "", "Aún no has guardado rutinas."));
    return;
  }

  for (const routine of routines) {
    const card = createElement("article", "saved-routine-card");
    const heading = createElement("h4", "", routine.nombre);
    const summary = createElement(
      "p",
      "saved-routine-summary",
      `${routine.duracion} estimados · ${routine.calorias} kcal`,
    );
    const exerciseList = createElement("ul", "saved-routine-exercises");

    for (const entry of routine.ejercicios) {
      exerciseList.append(createElement(
        "li",
        "",
        `${entry.ejercicio.nombre} — ${entry.series} series × ${entry.repeticiones} repeticiones`,
      ));
    }

    const actions = createElement("div", "saved-routine-actions");
    const trainButton = createElement("button", "button button-primary", "🔄 Repetir / Entrenar");
    trainButton.type = "button";
    trainButton.setAttribute("aria-label", `Repetir o entrenar rutina: ${routine.nombre}`);
    trainButton.addEventListener("click", () => {
      if (routine.ejercicios.length === 0) {
        showFeedback("routine-feedback", "Agrega ejercicios a esta rutina antes de entrenar.", true);
        return;
      }

      activeRoutine = { ...routine, ejercicios: routine.ejercicios.map((entry) => ({ ...entry })) };
      editingRoutineId = routine.id;
      document.querySelector("#routine-name").value = routine.nombre;
      renderActiveRoutine();
      try {
        const workout = registerCompletedWorkout(routine);
        renderProgress();
        showFeedback("routine-feedback", `${workout.nombre}: entrenamiento registrado.`);
      } catch (error) {
        showFeedback("routine-feedback", error.message, true);
      }
    });

    const modifyButton = createElement("button", "button button-secondary", "✏️ Modificar");
    modifyButton.type = "button";
    modifyButton.setAttribute("aria-label", `Modificar rutina: ${routine.nombre}`);
    modifyButton.addEventListener("click", () => {
      activeRoutine = { ...routine, ejercicios: routine.ejercicios.map((entry) => ({ ...entry })) };
      editingRoutineId = routine.id;
      document.querySelector("#routine-name").value = routine.nombre;
      renderActiveRoutine();
      document.querySelector("#rutinas").scrollIntoView({ behavior: "smooth" });
    });

    const deleteButton = createElement("button", "button button-outline", "🗑️ Eliminar");
    deleteButton.type = "button";
    deleteButton.setAttribute("aria-label", `Eliminar rutina: ${routine.nombre}`);
    deleteButton.addEventListener("click", () => {
      deleteRoutine(routine.id);
      if (String(editingRoutineId) === String(routine.id)) {
        editingRoutineId = null;
        activeRoutine = createRoutine("Mi rutina");
        document.querySelector("#routine-name").value = "";
        renderActiveRoutine();
      }
      renderSavedRoutines();
      showFeedback("routine-feedback", `Rutina "${routine.nombre}" eliminada.`);
    });

    actions.append(trainButton, modifyButton, deleteButton);
    card.append(heading, summary, exerciseList, actions);
    container.append(card);
  }
}

function renderProgress() {
  const history = getWorkoutHistory();
  const workoutsCount = document.querySelector("#workouts-count");
  const minutesCount = document.querySelector("#minutes-count");
  const caloriesCount = document.querySelector("#calories-count");
  const historyContainer = document.querySelector("#workouts-history");

  if (workoutsCount) workoutsCount.textContent = String(history.length);
  if (minutesCount) {
    minutesCount.textContent = String(history.reduce(
      (total, workout) => total + (Number.parseFloat(workout.duracion) || 0),
      0,
    ));
  }
  if (caloriesCount) {
    caloriesCount.textContent = String(history.reduce(
      (total, workout) => total + (Number(workout.calorias) || 0),
      0,
    ));
  }

  if (!historyContainer) return;
  historyContainer.replaceChildren();
  if (history.length === 0) {
    historyContainer.append(createElement("p", "", "Tus entrenamientos completados aparecerán aquí."));
    return;
  }

  const list = createElement("ul", "workout-history-list");
  [...history].reverse().forEach((workout) => {
    const date = new Date(workout.completedAt);
    const formattedDate = Number.isNaN(date.getTime())
      ? "Fecha no disponible"
      : new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(date);
    list.append(createElement(
      "li",
      "",
      `${workout.nombre} · ${formattedDate} · ${workout.duracion} · ${workout.calorias} kcal`,
    ));
  });
  historyContainer.append(list);
}

function showFeedback(elementId, message, isError = false) {
  const element = document.querySelector(`#${elementId}`);
  if (!element) return;

  element.textContent = message;
  element.classList.toggle("feedback-error", isError);
}

function initExerciseFilters() {
  const savedCategory = getActiveCategory();
  const validCategories = ["Todos", "Pilates", "Power Dance", "Fuerza", "Yoga", "Cardio"];
  activeCategory = validCategories.includes(savedCategory) ? savedCategory : "Todos";

  for (const button of document.querySelectorAll(".filter-button")) {
    const isActive = button.dataset.category === activeCategory;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category;
      saveActiveCategory(activeCategory);
      for (const filterButton of document.querySelectorAll(".filter-button")) {
        const selected = filterButton === button;
        filterButton.classList.toggle("is-active", selected);
        filterButton.setAttribute("aria-pressed", String(selected));
      }
      renderExerciseLibrary();
    });
  }

  document.querySelector("#search-exercise")?.addEventListener("input", (event) => {
    searchTerm = event.currentTarget.value.trim();
    renderExerciseLibrary();
  });
}

function initRoutineBuilder() {
  document.querySelector("#add-to-routine")?.addEventListener("click", () => {
    const selectedId = document.querySelector("#routine-exercise-select").value;
    const exercise = exercises.find((item) => String(item.id) === selectedId);

    if (!exercise) {
      showFeedback("routine-feedback", "Selecciona un ejercicio para agregar.", true);
      return;
    }

    try {
      activeRoutine = addExerciseToRoutine(
        activeRoutine,
        exercise,
        Number(document.querySelector("#routine-sets").value),
        Number(document.querySelector("#routine-reps").value),
      );
      renderActiveRoutine();
      showButtonFeedback(document.querySelector("#add-to-routine"), "✓ Agregado");
      showFeedback("routine-feedback", `${exercise.nombre} agregado a la rutina.`);
    } catch (error) {
      showFeedback("routine-feedback", error.message, true);
    }
  });

  document.querySelector("#save-routine")?.addEventListener("click", () => {
    const nameInput = document.querySelector("#routine-name");

    try {
      const isEditingRoutine = editingRoutineId !== null;
      activeRoutine.nombre = nameInput.value.trim();
      const savedRoutine = !isEditingRoutine
        ? saveRoutine(activeRoutine)
        : updateSavedRoutine({ ...activeRoutine, id: editingRoutineId });
      activeRoutine = { ...savedRoutine, ejercicios: savedRoutine.ejercicios.map((entry) => ({ ...entry })) };
      editingRoutineId = isEditingRoutine ? savedRoutine.id : null;
      renderSavedRoutines();
      showFeedback(
        "routine-feedback",
        `Rutina "${savedRoutine.nombre}" ${isEditingRoutine ? "actualizada" : "guardada"}.`,
      );
    } catch (error) {
      showFeedback("routine-feedback", error.message, true);
    }
  });
}

function initCookies() {
  const banner = document.querySelector("#cookie-banner");
  if (!banner) return;
  let lastFocusedElement = document.activeElement;

  document.addEventListener("focusin", (event) => {
    if (!banner.contains(event.target)) {
      lastFocusedElement = event.target;
    }
  });

  const initializeBanner = () => {
    const consent = window.localStorage.getItem("cookies_accepted");
    const hasResponded = consent === "true" || consent === "false";
    banner.classList.toggle("is-hidden", hasResponded);
    banner.hidden = hasResponded;

    const closeBanner = () => {
      banner.classList.add("is-hidden");
      banner.hidden = true;
      if (lastFocusedElement instanceof HTMLElement && lastFocusedElement.isConnected) {
        lastFocusedElement.focus();
      }
    };

    document.querySelector("#accept-cookies")?.addEventListener("click", () => {
      window.localStorage.setItem("cookies_accepted", "true");
      saveCookieConsent("accepted");
      closeBanner();
    });
    document.querySelector("#decline-cookies")?.addEventListener("click", () => {
      window.localStorage.setItem("cookies_accepted", "false");
      saveCookieConsent("declined");
      closeBanner();
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeBanner, { once: true });
  } else {
    initializeBanner();
  }
}

function initNetworkStatus() {
  const status = document.querySelector("#network-status");
  if (!status) return;

  const updateStatus = () => {
    const online = navigator.onLine;
    status.classList.toggle("online", online);
    status.classList.toggle("offline", !online);
    status.textContent = online ? "Conectada" : "⚡ Modo Offline";
  };

  window.addEventListener("online", updateStatus);
  window.addEventListener("offline", updateStatus);
  updateStatus();
}

function initInstallPrompt() {
  const installButton = document.querySelector("#btn-install");
  if (!installButton) return;

  installButton.hidden = true;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    installButton.hidden = false;
  });

  installButton.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    try {
      await deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
    } catch (error) {
      console.error("No se pudo iniciar la instalación de Fit Girl Studio.", error);
    } finally {
      deferredInstallPrompt = null;
      installButton.hidden = true;
    }
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    installButton.hidden = true;
  });
}

function initContactForm() {
  const form = document.querySelector("#contact-form");
  if (!form) return;

  initValidation(form);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (form.querySelector('[aria-invalid="true"]')) return;

    showFeedback("contact-feedback", "Gracias. Tus datos se validaron correctamente.");
    form.reset();
    for (const field of form.querySelectorAll("[aria-invalid]")) {
      field.setAttribute("aria-invalid", "false");
    }
  });
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  try {
    await navigator.serviceWorker.register("./sw.js");
  } catch (error) {
    console.error("No se pudo registrar el Service Worker.", error);
  }
}

async function initApp() {
  initNetworkStatus();
  initInstallPrompt();
  initCookies();
  initContactForm();
  initExerciseFilters();
  initRoutineBuilder();
  ensureSavedRoutinesContainer();
  const serviceWorkerRegistration = registerServiceWorker();

  try {
    exercises = await loadExercises();
    populateRoutineExerciseSelect();
    renderExerciseLibrary();
  } catch (error) {
    const container = document.querySelector("#exercises-container");
    if (container) {
      container.replaceChildren(createElement("p", "feedback-error", error.message));
    }
  }

  renderFavorites();
  renderActiveRoutine();
  renderSavedRoutines();
  renderProgress();
  await serviceWorkerRegistration;
}

initApp().catch((error) => {
  console.error("No se pudo inicializar Fit Girl Studio.", error);
  const container = document.querySelector("#exercises-container");
  if (container) {
    container.replaceChildren(createElement("p", "feedback-error", "Ocurrió un error al iniciar la aplicación."));
  }
});
