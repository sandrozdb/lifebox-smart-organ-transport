# Evidências finais — IoT / Wokwi

Esta pasta contém o **pacote final de nove capturas da integração ESP32/Wokwi** para GitHub, apresentação e relatório.

Status do pacote: **IoT 9/9**.

## Padrão de arquivos

| Arquivo | O que deve aparecer | Status do sistema | Upload |
| --- | --- | --- | --- |
| `01-wokwi-dispositivo.png` | ESP32 e componentes do projeto Wokwi em execução. | VALIDADO | OK |
| `02-esp32-online-dashboard.png` | dashboard no modo IOT com ESP32 ONLINE. | VALIDADO | OK |
| `03-telemetria-iot.png` | temperatura, umidade, impacto, bateria, sinal e GPS recebidos do Wokwi. | VALIDADO | OK |
| `04-graficos-iot.png` | gráficos com telemetria real durante a execução IOT. | VALIDADO | OK |
| `05-fisica-iot.png` | análise física da execução IoT. | VALIDADO | OK |
| `06-condicao-logistica-iot.png` | condição logística durante IOT com ESP32 ONLINE. | VALIDADO | OK |
| `07-reotimizacao-iot.png` | reotimização recomendada em modo IOT com ESP32 ONLINE. | VALIDADO | OK |
| `08-resumo-final-iot.png` | resumo final da execução concluída. | VALIDADO | OK |
| `09-atuadores-wokwi.png` | atuadores do Wokwi acionados. | VALIDADO | OK |

## Como capturar

Use preferencialmente 1920×1080, zoom 100% e a aplicação pública atual:

`https://lifebox-expotech.onrender.com`

Projeto Wokwi:

`https://wokwi.com/projects/473749722940837889`

Para as capturas de execução:

1. selecione `ESP32 / WOKWI`;
2. inicie uma nova execução;
3. confirme o dispositivo online e telemetria chegando;
4. aguarde alguns ciclos para preencher os gráficos;
5. abra a Análise Física;
6. ative uma Condição Logística, como `Trânsito intenso`;
7. para prova mais forte, use `Transporte terrestre indisponível` e aplique a nova rota;
8. finalize e capture o resumo final.

## O que deve ficar claro nas imagens

- sensores da caixa não estão sendo forçados pelos botões do dashboard no modo IOT;
- valores ambientais vêm do ESP32/Wokwi;
- Condições Logísticas continuam disponíveis porque são eventos externos à caixa;
- a reotimização funciona durante IOT;
- gráficos e Física usam a telemetria da execução atual;
- o resumo final não fica com agregados zerados quando existem leituras IoT válidas;
- o backend permanece como fonte de verdade das regras e do vínculo com a execução.

## Segurança e privacidade

Não inclua em capturas:

- senhas;
- variáveis sensíveis;
- connection strings privadas;
- certificados;
- tokens.

## Referência de fechamento

- `main`: `7d3ce046836ff2266701e48e6ec9666b7dba555a`
- CI: `#147 SUCCESS`
- Pacote IoT: `9/9`
- Pacote Cloud: `8/8`

Documentação relacionada: [`../../iot.md`](../../iot.md), [`../../../firmware/README.md`](../../../firmware/README.md) e [`../../testing-and-qa.md`](../../testing-and-qa.md).
