# Evidências finais — IoT / Wokwi

Esta pasta está **pronta para receber as capturas reais da integração ESP32/Wokwi**. O fluxo já foi validado; as imagens abaixo servem para fechar o GitHub, apresentação e relatório.

## Padrão de arquivos

| Arquivo | O que deve aparecer | Status do sistema | Upload |
| --- | --- | --- | --- |
| `01-wokwi-dispositivo.png` | ESP32 e componentes do projeto Wokwi em execução. | VALIDADO | PENDENTE |
| `02-esp32-online-dashboard.png` | dashboard no modo IOT com ESP32 ONLINE. | VALIDADO | PENDENTE |
| `03-telemetria-iot.png` | temperatura, umidade, impacto, bateria, sinal e GPS recebidos do Wokwi. | VALIDADO | PENDENTE |
| `04-graficos-iot.png` | gráficos de telemetria preenchidos durante a execução IOT. | VALIDADO | PENDENTE |
| `05-fisica-iot.png` | Análise Física usando leituras da execução IoT. | VALIDADO | PENDENTE |
| `06-condicao-logistica-iot.png` | condição logística ativa durante IOT, com sensores ainda vindos do ESP32. | VALIDADO | PENDENTE |
| `07-reotimizacao-iot.png` | recomendação/aplicação de novo plano em modo IOT. | VALIDADO | PENDENTE |
| `08-resumo-final-iot.png` | resumo final com telemetria/ocorrências da execução IOT. | VALIDADO | PENDENTE |
| `09-atuadores-wokwi.png` | LED/buzzer/OLED reagindo ao `digitalSignal`, se quiser incluir a prova de Eletrônica. | VALIDADO | PENDENTE |

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

## Depois do upload

Salve as imagens nesta pasta com **exatamente os nomes definidos acima**. Depois, altere a coluna `Upload` de `PENDENTE` para `OK` e, se desejar, inclua miniaturas no catálogo geral em [`../README.md`](../README.md).

Documentação relacionada: [`../../iot.md`](../../iot.md), [`../../../firmware/README.md`](../../../firmware/README.md) e [`../../testing-and-qa.md`](../../testing-and-qa.md).
