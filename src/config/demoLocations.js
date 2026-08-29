const airports = {
  SBSP: {
    icao: "SBSP",
    name: "Aeroporto de São Paulo/Congonhas — Deputado Freitas Nobre",
    city: "São Paulo",
    state: "SP",
    latitude: -23.6261,
    longitude: -46.6566,
    type: "REAL",
    source: "ANAC",
  },
  SBGR: {
    icao: "SBGR",
    name: "Aeroporto Internacional de Guarulhos — Governador André Franco Montoro",
    city: "Guarulhos",
    state: "SP",
    latitude: -23.4356,
    longitude: -46.4731,
    type: "REAL",
    source: "ANAC",
  },
  SBKP: {
    icao: "SBKP",
    name: "Aeroporto Internacional de Viracopos",
    city: "Campinas",
    state: "SP",
    latitude: -23.0074,
    longitude: -47.1345,
    type: "REAL",
    source: "ANAC",
  },
  SBBR: {
    icao: "SBBR",
    name: "Aeroporto Internacional de Brasília — Presidente Juscelino Kubitschek",
    city: "Brasília",
    state: "DF",
    latitude: -15.8697,
    longitude: -47.9186,
    type: "REAL",
    source: "ANAC",
  },
};
const loc = (name, latitude, longitude) => ({
  name,
  latitude,
  longitude,
  classification: "REAL_OPEN_DATA",
});
const modalAvailability = (enabled) => ({
  GROUND: enabled === "GROUND",
  HELICOPTER: enabled === "HELICOPTER",
  AIRPLANE: enabled === "AIRPLANE",
  MULTIMODAL: false,
});
const saoPaulo = loc("São Paulo - SP", -23.5505, -46.6333);
const campinas = loc("Campinas - SP", -22.9056, -47.0608);
const beloHorizonte = loc("Belo Horizonte - MG", -19.9167, -43.9345);
const rioDeJaneiro = loc("Rio de Janeiro - RJ", -22.9068, -43.1729);
const brasilia = loc("Brasília - DF", -15.7939, -47.8828);
const belem = loc("Belém - PA", -1.45583, -48.4902);
const curitiba = loc("Curitiba - PR", -25.4284, -49.2733);
const fortaleza = loc("Fortaleza - CE", -3.73186, -38.5267);
const florianopolis = loc("Florianópolis - SC", -27.5949, -48.5482);
const maceio = loc("Maceió - AL", -9.66599, -35.735);
const manaus = loc("Manaus - AM", -3.11903, -60.0217);
const palmas = loc("Palmas - TO", -10.184, -48.3336);
const portoAlegre = loc("Porto Alegre - RS", -30.0346, -51.2177);
const recife = loc("Recife - PE", -8.04756, -34.877);
const salvador = loc("Salvador - BA", -12.9714, -38.5014);
const saoLuis = loc("São Luís - MA", -2.53073, -44.3068);
const scenarios = [
  {
    id: "DEMO_01_GROUND_ANHANGUERA",
    name: "01 · Terrestre · Rodovia Anhanguera",
    organCode: "KIDNEY",
    consumedMinutes: 60,
    origin: campinas,
    destination: saoPaulo,
    conditions: { modalAvailability: modalAvailability("GROUND") },
    expectedPlanId: "PLAN_GROUND_ANHANGUERA",
    description:
      "Rim com 60 min de isquemia consumida; demonstração terrestre pela Rodovia Anhanguera.",
  },
  {
    id: "DEMO_02_GROUND_BANDEIRANTES",
    name: "02 · Terrestre · Rodovia dos Bandeirantes",
    organCode: "LIVER",
    consumedMinutes: 120,
    origin: saoPaulo,
    destination: campinas,
    conditions: {
      modalAvailability: modalAvailability("GROUND"),
      groundRouteUnavailable: "GROUND_ANHANGUERA",
    },
    expectedPlanId: "PLAN_GROUND_BANDEIRANTES",
    description:
      "Fígado com 120 min de isquemia consumida; demonstração terrestre pela Rodovia dos Bandeirantes.",
  },
  {
    id: "DEMO_03_GROUND_ESTIMATED",
    name: "03 · Terrestre · Rota estimada",
    organCode: "KIDNEY",
    consumedMinutes: 240,
    origin: curitiba,
    destination: florianopolis,
    conditions: { modalAvailability: modalAvailability("GROUND") },
    expectedPlanId: "PLAN_GROUND_GENERIC",
    description:
      "Rim com 240 min de isquemia consumida; rota terrestre fora das vias específicas cadastradas.",
  },
  {
    id: "DEMO_04_HELICOPTER",
    name: "04 · Helicóptero porta a porta",
    organCode: "HEART",
    consumedMinutes: 60,
    origin: beloHorizonte,
    destination: rioDeJaneiro,
    conditions: {
      originHasHelipad: true,
      destinationHasHelipad: true,
      modalAvailability: modalAvailability("HELICOPTER"),
    },
    expectedPlanId: "PLAN_HELICOPTER",
    description:
      "Coração com 60 min de isquemia consumida; ligação direta de Belo Horizonte ao Rio de Janeiro.",
  },
  {
    id: "DEMO_05_GROUND_HELICOPTER_GROUND",
    name: "05 · Terrestre + Helicóptero + Terrestre",
    organCode: "LUNG",
    consumedMinutes: 180,
    origin: recife,
    destination: maceio,
    conditions: {
      originHasHelipad: false,
      destinationHasHelipad: false,
      modalAvailability: modalAvailability("HELICOPTER"),
    },
    expectedPlanId: "PLAN_MULTIMODAL_T_H_T",
    description:
      "Pulmão com 180 min de isquemia consumida; ligação Recife–Maceió com acessos terrestres a helipontos.",
  },
  {
    id: "DEMO_06_GROUND_AIR_GROUND",
    name: "06 · Terrestre + Avião + Terrestre",
    organCode: "LIVER",
    consumedMinutes: 300,
    origin: portoAlegre,
    destination: brasilia,
    conditions: {
      roadDistanceFactor: 1,
      modalAvailability: modalAvailability("AIRPLANE"),
    },
    expectedPlanId: "PLAN_MULTIMODAL_T_A_T",
    description:
      "Fígado com 300 min de isquemia consumida; transporte Porto Alegre–Brasília com acesso e saída terrestres.",
  },
  {
    id: "DEMO_07_HELICOPTER_AIR_GROUND",
    name: "07 · Helicóptero + Avião + Terrestre",
    organCode: "PANCREAS",
    consumedMinutes: 360,
    origin: manaus,
    destination: belem,
    conditions: {
      roadDistanceFactor: 1,
      originHasHelipad: true,
      groundAccessOriginAvailable: false,
      modalAvailability: modalAvailability("AIRPLANE"),
    },
    expectedPlanId: "PLAN_MULTIMODAL_H_A_T",
    description:
      "Pâncreas com 360 min de isquemia consumida; transporte Manaus–Belém com acesso aéreo na origem.",
  },
  {
    id: "DEMO_08_GROUND_AIR_HELICOPTER",
    name: "08 · Terrestre + Avião + Helicóptero",
    organCode: "INTESTINE",
    consumedMinutes: 100,
    origin: curitiba,
    destination: rioDeJaneiro,
    conditions: {
      roadDistanceFactor: 1,
      destinationHasHelipad: true,
      groundAccessDestinationAvailable: false,
      modalAvailability: modalAvailability("AIRPLANE"),
    },
    expectedPlanId: "PLAN_MULTIMODAL_T_A_H",
    description:
      "Intestino com 100 min de isquemia consumida; transporte Curitiba–Rio de Janeiro com saída aérea.",
  },
  {
    id: "DEMO_09_HELICOPTER_AIR_HELICOPTER",
    name: "09 · Helicóptero + Avião + Helicóptero",
    organCode: "LUNG",
    consumedMinutes: 60,
    origin: salvador,
    destination: fortaleza,
    conditions: {
      roadDistanceFactor: 1,
      originHasHelipad: true,
      destinationHasHelipad: true,
      groundAccessOriginAvailable: false,
      groundAccessDestinationAvailable: false,
      modalAvailability: modalAvailability("AIRPLANE"),
    },
    expectedPlanId: "PLAN_MULTIMODAL_H_A_H",
    description:
      "Pulmão com 60 min de isquemia consumida; transporte Salvador–Fortaleza com helicóptero nas duas extremidades.",
  },
  {
    id: "DEMO_10_NO_SOLUTION",
    name: "10 · Nenhum plano factível",
    organCode: "HEART",
    consumedMinutes: 235,
    origin: saoLuis,
    destination: palmas,
    conditions: {
      modalAvailability: modalAvailability(null),
    },
    expectedPlanId: null,
    description:
      "Demonstração em que nenhuma alternativa atende às restrições.",
  },
];
module.exports = { airports, scenarios };
