const FAVORITES_KEY = "favorites";
const USER_ROUTINES_KEY = "user_routines";
const WORKOUT_HISTORY_KEY = "workout_history";
const EXERCISES_CACHE_KEY = "exercises_cache";
const ACTIVE_CATEGORY_KEY = "active_category";
const COOKIE_CONSENT_KEY = "cookie_consent";
const LAST_UPDATE_COOKIE = "fit_last_update";
const LAST_UPDATE_MAX_AGE = 60 * 60 * 24 * 365;

function readArrayFromLocalStorage(key) {
  const value = window.localStorage.getItem(key);

  if (value === null) {
    return [];
  }

  let parsedValue;
  try {
    parsedValue = JSON.parse(value);
  } catch (error) {
    throw new SyntaxError(`El valor guardado para "${key}" no contiene JSON válido.`, {
      cause: error,
    });
  }

  if (!Array.isArray(parsedValue)) {
    throw new TypeError(`El valor guardado para "${key}" debe ser un arreglo.`);
  }

  return parsedValue;
}

function writeArrayToLocalStorage(key, value) {
  if (!Array.isArray(value)) {
    throw new TypeError(`El valor para "${key}" debe ser un arreglo.`);
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function readCookie(name) {
  const cookiePrefix = `${name}=`;
  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(cookiePrefix));

  return cookie ? decodeURIComponent(cookie.slice(cookiePrefix.length)) : null;
}

function writeCookie(name, value) {
  const secureAttribute = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${LAST_UPDATE_MAX_AGE}; Path=/; SameSite=Lax${secureAttribute}`;
}

export function getFavorites() {
  return readArrayFromLocalStorage(FAVORITES_KEY);
}

export function saveFavorites(favorites) {
  writeArrayToLocalStorage(FAVORITES_KEY, favorites);
}

export function deleteFavorites() {
  window.localStorage.removeItem(FAVORITES_KEY);
}

export function getUserRoutines() {
  return readArrayFromLocalStorage(USER_ROUTINES_KEY);
}

export function saveUserRoutines(routines) {
  writeArrayToLocalStorage(USER_ROUTINES_KEY, routines);
}

export function deleteUserRoutines() {
  window.localStorage.removeItem(USER_ROUTINES_KEY);
}

export function getWorkoutHistory() {
  return readArrayFromLocalStorage(WORKOUT_HISTORY_KEY);
}

export function saveWorkoutHistory(workouts) {
  writeArrayToLocalStorage(WORKOUT_HISTORY_KEY, workouts);
}

export function deleteWorkoutHistory() {
  window.localStorage.removeItem(WORKOUT_HISTORY_KEY);
}

export function getCachedExercises() {
  return readArrayFromLocalStorage(EXERCISES_CACHE_KEY);
}

export function saveCachedExercises(exercises) {
  writeArrayToLocalStorage(EXERCISES_CACHE_KEY, exercises);
}

export function deleteCachedExercises() {
  window.localStorage.removeItem(EXERCISES_CACHE_KEY);
}

export function getCookieConsent() {
  return window.localStorage.getItem(COOKIE_CONSENT_KEY);
}

export function isCookieConsentAccepted() {
  return getCookieConsent() === "accepted";
}

export function saveCookieConsent(consent) {
  if (consent !== "accepted" && consent !== "declined") {
    throw new TypeError('El consentimiento debe ser "accepted" o "declined".');
  }

  window.localStorage.setItem(COOKIE_CONSENT_KEY, consent);
  if (consent === "declined") {
    deleteLastUpdate();
  }
}

export function deleteCookieConsent() {
  window.localStorage.removeItem(COOKIE_CONSENT_KEY);
}

export function getActiveCategory() {
  return window.sessionStorage.getItem(ACTIVE_CATEGORY_KEY);
}

export function saveActiveCategory(category) {
  if (typeof category !== "string") {
    throw new TypeError("La categoría activa debe ser un texto.");
  }

  window.sessionStorage.setItem(ACTIVE_CATEGORY_KEY, category);
}

export function deleteActiveCategory() {
  window.sessionStorage.removeItem(ACTIVE_CATEGORY_KEY);
}

export function getLastUpdate() {
  return readCookie(LAST_UPDATE_COOKIE);
}

export function saveLastUpdate(date = new Date()) {
  const timestamp = date instanceof Date ? date.toISOString() : date;

  if (typeof timestamp !== "string" || Number.isNaN(Date.parse(timestamp))) {
    throw new TypeError("La fecha de actualización debe ser una fecha válida.");
  }

  writeCookie(LAST_UPDATE_COOKIE, timestamp);
}

export function deleteLastUpdate() {
  document.cookie = `${LAST_UPDATE_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
}
