# Transporte multimodal

Cada alternativa é uma soma de segmentos: terrestre porta a porta; helicóptero com transferência hospital–heliponto–hospital quando necessária; avião com hospital–aeroporto, acionamento/preparação, voo e aeroporto–hospital. Hospitais com heliponto reduzem os trechos terrestres.

O `locationProvider` separa a origem/destino de sua fonte. `NominatimLocationProvider` tenta geocodificação aberta; `SimulatedLocationProvider` é o fallback explicitamente marcado. Infraestruturas aéreas do fallback não correspondem a aeroportos ou helipontos reais e não devem ser usadas operacionalmente.

Os modais são avaliados por disponibilidade, infraestrutura requerida, tempo, custo e margem. Custos, velocidades e riscos são premissas acadêmicas LifeBox, não preços oficiais nem recomendações operacionais.