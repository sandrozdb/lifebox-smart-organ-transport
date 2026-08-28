// Pesos e restrições acadêmicas, aplicados somente aos dados demonstrativos.
module.exports = Object.freeze({
  weights: { tempo: 0.4, risco: 0.3, distancia: 0.2, custo: 0.1 },
  constraints: {
    tempoMaximoMin: 65,
    riscoMaximo: 0.75,
    distanciaMaximaKm: 42,
    sinalMinimo: 45,
  },
});
