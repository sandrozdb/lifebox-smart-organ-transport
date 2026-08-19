class TimelineAlertObserver {
  constructor(repository) { this.repository = repository; }
  async update({ alert, reading }) {
    await this.repository.createEvento({ transporteId: alert.transporte_id ?? alert.transporteId, tipoEvento: `ALERTA_${alert.tipo}`, descricao: alert.mensagem, latitude: reading.latitude, longitude: reading.longitude });
  }
}
module.exports = { TimelineAlertObserver };