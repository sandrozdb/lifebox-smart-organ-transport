const thresholds = require("../config/thresholds");
function evaluate(reading, profile) {
  const issues = [];
  const add = (tipo, severidade, mensagem, valor) =>
    issues.push({ tipo, severidade, mensagem, valor });
  const range = profile?.preservation?.referenceRangeC;
  if (range) {
    if (reading.temperatura < range[0] || reading.temperatura > range[1])
      add(
        "TEMPERATURA",
        "CRITICO",
        `Temperatura fora da faixa de referência do órgão selecionado (${range[0]}–${range[1]} °C).`,
        reading.temperatura,
      );
  } else if (
    reading.temperatura < thresholds.temperatura.criticalMin ||
    reading.temperatura > thresholds.temperatura.criticalMax
  )
    add(
      "TEMPERATURA",
      "CRITICO",
      "Temperatura ultrapassou o limite crítico demonstrativo.",
      reading.temperatura,
    );
  else if (
    reading.temperatura < thresholds.temperatura.normalMin ||
    reading.temperatura > thresholds.temperatura.normalMax
  )
    add(
      "TEMPERATURA",
      "ATENCAO",
      "Temperatura fora da faixa demonstrativa.",
      reading.temperatura,
    );
  if (
    reading.umidade < thresholds.umidade.criticalMin ||
    reading.umidade > thresholds.umidade.criticalMax
  )
    add(
      "UMIDADE",
      "CRITICO",
      "Umidade ultrapassou o limite crítico demonstrativo.",
      reading.umidade,
    );
  else if (
    reading.umidade < thresholds.umidade.normalMin ||
    reading.umidade > thresholds.umidade.normalMax
  )
    add(
      "UMIDADE",
      "ATENCAO",
      "Umidade fora da faixa demonstrativa.",
      reading.umidade,
    );
  if (reading.impacto >= thresholds.impacto.critical)
    add(
      "IMPACTO",
      "CRITICO",
      "Impacto crítico simulado detectado.",
      reading.impacto,
    );
  else if (reading.impacto >= thresholds.impacto.warning)
    add(
      "IMPACTO",
      "ATENCAO",
      "Impacto relevante simulado detectado.",
      reading.impacto,
    );
  if (reading.bateria <= thresholds.bateria.critical)
    add("BATERIA", "CRITICO", "Bateria em nível crítico.", reading.bateria);
  else if (reading.bateria <= thresholds.bateria.warning)
    add("BATERIA", "ATENCAO", "Bateria baixa.", reading.bateria);
  if (reading.sinal <= thresholds.sinal.lost)
    add(
      "SINAL",
      "CRITICO",
      "Comunicação interrompida ou sinal indisponível.",
      reading.sinal,
    );
  else if (reading.sinal <= thresholds.sinal.warning)
    add("SINAL", "ATENCAO", "Qualidade de comunicação baixa.", reading.sinal);
  if (
    reading.cenario === "atraso" &&
    reading.velocidade <= thresholds.atraso.velocidadeMaximaKmh
  )
    add(
      "ATRASO",
      "ATENCAO",
      "Tempo estimado da operação ultrapassou o limite planejado.",
      reading.velocidade,
    );
  return issues;
}
module.exports = { evaluate };
