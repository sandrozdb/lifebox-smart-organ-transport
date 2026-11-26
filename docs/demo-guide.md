# Demo ExpoTech — aproximadamente 8 a 9 minutos

## Vídeo pitch gravado

A apresentação em vídeo do projeto está disponível no YouTube: **[LifeBox — vídeo pitch](https://youtu.be/vHY02qPTlms)**. O vídeo complementa a demonstração interativa descrita abaixo.

## Montagem recomendada

A demonstração digital usa duas telas e dispensa slides. A caixa física entra **depois**, como interação presencial independente:

- **notebook:** dashboard público da LifeBox em `https://lifebox-expotech.onrender.com`;
- **monitor/TV:** projeto Wokwi em `https://wokwi.com/projects/473749722940837889`, preferencialmente em tela cheia;
- **na bancada:** caixa com ESP32 real **offline**, OLED, dois potenciômetros, LED verde/vermelho e buzzer, para a banca manipular.

Abra tudo alguns minutos antes. Como o Render usa plano gratuito, aguarde eventual cold start, confirme `https://lifebox-expotech.onrender.com/api/health`, deixe o Wokwi conectado e verifique o dispositivo como **ONLINE** no dashboard.

Também mantenha o relatório técnico e as evidências baixados localmente como plano B.

## Roteiro principal — IOT

### 0:00–0:30 — problema e proposta

Apresente a LifeBox como um protótipo acadêmico para monitoramento, rastreabilidade e apoio à decisão no transporte de órgãos, integrando IoT, Pesquisa Operacional, Física, Eletrônica, arquitetura e Cloud.

### 0:30–1:15 — Wokwi / dispositivo

No monitor/TV, mostre o circuito inteiro: ESP32, DHT22, MPU6050, GPS NEO-6M, bateria/ADC, OLED, LED e buzzer. Explique que o ESP32 coleta dados e envia telemetria por HTTPS ao backend público.

### 1:15–2:15 — dashboard e telemetria

No notebook, mostre o dispositivo **ONLINE** e a telemetria da execução: temperatura, umidade, impacto/aceleração, bateria, sinal, GPS e velocidade. Destaque que o backend associa a leitura à execução ativa e permanece como fonte de verdade.

### 2:15–2:50 — gráficos e Física

Mostre os gráficos da execução e abra a Análise Física. Cite ΔT, `Q = m·c·ΔT`, aceleração resultante, `P = V·I`, `E = P·t` e autonomia. Os cálculos usam os dados da execução atual e parâmetros didáticos configurados no projeto.

### 2:50–4:10 — alerta IoT ao vivo

No Wokwi, provoque uma temperatura fora da faixa configurada. Mostre no dashboard a condição crítica e, no monitor/TV, o LED e o buzzer acionados pelo `digitalSignal` devolvido pelo backend.

Regra do protótipo IoT:

```text
ALERTA = TRANSPORTE_ATIVO AND (TEMPERATURA_CRITICA OR IMPACTO_CRITICO)
```

Depois normalize a temperatura e mostre os atuadores desligando. Explique que essa lógica é combinacional. O D Flip-Flop do Logisim é uma extensão sequencial acadêmica separada e não representa o comportamento atual do backend/Wokwi.

### 4:10–5:40 — condição logística e Pesquisa Operacional

No dashboard, ative **Transporte terrestre indisponível**. Mostre que o plano terrestre deixa o conjunto factível e que o backend reotimiza a partir do estado atual.

Apresente a recomendação alternativa e destaque que a aplicação depende de confirmação explícita do operador. Posição, histórico, tempo e isquemia já consumidos são preservados.

### 5:40–6:30 — resumo final

Finalize a execução e mostre o resumo com os agregados de telemetria, ocorrências, alertas, bateria, sinal e indicadores logísticos da viagem atual.

### 6:30–7:15 — Cloud, arquitetura e QA

Explique o fluxo:

```text
ESP32/Wokwi → HTTPS → Render/Express → Aiven MySQL
                            ↓
                  Dashboard + regras + Física
```

Cite C4, Strategy, Observer e SOLID. A baseline funcional final foi validada na **CI #152** com **110 testes / 109 aprovados / 1 skip / 0 falhas**, **5/5 E2E**, integração MySQL e build Docker aprovados.

Se houver tempo, abra `/api/health` para comprovar backend público e banco disponível.

### 7:15–8:00 — demonstração da caixa física offline

Mostre o **coração** dentro da caixa. Explique que o ESP32 real é uma **maquete eletrônica independente, sem Wi-Fi e sem conexão com o dashboard**. No OLED, destaque **ÓRGÃO: CORAÇÃO**, temperatura, **FAIXA: 4°C A 8°C**, impacto e **CENÁRIO: NORMAL/ALERTA**. Convide alguém a girar o potenciômetro de temperatura ou impacto: LED verde indica cenário normal; temperatura fora da faixa ou impacto ≥ 3,5g aciona LED vermelho e buzzer com transporte demonstrativo ativo. Os valores são simulados pelos controles, não medidos no órgão.

**Fala sugerida:** “A integração online que vocês viram é demonstrada pelo Wokwi. Aqui temos a versão física interativa: vocês podem alterar temperatura e impacto simulados e observar o circuito responder em tempo real. Esta caixa funciona localmente e não transmite dados ao dashboard.”

### 8:00–9:00 — fechamento e perguntas

Encerre reforçando que a LifeBox combina monitoramento e decisão logística no software com uma demonstração física dos atuadores. Não apresente a caixa local como telemetria conectada.

## Frase de fechamento sugerida

> A proposta da LifeBox não é apenas monitorar uma caixa. É integrar o estado físico do transporte, rastreabilidade e otimização logística em uma única plataforma de apoio à decisão.

## DEMO como plano B

O modo DEMO continua disponível e usa o mesmo planejamento, reotimização, Física e resumo final, mas a telemetria ambiental é produzida pelo simulador.

No DEMO, os cenários manuais de temperatura, impacto, umidade, bateria e sinal podem ser usados para mostrar rapidamente alertas críticos. No IOT, esses estados devem ser provocados pelos sensores do Wokwi.

## Plano B sem internet

Se Render, Wokwi ou tiles do OpenStreetMap não estiverem acessíveis, mantenha a **caixa física offline** para a demonstração de temperatura, impacto e atuadores e use as evidências versionadas em [`docs/evidencias`](evidencias/README.md) e o relatório técnico salvo localmente. Continue demonstrando PO, isquemia, Física, alertas, reotimização, arquitetura e Cloud a partir das capturas.

Pacotes finais disponíveis:

- [`evidencias/iot`](evidencias/iot/README.md) — IoT `9/9`;
- [`evidencias/cloud`](evidencias/cloud/README.md) — Cloud `8/8`;
- [`evidencias/eletronica`](evidencias/eletronica/README.md) — Logisim e Flip-Flop.

## Modelo legado

O modelo A/B/C de score ponderado permanece apenas para compatibilidade/histórico nos endpoints `/api/otimizacao`. Ele não faz parte da demonstração principal. A PO atual é o planejamento multimodal em `/api/planejamento`.
