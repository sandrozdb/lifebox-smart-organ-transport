// Parâmetros exclusivamente demonstrativos. Não representam protocolo médico oficial.
module.exports = Object.freeze({
  temperatura: { normalMin: 2, normalMax: 8, criticalMin: 0, criticalMax: 10 },
  umidade: { normalMin: 45, normalMax: 70, criticalMin: 30, criticalMax: 85 },
  impacto: { warning: 1.8, critical: 3.5 },
  bateria: { warning: 25, critical: 10 },
  sinal: { warning: 30, lost: 5 },
  atraso: { velocidadeMaximaKmh: 12 },
});
