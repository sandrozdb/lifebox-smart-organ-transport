class WeightedRouteScoringStrategy {
  calculate(normalized, weights) {
    const partials = Object.fromEntries(
      Object.keys(weights).map((key) => [key, normalized[key] * weights[key]]),
    );
    return {
      partials,
      score: Object.values(partials).reduce((total, value) => total + value, 0),
    };
  }
}
module.exports = { WeightedRouteScoringStrategy };
