// Pesos e restrições acadêmicas, aplicados somente aos dados demonstrativos.
module.exports = Object.freeze({
  weights: { tempo: 0.40, risco: 0.30, distancia: 0.20, custo: 0.10 },
  constraints: { tempoMaximoMin: 65, riscoMaximo: 0.75, distanciaMaximaKm: 42, sinalMinimo: 45 }
});

