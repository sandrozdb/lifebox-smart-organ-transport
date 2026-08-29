const crypto = require("crypto");

const BRAZILIAN_CAPITALS = [
  ["Rio Branco", "AC", -9.97499, -67.8243],
  ["Maceió", "AL", -9.66599, -35.735],
  ["Macapá", "AP", 0.034934, -51.0694],
  ["Manaus", "AM", -3.11903, -60.0217],
  ["Salvador", "BA", -12.9714, -38.5014],
  ["Fortaleza", "CE", -3.73186, -38.5267],
  ["Brasília", "DF", -15.7939, -47.8828],
  ["Vitória", "ES", -20.3155, -40.3128],
  ["Goiânia", "GO", -16.6869, -49.2648],
  ["São Luís", "MA", -2.53073, -44.3068],
  ["Cuiabá", "MT", -15.6014, -56.0979],
  ["Campo Grande", "MS", -20.4697, -54.6201],
  ["Belo Horizonte", "MG", -19.9167, -43.9345],
  ["Belém", "PA", -1.45583, -48.4902],
  ["João Pessoa", "PB", -7.1195, -34.845],
  ["Curitiba", "PR", -25.4284, -49.2733],
  ["Recife", "PE", -8.04756, -34.877],
  ["Teresina", "PI", -5.09194, -42.8034],
  ["Rio de Janeiro", "RJ", -22.9068, -43.1729],
  ["Natal", "RN", -5.79448, -35.211],
  ["Porto Alegre", "RS", -30.0346, -51.2177],
  ["Porto Velho", "RO", -8.76077, -63.8999],
  ["Boa Vista", "RR", 2.8235, -60.6758],
  ["Florianópolis", "SC", -27.5949, -48.5482],
  ["São Paulo", "SP", -23.5505, -46.6333],
  ["Aracaju", "SE", -10.9472, -37.0731],
  ["Palmas", "TO", -10.184, -48.3336],
].map(([name, uf, latitude, longitude]) => ({
  name,
  uf,
  latitude,
  longitude,
}));

const BRAZILIAN_CAPITAL_AIRPORTS = [
  [
    "AC",
    "SBRB",
    "Aeroporto Internacional de Rio Branco — Plácido de Castro",
    -9.86889,
    -67.8981,
  ],
  [
    "AL",
    "SBMO",
    "Aeroporto Internacional Zumbi dos Palmares",
    -9.51081,
    -35.7917,
  ],
  [
    "AP",
    "SBMQ",
    "Aeroporto Internacional de Macapá — Alberto Alcolumbre",
    0.050664,
    -51.0722,
  ],
  [
    "AM",
    "SBEG",
    "Aeroporto Internacional de Manaus — Eduardo Gomes",
    -3.03861,
    -60.0497,
  ],
  [
    "BA",
    "SBSV",
    "Aeroporto Internacional de Salvador — Deputado Luís Eduardo Magalhães",
    -12.9086,
    -38.3225,
  ],
  [
    "CE",
    "SBFZ",
    "Aeroporto Internacional de Fortaleza — Pinto Martins",
    -3.77628,
    -38.5326,
  ],
  [
    "DF",
    "SBBR",
    "Aeroporto Internacional de Brasília — Presidente Juscelino Kubitschek",
    -15.8697,
    -47.9186,
  ],
  [
    "ES",
    "SBVT",
    "Aeroporto de Vitória — Eurico de Aguiar Salles",
    -20.2581,
    -40.2864,
  ],
  ["GO", "SBGO", "Aeroporto de Goiânia — Santa Genoveva", -16.632, -49.2207],
  [
    "MA",
    "SBSL",
    "Aeroporto Internacional de São Luís — Marechal Cunha Machado",
    -2.58536,
    -44.2341,
  ],
  [
    "MT",
    "SBCY",
    "Aeroporto Internacional de Cuiabá — Marechal Rondon",
    -15.6529,
    -56.1167,
  ],
  ["MS", "SBCG", "Aeroporto Internacional de Campo Grande", -20.47, -54.674],
  [
    "MG",
    "SBBH",
    "Aeroporto de Belo Horizonte/Pampulha — Carlos Drummond de Andrade",
    -19.8512,
    -43.9506,
  ],
  [
    "PA",
    "SBBE",
    "Aeroporto Internacional de Belém — Val de Cans",
    -1.37925,
    -48.4763,
  ],
  [
    "PB",
    "SBJP",
    "Aeroporto Internacional de João Pessoa — Presidente Castro Pinto",
    -7.14583,
    -34.9486,
  ],
  [
    "PR",
    "SBCT",
    "Aeroporto Internacional de Curitiba — Afonso Pena",
    -25.5285,
    -49.1758,
  ],
  [
    "PE",
    "SBRF",
    "Aeroporto Internacional do Recife — Guararapes/Gilberto Freyre",
    -8.12649,
    -34.9236,
  ],
  [
    "PI",
    "SBTE",
    "Aeroporto de Teresina — Senador Petrônio Portella",
    -5.06025,
    -42.8235,
  ],
  [
    "RJ",
    "SBRJ",
    "Aeroporto do Rio de Janeiro — Santos Dumont",
    -22.9105,
    -43.1631,
  ],
  [
    "RN",
    "SBSG",
    "Aeroporto Internacional de Natal — Governador Aluízio Alves",
    -5.76806,
    -35.3761,
  ],
  [
    "RS",
    "SBPA",
    "Aeroporto Internacional de Porto Alegre — Salgado Filho",
    -29.9939,
    -51.1711,
  ],
  [
    "RO",
    "SBPV",
    "Aeroporto Internacional de Porto Velho — Governador Jorge Teixeira de Oliveira",
    -8.70929,
    -63.9023,
  ],
  [
    "RR",
    "SBBV",
    "Aeroporto Internacional de Boa Vista — Atlas Brasil Cantanhede",
    2.84139,
    -60.6922,
  ],
  [
    "SC",
    "SBFL",
    "Aeroporto Internacional de Florianópolis — Hercílio Luz",
    -27.6703,
    -48.5525,
  ],
  [
    "SP",
    "SBSP",
    "Aeroporto de São Paulo/Congonhas — Deputado Freitas Nobre",
    -23.6261,
    -46.6566,
  ],
  [
    "SE",
    "SBAR",
    "Aeroporto Internacional de Aracaju — Santa Maria",
    -10.984,
    -37.0703,
  ],
  [
    "TO",
    "SBPJ",
    "Aeroporto de Palmas — Brigadeiro Lysias Rodrigues",
    -10.2915,
    -48.357,
  ],
].map(([uf, icao, name, latitude, longitude]) => ({
  uf,
  icao,
  name,
  latitude,
  longitude,
  source: "ANAC",
}));

function normalizeLocation(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

function findBrazilianCapital(query) {
  const normalizedQuery = normalizeLocation(query);
  if (!normalizedQuery) return null;

  return (
    BRAZILIAN_CAPITALS.find((capital) => {
      const normalizedName = normalizeLocation(capital.name);
      return (
        normalizedQuery === normalizedName ||
        normalizedQuery === `${normalizedName} ${capital.uf}` ||
        normalizedQuery === capital.uf
      );
    }) || null
  );
}

function capitalLocation(query, role) {
  const capital = findBrazilianCapital(query);
  if (!capital) return null;

  return {
    name: `${capital.name} - ${capital.uf}`,
    latitude: capital.latitude,
    longitude: capital.longitude,
    role,
    provider: "LOCAL_CAPITAL_GAZETTEER",
    classification: "OFFICIAL_REFERENCE_DATA",
    notice:
      "Coordenada de referência da capital usada como contingência local quando a geocodificação externa está indisponível.",
  };
}

function findCapitalAirport(point) {
  const capital = findBrazilianCapital(point?.name);
  if (!capital) return null;
  return (
    BRAZILIAN_CAPITAL_AIRPORTS.find((airport) => airport.uf === capital.uf) ||
    null
  );
}

function hashCoordinate(text, axis) {
  const hex = crypto
    .createHash("sha256")
    .update(String(text))
    .digest("hex")
    .slice(axis ? 8 : 0, 8 + (axis ? 8 : 0));
  const fraction = parseInt(hex, 16) / 0xffffffff;
  return axis ? -46.9 + fraction * 0.7 : -23.8 + fraction * 0.55;
}
class SimulatedLocationProvider {
  async geocode(query, role) {
    const label =
      String(query || "").trim() ||
      `${role === "origin" ? "Hospital doador" : "Hospital receptor"} simulado`;
    return {
      name: label,
      latitude: hashCoordinate(label, 0),
      longitude: hashCoordinate(label, 1),
      provider: "SIMULATED",
      classification: "SIMULATED_DATA",
      notice:
        "Localização simulada: configure um provedor externo para geocodificação real.",
    };
  }
  async findFacility(point, type) {
    const offset = type.includes("AIRPORT") ? 0.095 : 0.028;
    return {
      name: `Infraestrutura ${type === "AIRPORT_ORIGIN" || type === "AIRPORT_DESTINATION" ? "aeroportuária" : "de heliponto"} simulada`,
      latitude: point.latitude + (type.endsWith("ORIGIN") ? offset : -offset),
      longitude: point.longitude + (type.endsWith("ORIGIN") ? offset : -offset),
      type,
      provider: "SIMULATED",
      classification: "SIMULATED_DATA",
      available: true,
    };
  }
}
class NominatimLocationProvider {
  async geocode(query, role) {
    if (!global.fetch)
      throw new Error("Fetch indisponível para geocodificação externa.");
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: { "User-Agent": "LifeBox-Academic-MVP/1.0" },
    });
    if (!response.ok)
      throw new Error(
        `Geocodificação externa indisponível (${response.status}).`,
      );
    const data = await response.json();
    if (!data[0])
      throw new Error("Endereço não localizado pelo provedor externo.");
    return {
      name: data[0].display_name,
      latitude: Number(data[0].lat),
      longitude: Number(data[0].lon),
      role,
      provider: "NOMINATIM",
      classification: "EXTERNAL_OPEN_DATA",
      notice:
        "Geocodificação obtida do OpenStreetMap/Nominatim; confirmar operacionalmente antes de uso real.",
    };
  }
}
class FallbackLocationProvider {
  constructor(
    primary = new NominatimLocationProvider(),
    fallback = new SimulatedLocationProvider(),
  ) {
    this.primary = primary;
    this.fallback = fallback;
  }
  async geocode(query, role) {
    try {
      return await this.primary.geocode(query, role);
    } catch (error) {
      const capital = capitalLocation(query, role);
      if (capital) return { ...capital, fallbackReason: error.message };

      const simulated = await this.fallback.geocode(query, role);
      return { ...simulated, fallbackReason: error.message };
    }
  }
  async findFacility(point, type) {
    if (type.includes("AIRPORT")) {
      const airport = findCapitalAirport(point);
      if (airport) {
        return {
          ...airport,
          type,
          provider: "LOCAL_CAPITAL_AIRPORTS",
          classification: "REAL_OPEN_DATA",
          available: true,
          notice:
            "Aeródromo público associado à capital, com identificação e coordenadas de referência da ANAC.",
        };
      }
    }

    return this.fallback.findFacility(point, type);
  }
}
module.exports = {
  BRAZILIAN_CAPITALS,
  BRAZILIAN_CAPITAL_AIRPORTS,
  normalizeLocation,
  findBrazilianCapital,
  findCapitalAirport,
  SimulatedLocationProvider,
  NominatimLocationProvider,
  FallbackLocationProvider,
};
