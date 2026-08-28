function errorMessage(error) {
  if (error?.message) return error.message;
  const details = (error?.errors || [])
    .map((item) => item?.message || item?.code)
    .filter(Boolean);
  if (details.length) return details.join(" | ");
  return error?.code || "Erro desconhecido.";
}

module.exports = { errorMessage };
