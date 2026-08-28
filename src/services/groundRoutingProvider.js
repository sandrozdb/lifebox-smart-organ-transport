const distance = (a, b) => {
  const r = 6371,
    to = (x) => (x * Math.PI) / 180,
    dLat = to(b.latitude - a.latitude),
    dLon = to(b.longitude - a.longitude),
    q =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(to(a.latitude)) *
        Math.cos(to(b.latitude)) *
        Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.atan2(Math.sqrt(q), Math.sqrt(1 - q));
};
const closeTo = (point, latitude, longitude) =>
  Math.abs(point.latitude - latitude) < 0.3 &&
  Math.abs(point.longitude - longitude) < 0.3;
class GroundRoutingProvider {
  constructor({ externalProvider } = {}) {
    this.externalProvider = externalProvider;
  }
  async routes(
    origin,
    destination,
    { trafficIncrease = 0, groundRouteUnavailable = null } = {},
  ) {
    if (this.externalProvider) {
      const external = await this.externalProvider.routes(origin, destination, {
        trafficIncrease,
      });
      if (Array.isArray(external) && external.length)
        return external.map((route) => ({
          ...route,
          classification: route.classification || "EXTERNAL_PROVIDER",
          source: route.source || "Provedor externo configurado.",
        }));
    }
    const spCampinas =
      (closeTo(origin, -23.55, -46.63) &&
        closeTo(destination, -22.91, -47.06)) ||
      (closeTo(destination, -23.55, -46.63) && closeTo(origin, -22.91, -47.06));
    if (spCampinas) {
      const base = [
        {
          id: "GROUND_BANDEIRANTES",
          name: "Terrestre — Via Rodovia dos Bandeirantes",
          via: "Rodovia dos Bandeirantes",
          distanceKm: 98,
          timeMin: 90,
          cost: 220,
          risk: 0.16,
          toll: 18,
          geometry: [
            origin,
            { latitude: -23.25, longitude: -46.95 },
            { latitude: -22.91, longitude: -47.06 },
            destination,
          ],
        },
        {
          id: "GROUND_ANHANGUERA",
          name: "Terrestre — Via Rodovia Anhanguera",
          via: "Rodovia Anhanguera",
          distanceKm: 105,
          timeMin: 105,
          cost: 180,
          risk: 0.2,
          toll: 14,
          geometry: [
            origin,
            { latitude: -23.36, longitude: -46.79 },
            { latitude: -22.98, longitude: -47.12 },
            destination,
          ],
        },
      ];
      return base
        .filter((x) => x.id !== groundRouteUnavailable)
        .map((x) => ({
          ...x,
          timeMin: Number((x.timeMin * (1 + trafficIncrease)).toFixed(2)),
          classification: "SIMULATED",
          source:
            "Cenário acadêmico determinístico LifeBox; vias reais, geometria/tempo/custo simulados.",
        }));
    }
    const km = distance(origin, destination) * 1.18;
    return [
      {
        id: "GROUND_GENERIC",
        name: "Terrestre porta a porta — rota simulada",
        via: "Trajeto terrestre simulado",
        distanceKm: Number(km.toFixed(2)),
        timeMin: Number(((km / 42) * 60 * (1 + trafficIncrease)).toFixed(2)),
        cost: Number((80 + km * 4.5).toFixed(2)),
        risk: 0.18,
        toll: 0,
        geometry: [origin, destination],
        classification: "SIMULATED",
        source: "Fallback acadêmico sem provedor externo de roteamento.",
      },
    ];
  }
}
module.exports = { GroundRoutingProvider };
