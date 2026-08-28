class AlertNotifier {
  constructor() {
    this.observers = new Set();
  }
  subscribe(observer) {
    this.observers.add(observer);
    return () => this.observers.delete(observer);
  }
  async notify(event) {
    for (const observer of this.observers) await observer.update(event);
  }
}
module.exports = { AlertNotifier };
