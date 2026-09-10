# Evidências finais — IoT / Wokwi

Esta pasta contém o **pacote final de nove capturas da integração ESP32/Wokwi** para GitHub, apresentação e relatório.

Status do pacote: **IoT 9/9 — CONCLUÍDO**.

## Arquivos

| Arquivo | O que aparece | Status |
| --- | --- | --- |
| `01-wokwi-dispositivo.png` | ESP32 e componentes do projeto Wokwi em execução | VALIDADO |
| `02-esp32-online-dashboard.png` | dashboard no modo IOT com ESP32 ONLINE | VALIDADO |
| `03-telemetria-iot.png` | temperatura, umidade, impacto, bateria, sinal e GPS recebidos do Wokwi | VALIDADO |
| `04-graficos-iot.png` | gráficos com telemetria durante a execução IOT | VALIDADO |
| `05-fisica-iot.png` | análise física da execução IoT | VALIDADO |
| `06-condicao-logistica-iot.png` | condição logística durante IOT com ESP32 ONLINE | VALIDADO |
| `07-reotimizacao-iot.png` | reotimização recomendada em modo IOT com ESP32 ONLINE | VALIDADO |
| `08-resumo-final-iot.png` | resumo final da execução concluída | VALIDADO |
| `09-atuadores-wokwi.png` | atuadores do Wokwi acionados | VALIDADO |

## URLs de reprodução

Aplicação pública:

`https://lifebox-expotech.onrender.com`

Projeto Wokwi:

`https://wokwi.com/projects/473749722940837889`

Para reproduzir a demonstração:

1. selecione `ESP32 / WOKWI`;
2. inicie uma nova execução;
3. confirme o dispositivo online e a telemetria chegando;
4. aguarde alguns ciclos para preencher os gráficos;
5. abra a Análise Física;
6. ative uma Condição Logística;
7. use `Transporte terrestre indisponível` para demonstrar reotimização;
8. finalize e confira o resumo final.

## O que as imagens comprovam

- sensores da caixa não são forçados pelos botões do dashboard no modo IOT;
- valores ambientais vêm do ESP32/Wokwi;
- Condições Logísticas continuam disponíveis porque são eventos externos à caixa;
- a reotimização funciona durante IOT;
- gráficos e Física usam a telemetria da execução atual;
- o resumo final contém agregados quando existem leituras IoT válidas;
- o backend permanece como fonte de verdade das regras e do vínculo com a execução.

## Segurança e privacidade

As capturas finais foram selecionadas sem expor senhas, variáveis sensíveis, connection strings privadas, certificados ou tokens.

## Referência funcional de fechamento

- baseline: `1a2dbd7e85bdce0def0d02ff3b5b68257cb11fb2`
- CI: **#152 SUCCESS**
- pacote IoT: **9/9**
- pacote Cloud: **8/8**
- E2E: **5/5**

Alterações posteriores exclusivamente documentais podem gerar novas execuções de CI sem alterar essa baseline funcional.

Documentação relacionada: [`../../iot.md`](../../iot.md), [`../../../firmware/README.md`](../../../firmware/README.md) e [`../../testing-and-qa.md`](../../testing-and-qa.md).
