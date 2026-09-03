# Demo acadêmica — aproximadamente 3 minutos

## Preparação

Abra alguns minutos antes:

- dashboard público: `https://lifebox-expotech.onrender.com`;
- Wokwi: `https://wokwi.com/projects/473749722940837889`.

Como o Render usa plano gratuito, aguarde o cold start se o serviço estiver inativo. Confirme `/api/health`, deixe o Wokwi conectado e verifique o dispositivo como online no dashboard.

Use **Reiniciar**, selecione órgão/origem/destino ou um cenário conhecido, calcule o plano e confirme ausência de recomendação pendente. O projeto é acadêmico e não certifica preservação clínica.

## Roteiro principal — IOT

- **0:00–0:20 — problema e LifeBox:** transporte exige tempo, rastreabilidade, controle ambiental e reação a eventos logísticos.
- **0:20–0:40 — arquitetura:** mostre rapidamente ESP32/Wokwi → HTTPS → Render → Aiven → Dashboard.
- **0:40–1:00 — perfil e PO:** mostre órgão, faixa térmica, isquemia, margem, alternativas e plano ótimo.
- **1:00–1:25 — telemetria real do protótipo:** inicie a execução e mostre ESP32 ONLINE, temperatura, umidade, impacto, bateria, sinal e GPS vindos do Wokwi.
- **1:25–1:45 — gráficos e Física:** mostre que as leituras da execução IoT alimentam gráficos e a Análise Física.
- **1:45–2:15 — condição logística + reotimização:** ative `Trânsito intenso` ou `Transporte terrestre indisponível`, mostre a recomendação e confirme o novo plano.
- **2:15–2:35 — separação IOT/DEMO:** destaque que cenários artificiais da caixa ficam bloqueados em IOT, mas Condições Logísticas continuam disponíveis porque são eventos externos ao dispositivo.
- **2:35–2:50 — resumo final:** finalize e mostre telemetria, ocorrências, logística e resumo isolados por execução.
- **2:50–3:00 — QA e Cloud:** cite CI #84 verde, 5/5 E2E, Render Docker, Aiven MySQL/TLS e Auto Deploy da `main`.

## Demonstração da eletrônica

Se houver alguns segundos adicionais, mostre o LED/buzzer no Wokwi ou o circuito Logisim. A regra permanece no backend:

```text
ATIVO AND (TEMP_CRÍTICA OR IMPACTO_CRÍTICO)
```

O ESP32 apenas aplica o `digitalSignal` devolvido pelo servidor.

## DEMO como plano B

O modo DEMO continua disponível e usa o mesmo planejamento, reotimização, Física e resumo final, mas a telemetria ambiental é produzida pelo simulador.

No DEMO, os cenários manuais de temperatura, impacto, umidade, bateria e sinal podem ser usados para mostrar rapidamente alertas críticos. No IOT, esses estados devem ser provocados pelos sensores do Wokwi.

## Evidência rápida de Cloud

Abra `https://lifebox-expotech.onrender.com/api/health` para demonstrar o backend público e a conexão com o banco.

Para a apresentação final, as pastas de captura estão preparadas em:

- [`evidencias/iot`](evidencias/iot/README.md);
- [`evidencias/cloud`](evidencias/cloud/README.md).

## Plano B sem internet

Se o Render, Wokwi ou tiles OSM não estiverem acessíveis, use a execução local e as evidências versionadas em [`docs/evidencias`](evidencias/README.md). Continue demonstrando PO, isquemia, Física, alertas, reotimização e arquitetura a partir das capturas.

## Modelo legado

O modelo A/B/C de score ponderado permanece apenas para compatibilidade/histórico nos endpoints `/api/otimizacao`. Ele não faz parte da demo principal. A PO atual é o planejamento multimodal em `/api/planejamento`.
