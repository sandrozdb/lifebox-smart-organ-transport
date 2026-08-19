# Arquitetura da LifeBox

## Visão geral

A arquitetura da LifeBox foi pensada para separar a coleta dos dados físicos, o processamento, o armazenamento e a visualização das informações.

```text
Sensores
  ↓
ESP32
  ↓
API REST
  ↓
MySQL
  ↓
Dashboard Web
  ↓
Alertas e acompanhamento remoto
```

## Componentes

### Camada física
Responsável pela coleta de temperatura, umidade, impactos e localização.

### Microcontrolador
O ESP32 recebe as leituras dos sensores e prepara os dados para envio.

### API
Responsável por receber as leituras, validar os dados e disponibilizá-los para o sistema.

### Banco de dados
O MySQL armazena o histórico das medições e eventos de transporte.

### Dashboard
Interface web para acompanhamento das condições da LifeBox e consulta do histórico.

## Evolução prevista

O projeto será implementado de forma incremental. O primeiro MVP poderá utilizar dados simulados para validar API, banco e dashboard antes da integração completa com o hardware físico.
