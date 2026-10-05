const FIELD_VALIDATORS = [
  {
    id: "name",
    pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,40}$/,
    message: "Ingresa un nombre de 3 a 40 letras.",
  },
  {
    id: "email",
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Ingresa un correo electrónico válido.",
  },
  {
    id: "phone",
    pattern: /^\d{9,10}$/,
    message: "Ingresa un teléfono de 9 o 10 dígitos.",
  },
  {
    id: "fitness-goal",
    validate: (value) => value.trim() !== "",
    message: "Selecciona tu objetivo fitness.",
  },
];

export function initValidation(formElement) {
  if (!formElement || formElement.tagName !== "FORM") {
    throw new TypeError("initValidation requiere un elemento <form>.");
  }

  const fields = FIELD_VALIDATORS.map((definition) => {
    const input = formElement.querySelector(`#${definition.id}`);
    const errorMessage = formElement.querySelector(`#error-${definition.id}`);

    if (!input || !errorMessage) {
      throw new Error(
        `No se encontró el campo "#${definition.id}" o su contenedor "#error-${definition.id}".`,
      );
    }

    const validate = definition.validate
      ?? ((value) => definition.pattern.test(value));

    const validateField = () => {
      if (!input.required && input.value.trim() === "") {
        input.setAttribute("aria-invalid", "false");
        errorMessage.textContent = "";
        return true;
      }

      const isValid = validate(input.value) && input.value.trim() !== "";
      input.setAttribute("aria-invalid", String(!isValid));
      errorMessage.textContent = isValid ? "" : definition.message;
      return isValid;
    };

    input.addEventListener("input", validateField);
    input.addEventListener("blur", validateField);

    return { input, validateField };
  });

  formElement.addEventListener("submit", (event) => {
    const invalidField = fields.find(({ validateField }) => !validateField());

    if (invalidField) {
      event.preventDefault();
      invalidField.input.focus();
    }
  });
}
