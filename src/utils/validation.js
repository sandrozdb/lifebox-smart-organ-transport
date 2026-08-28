const { httpError } = require("./httpError");

function object(value, field = "payload") {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw httpError(
      400,
      "INVALID_PAYLOAD",
      `${field} deve ser um objeto JSON.`,
    );
  }
  return value;
}

function positiveId(value, field) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw httpError(
      400,
      "INVALID_ID",
      `${field} deve ser um inteiro positivo.`,
    );
  }
  return id;
}

function nonEmptyString(value, field, options = {}) {
  if (typeof value !== "string" || !value.trim()) {
    throw httpError(422, "INVALID_FIELD", `${field} é obrigatório.`);
  }
  const normalized = value.trim();
  if (options.max && normalized.length > options.max) {
    throw httpError(
      422,
      "INVALID_FIELD",
      `${field} excede ${options.max} caracteres.`,
    );
  }
  return normalized;
}

function finiteNumber(value, field, options = {}) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw httpError(422, "INVALID_FIELD", `${field} deve ser numérico.`);
  }
  if (options.min !== undefined && number < options.min) {
    throw httpError(
      422,
      "OUT_OF_RANGE",
      `${field} deve ser maior ou igual a ${options.min}.`,
    );
  }
  if (options.max !== undefined && number > options.max) {
    throw httpError(
      422,
      "OUT_OF_RANGE",
      `${field} deve ser menor ou igual a ${options.max}.`,
    );
  }
  return number;
}

function enumValue(value, field, allowed) {
  if (!allowed.includes(value)) {
    throw httpError(
      422,
      "INVALID_ENUM",
      `${field} deve ser um de: ${allowed.join(", ")}.`,
    );
  }
  return value;
}

module.exports = {
  object,
  positiveId,
  nonEmptyString,
  finiteNumber,
  enumValue,
};
