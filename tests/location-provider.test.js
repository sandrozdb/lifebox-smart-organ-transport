const test = require("node:test");
const assert = require("node:assert/strict");
const {
  BRAZILIAN_CAPITALS,
  BRAZILIAN_CAPITAL_AIRPORTS,
  FallbackLocationProvider,
  findCapitalAirport,
  findBrazilianCapital,
} = require("../src/services/locationProvider");

test("a base local contém as 27 capitais e todas as UFs", () => {
  assert.equal(BRAZILIAN_CAPITALS.length, 27);
  assert.equal(new Set(BRAZILIAN_CAPITALS.map(({ uf }) => uf)).size, 27);

  for (const capital of BRAZILIAN_CAPITALS) {
    assert.deepEqual(
      findBrazilianCapital(`${capital.name} - ${capital.uf}`),
      capital,
    );
  }
});

test("a base aérea contém um aeroporto identificado para cada capital", () => {
  assert.equal(BRAZILIAN_CAPITAL_AIRPORTS.length, 27);
  assert.equal(
    new Set(BRAZILIAN_CAPITAL_AIRPORTS.map(({ icao }) => icao)).size,
    27,
  );

  for (const capital of BRAZILIAN_CAPITALS) {
    const airport = findCapitalAirport({
      name: `${capital.name} - ${capital.uf}`,
    });
    assert.equal(airport.uf, capital.uf);
    assert.match(airport.icao, /^[A-Z]{4}$/);
    assert.ok(Number.isFinite(airport.latitude));
    assert.ok(Number.isFinite(airport.longitude));
  }
});

test("a busca aceita acentos, caixa e sigla da UF", () => {
  assert.equal(findBrazilianCapital("sao paulo - sp").uf, "SP");
  assert.equal(findBrazilianCapital("SALVADOR, BA").uf, "BA");
  assert.equal(findBrazilianCapital("Brasília").uf, "DF");
  assert.equal(findBrazilianCapital("TO").name, "Palmas");
});

test("usa a coordenada conhecida da capital quando o serviço externo falha", async () => {
  const primary = {
    async geocode() {
      throw new Error("serviço externo indisponível");
    },
  };
  const provider = new FallbackLocationProvider(primary);
  const point = await provider.geocode("Salvador - BA", "destination");

  assert.equal(point.name, "Salvador - BA");
  assert.equal(point.latitude, -12.9714);
  assert.equal(point.longitude, -38.5014);
  assert.equal(point.provider, "LOCAL_CAPITAL_GAZETTEER");
  assert.equal(point.classification, "OFFICIAL_REFERENCE_DATA");
  assert.equal(point.fallbackReason, "serviço externo indisponível");
});

test("usa os aeroportos reais das capitais no planejamento aéreo", async () => {
  const provider = new FallbackLocationProvider();
  const departure = await provider.findFacility(
    { name: "São Paulo - SP" },
    "AIRPORT_ORIGIN",
  );
  const arrival = await provider.findFacility(
    { name: "Salvador - BA" },
    "AIRPORT_DESTINATION",
  );

  assert.equal(departure.icao, "SBSP");
  assert.equal(arrival.icao, "SBSV");
  assert.equal(departure.type, "AIRPORT_ORIGIN");
  assert.equal(arrival.type, "AIRPORT_DESTINATION");
  assert.equal(arrival.classification, "REAL_OPEN_DATA");
});
