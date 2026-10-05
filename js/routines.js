import {
  getFavorites,
  getUserRoutines,
  getWorkoutHistory,
  isCookieConsentAccepted,
  saveFavorites,
  saveLastUpdate,
  saveUserRoutines,
  saveWorkoutHistory,
} from "./storage.js";

function validateExercise(exercise) {
  if (!exercise || (typeof exercise.id !== "number" && typeof exercise.id !== "string")) {
    throw new TypeError("El ejercicio debe incluir un identificador numérico o de texto.");
  }

  if (typeof exercise.nombre !== "string" || exercise.nombre.trim() === "") {
    throw new TypeError("El ejercicio debe incluir un nombre.");
  }
}

function trackChange(date = new Date()) {
  if (isCookieConsentAccepted()) {
    saveLastUpdate(date);
  }
}

function parseExerciseMinutes(exercise) {
  const duration = Number.parseFloat(exercise.duracion);
  return Number.isFinite(duration) && duration >= 0 ? duration : 0;
}

function parseExerciseCalories(exercise) {
  const calories = Number(exercise.calorias);
  return Number.isFinite(calories) && calories >= 0 ? calories : 0;
}

function validatePositiveInteger(value, fieldName) {
  if (!Number.isInteger(value) || value < 1) {
    throw new TypeError(`${fieldName} debe ser un número entero mayor que cero.`);
  }
}

export function addFavorite(exercise) {
  validateExercise(exercise);
  const favorites = getFavorites();

  if (favorites.some((favorite) => favorite.id === exercise.id)) {
    return favorites;
  }

  const updatedFavorites = [...favorites, exercise];
  saveFavorites(updatedFavorites);
  trackChange();
  return updatedFavorites;
}

export function removeFavorite(exerciseId) {
  const favorites = getFavorites();
  const updatedFavorites = favorites.filter((favorite) => favorite.id !== exerciseId);

  if (updatedFavorites.length !== favorites.length) {
    saveFavorites(updatedFavorites);
    trackChange();
  }

  return updatedFavorites;
}

export function toggleFavorite(exercise) {
  validateExercise(exercise);
  const isFavorite = getFavorites().some((favorite) => favorite.id === exercise.id);

  return {
    isFavorite: !isFavorite,
    favorites: isFavorite ? removeFavorite(exercise.id) : addFavorite(exercise),
  };
}

export function createRoutine(name, exercises = []) {
  if (typeof name !== "string" || name.trim() === "") {
    throw new TypeError("La rutina debe tener un nombre.");
  }

  if (!Array.isArray(exercises)) {
    throw new TypeError("Los ejercicios de la rutina deben ser un arreglo.");
  }

  const routine = {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    nombre: name.trim(),
    ejercicios: [],
    duracion: "0 min",
    calorias: 0,
    createdAt: new Date().toISOString(),
  };

  for (const entry of exercises) {
    const exercise = entry.ejercicio ?? entry.exercise ?? entry;
    routine.ejercicios.push(createRoutineExercise(
      exercise,
      entry.series ?? entry.sets ?? 3,
      entry.repeticiones ?? entry.repetitions ?? 12,
    ));
  }

  return updateRoutineEstimates(routine);
}

export function createRoutineExercise(exercise, series = 3, repeticiones = 12) {
  validateExercise(exercise);
  validatePositiveInteger(series, "Las series");
  validatePositiveInteger(repeticiones, "Las repeticiones");

  return {
    ejercicio: { ...exercise },
    series,
    repeticiones,
  };
}

function updateRoutineEstimates(routine) {
  const totalMinutes = calculateRoutineDuration(routine);

  return {
    ...routine,
    duracion: `${totalMinutes} min`,
    calorias: calculateRoutineCalories(routine),
  };
}

export function addExerciseToRoutine(routine, exercise, series = 3, repeticiones = 12) {
  if (!routine || !Array.isArray(routine.ejercicios)) {
    throw new TypeError("La rutina debe contener una lista de ejercicios.");
  }

  const entry = createRoutineExercise(exercise, series, repeticiones);
  return updateRoutineEstimates({
    ...routine,
    ejercicios: [...routine.ejercicios, entry],
  });
}

export function removeExerciseFromRoutine(routine, exerciseId) {
  if (!routine || !Array.isArray(routine.ejercicios)) {
    throw new TypeError("La rutina debe contener una lista de ejercicios.");
  }

  return updateRoutineEstimates({
    ...routine,
    ejercicios: routine.ejercicios.filter((entry) => entry.ejercicio.id !== exerciseId),
  });
}

export function calculateRoutineDuration(routine) {
  if (!routine || !Array.isArray(routine.ejercicios)) {
    throw new TypeError("La rutina debe contener una lista de ejercicios.");
  }

  return routine.ejercicios.reduce(
    (total, entry) => total + parseExerciseMinutes(entry.ejercicio),
    0,
  );
}

export function calculateRoutineCalories(routine) {
  if (!routine || !Array.isArray(routine.ejercicios)) {
    throw new TypeError("La rutina debe contener una lista de ejercicios.");
  }

  return routine.ejercicios.reduce(
    (total, entry) => total + parseExerciseCalories(entry.ejercicio),
    0,
  );
}

export function saveRoutine(routine) {
  if (!routine || typeof routine.nombre !== "string" || !Array.isArray(routine.ejercicios)) {
    throw new TypeError("La rutina debe tener nombre y una lista de ejercicios.");
  }

  const routines = getUserRoutines();
  let id = Date.now();
  while (routines.some((savedRoutine) => String(savedRoutine.id) === String(id))) {
    id += 1;
  }

  const savedRoutine = updateRoutineEstimates({
    ...routine,
    id,
    nombre: routine.nombre.trim(),
    createdAt: routine.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  routines.push(savedRoutine);
  saveUserRoutines(routines);
  trackChange(new Date(savedRoutine.updatedAt));
  return savedRoutine;
}

export function updateSavedRoutine(routine) {
  if (
    !routine
    || (typeof routine.id !== "number" && typeof routine.id !== "string")
    || typeof routine.nombre !== "string"
    || !Array.isArray(routine.ejercicios)
  ) {
    throw new TypeError("La rutina a modificar debe tener id, nombre y una lista de ejercicios.");
  }

  const routines = getUserRoutines();
  const existingIndex = routines.findIndex(
    (savedRoutine) => String(savedRoutine.id) === String(routine.id),
  );

  if (existingIndex === -1) {
    throw new Error("No se encontró la rutina que intentas modificar.");
  }

  const updatedRoutine = updateRoutineEstimates({
    ...routine,
    nombre: routine.nombre.trim(),
    updatedAt: new Date().toISOString(),
  });
  routines[existingIndex] = updatedRoutine;
  saveUserRoutines(routines);
  trackChange(new Date(updatedRoutine.updatedAt));
  return updatedRoutine;
}

export function deleteRoutine(routineId) {
  const routines = getUserRoutines();
  const updatedRoutines = routines.filter(
    (routine) => String(routine.id) !== String(routineId),
  );

  if (updatedRoutines.length !== routines.length) {
    saveUserRoutines(updatedRoutines);
    trackChange();
  }

  return updatedRoutines;
}

export function registerCompletedWorkout(routineOrExercises, completedAt = new Date()) {
  if (!(completedAt instanceof Date) || Number.isNaN(completedAt.getTime())) {
    throw new TypeError("La fecha del entrenamiento debe ser válida.");
  }

  const routine = Array.isArray(routineOrExercises)
    ? createRoutine("Entrenamiento", routineOrExercises)
    : routineOrExercises;
  if (!routine || !Array.isArray(routine.ejercicios)) {
    throw new TypeError("El entrenamiento debe incluir una lista de ejercicios.");
  }

  const workout = {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    nombre: typeof routine.nombre === "string" ? routine.nombre : "Entrenamiento",
    ejercicios: routine.ejercicios,
    duracion: `${calculateRoutineDuration(routine)} min`,
    calorias: calculateRoutineCalories(routine),
    completedAt: completedAt.toISOString(),
  };

  saveWorkoutHistory([...getWorkoutHistory(), workout]);
  trackChange(completedAt);
  return workout;
}

export function getWorkoutProgress() {
  const workouts = getWorkoutHistory();

  return {
    entrenamientos: workouts.length,
    minutos: workouts.reduce(
      (total, workout) => total + (Number.parseFloat(workout.duracion) || 0),
      0,
    ),
    calorias: workouts.reduce(
      (total, workout) => total + (Number(workout.calorias) || 0),
      0,
    ),
    historial: workouts,
  };
}
