# Integração futura com ESP32

Esta pasta contém somente uma representação da integração futura. Nenhum sensor físico foi testado.

O ESP32 deverá ler DHT22 ou sensor térmico equivalente, MPU6050 e GPS NEO-6M, construir o JSON documentado em `docs/telemetry-contract.md` e enviá-lo para `POST /api/telemetria`.

Antes de uso físico será necessário configurar Wi-Fi, endereço do notebook, bibliotecas, pinos, calibração, autenticação e tolerância a falhas.

