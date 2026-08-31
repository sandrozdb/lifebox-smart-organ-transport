(function exposeTemperatureRange(root) {
  function rangeFrom(organ) {
    return (
      organ?.referenceRangeC || organ?.preservation?.referenceRangeC || null
    );
  }

  function temperatureRangeState(value, organ) {
    const temperature = Number(value),
      range = rangeFrom(organ);
    if (!Number.isFinite(temperature) || !range || range.length !== 2)
      return null;
    const [minimum, maximum] = range.map(Number),
      label = `${organ.name} ${minimum}–${maximum} °C`;
    if (temperature < minimum)
      return {
        position: "below",
        text: `Abaixo da faixa de referência · ${label}`,
      };
    if (temperature > maximum)
      return {
        position: "above",
        text: `Acima da faixa de referência · ${label}`,
      };
    return { position: "within", text: `✓ Dentro da faixa · ${label}` };
  }

  if (typeof module !== "undefined") module.exports = { temperatureRangeState };
  if (root) root.lifeBoxTemperatureRangeState = temperatureRangeState;
})(typeof window === "undefined" ? null : window);
