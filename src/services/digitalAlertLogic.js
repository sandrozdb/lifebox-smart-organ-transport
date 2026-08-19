function evaluateDigitalAlert({ transportActive, temperatureCritical, impactCritical }) {
  const criticalCondition = Boolean(temperatureCritical || impactCritical);
  const alertOutput = Boolean(transportActive && criticalCondition);
  return { transportActive: Boolean(transportActive), temperatureCritical: Boolean(temperatureCritical), impactCritical: Boolean(impactCritical), criticalCondition, alertOutput, ledOn: alertOutput, buzzerOn: alertOutput };
}
module.exports = { evaluateDigitalAlert };