const config = require("../config");

const plans = new Map();
const clamp = (value) => Math.max(0, Math.min(1, value));
const samePoint = (a, b) =>
  a && b && a.latitude === b.latitude && a.longitude === b.longitude;
const linePoint = (a, b, progress) => ({
  latitude: a.latitude + (b.latitude - a.latitude) * progress,
  longitude: a.longitude + (b.longitude - a.longitude) * progress,
});
function geometryFor(segment) {
  const geometry =
    segment.geometry?.length >= 2
      ? segment.geometry
      : [segment.origin, segment.destination];
  return geometry.filter(Boolean);
}
function pointOnGeometry(geometry, progress) {
  if (geometry.length === 1) return geometry[0];
  const portions = geometry
    .slice(1)
    .map((point, index) =>
      Math.hypot(
        point.latitude - geometry[index].latitude,
        point.longitude - geometry[index].longitude,
      ),
    );
  const total = portions.reduce((sum, value) => sum + value, 0) || 1;
  let remaining = clamp(progress) * total;
  for (let index = 0; index < portions.length; index++) {
    if (remaining <= portions[index] || index === portions.length - 1) {
      return linePoint(
        geometry[index],
        geometry[index + 1],
        portions[index] ? remaining / portions[index] : 0,
      );
    }
    remaining -= portions[index];
  }
  return geometry.at(-1);
}
function geometryUntil(geometry, progress) {
  if (!geometry.length) return [];
  if (progress <= 0) return [geometry[0]];
  const portions = geometry
    .slice(1)
    .map((point, index) =>
      Math.hypot(
        point.latitude - geometry[index].latitude,
        point.longitude - geometry[index].longitude,
      ),
    );
  const total = portions.reduce((sum, value) => sum + value, 0) || 1;
  let remaining = clamp(progress) * total;
  const path = [geometry[0]];
  for (let index = 0; index < portions.length; index++) {
    if (remaining >= portions[index]) {
      path.push(geometry[index + 1]);
      remaining -= portions[index];
    } else {
      path.push(
        linePoint(
          geometry[index],
          geometry[index + 1],
          portions[index] ? remaining / portions[index] : 0,
        ),
      );
      break;
    }
  }
  return path;
}
function appendPath(target, points) {
  for (const point of points)
    if (!samePoint(target.at(-1), point)) target.push(point);
  return target;
}
function buildSegments(plan, result) {
  const points = Object.fromEntries(
    [result.origin, result.destination, ...(plan.facilities || [])].map(
      (point) => [point.name, point],
    ),
  );
  let operationalMinutes = 0;
  const movingSegments = [];
  for (const segment of plan.segments) {
    if (segment.distanceKm <= 0) {
      operationalMinutes += Number(segment.timeMin || 0);
      continue;
    }
    movingSegments.push({
      ...segment,
      timeMin: Number(segment.timeMin || 0) + operationalMinutes,
    });
    operationalMinutes = 0;
  }
  if (operationalMinutes && movingSegments.length)
    movingSegments.at(-1).timeMin += operationalMinutes;
  return movingSegments
    .map((segment, index) => ({
      index,
      from: segment.from,
      to: segment.to,
      modal: segment.modal,
      distanceKm: segment.distanceKm,
      timeMin: segment.timeMin,
      cost: segment.cost,
      origin: segment.origin || points[segment.from],
      destination: segment.destination || points[segment.to],
      geometry: segment.geometry,
      progress: 0,
      status: index ? "PENDENTE" : "EM_ANDAMENTO",
    }))
    .filter((segment) => segment.origin && segment.destination);
}
function snapshot(state) {
  if (!state) return null;
  const current =
    state.segments[state.currentSegmentIndex] || state.segments.at(-1);
  const currentGeometry = current ? geometryFor(current) : [];
  const currentPosition = current
    ? pointOnGeometry(currentGeometry, current.progress)
    : state.destination;
  const remainingPlanDistance = state.segments.reduce(
    (sum, segment) => sum + segment.distanceKm,
    0,
  );
  const currentPlanTraveled = state.segments.reduce(
    (sum, segment) => sum + segment.distanceKm * segment.progress,
    0,
  );
  const historicalDistanceKm = state.historicalDistanceKm || 0;
  const totalDistanceKm = historicalDistanceKm + remainingPlanDistance;
  const traveledKm = historicalDistanceKm + currentPlanTraveled;
  const remainingKm = Math.max(0, remainingPlanDistance - currentPlanTraveled);
  const remainingPlanMinutes = state.segments.reduce(
    (sum, segment) => sum + segment.timeMin * (1 - segment.progress),
    0,
  );
  const remainingPlanCost = state.segments.reduce(
    (sum, segment) => sum + Number(segment.cost || 0) * (1 - segment.progress),
    0,
  );
  const remainingPath = state.segments.reduce(
    (path, segment) => appendPath(path, geometryFor(segment)),
    [],
  );
  const currentPath = [];
  for (const segment of state.segments) {
    appendPath(
      currentPath,
      geometryUntil(geometryFor(segment), segment.progress),
    );
    if (segment.progress < 1) break;
  }
  const historicalPath = state.historicalPath || [];
  const totalPath = appendPath([...historicalPath], remainingPath);
  const traveledPath = appendPath([...historicalPath], currentPath);
  const elapsedMinutes = state.simulationElapsedSeconds / 60;
  return JSON.parse(
    JSON.stringify({
      ...state,
      currentSegment: current
        ? { ...current, position: currentPosition }
        : null,
      currentPosition,
      totalPath,
      traveledPath,
      totalDistanceKm,
      traveledKm,
      remainingKm,
      remainingPlanMinutes,
      remainingPlanCost,
      totalProgress: totalDistanceKm ? traveledKm / totalDistanceKm : 1,
      transportElapsedMinutes: elapsedMinutes,
      ischemiaTotalMinutes: state.initialConsumedMinutes + elapsedMinutes,
      remainingMarginMinutes:
        state.maximumIschemiaMinutes -
        state.initialConsumedMinutes -
        elapsedMinutes,
    }),
  );
}
function freeze(id, plan, result) {
  const state = {
    transporteId: Number(id),
    planId: plan.id,
    planName: plan.name,
    modal: plan.modal,
    origin: result.origin,
    destination: result.destination,
    segments: buildSegments(plan, result),
    currentSegmentIndex: 0,
    simulationElapsedSeconds: 0,
    historicalPath: [],
    historicalDistanceKm: 0,
    initialConsumedMinutes: result.consumedMinutes,
    initialPlan: { id: plan.id, nome: plan.name, modal: plan.modal },
    organProfile: result.profile,
    maximumIschemiaMinutes: result.profile.ischemia.officialMaxMinutes,
    operationalSafetyMarginMinutes:
      result.profile.ischemia.operationalSafetyMarginMinutes,
  };
  plans.set(Number(id), state);
  return snapshot(state);
}
function replace(id, plan, result) {
  const state = plans.get(Number(id));
  if (!state)
    throw Object.assign(new Error("Não há execução ativa para reotimizar."), {
      status: 409,
    });
  const before = snapshot(state);
  const historicalPath = before.traveledPath;
  state.historicalPath = historicalPath;
  state.historicalDistanceKm = before.traveledKm;
  state.origin = result.origin;
  state.destination = result.destination;
  state.planId = plan.id;
  state.planName = plan.name;
  state.modal = plan.modal;
  state.segments = buildSegments(plan, result);
  state.currentSegmentIndex = 0;
  return snapshot(state);
}
function advance(id, realElapsedSeconds) {
  const state = plans.get(Number(id));
  if (!state) return null;
  const delta =
    Math.max(0, Number(realElapsedSeconds) || 0) * config.simulationTimeScale;
  state.simulationElapsedSeconds += delta;
  let remaining = delta / 60;
  while (remaining > 0 && state.segments[state.currentSegmentIndex]) {
    const segment = state.segments[state.currentSegmentIndex];
    const needed = (1 - segment.progress) * segment.timeMin;
    if (remaining >= needed) {
      segment.progress = 1;
      segment.status = "CONCLUIDO";
      remaining -= needed;
      state.currentSegmentIndex++;
      if (state.segments[state.currentSegmentIndex])
        state.segments[state.currentSegmentIndex].status = "EM_ANDAMENTO";
    } else {
      segment.progress = clamp(segment.progress + remaining / segment.timeMin);
      remaining = 0;
    }
  }
  return snapshot(state);
}
function finish(id) {
  const state = plans.get(Number(id));
  if (!state) return null;
  state.segments.forEach((segment) => {
    segment.progress = 1;
    segment.status = "CONCLUIDO";
  });
  state.currentSegmentIndex = state.segments.length;
  return snapshot(state);
}
module.exports = {
  freeze,
  replace,
  advance,
  finish,
  get: (id) => snapshot(plans.get(Number(id))),
  reset: (id) => plans.delete(Number(id)),
  timeScale: () => config.simulationTimeScale,
};
