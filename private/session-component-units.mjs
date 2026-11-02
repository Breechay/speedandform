// The session component's distance unit is also its pace unit.
// This is not necessarily the session-level total-distance unit.
export function componentDisplayUnit(part = {}) {
  const unit = part.distance_unit ?? part.distanceUnit;
  return unit === 'km' ? 'km' : 'mi';
}

export function componentPaceLabels(part = {}) {
  const unit = componentDisplayUnit(part);
  return {
    distance: `Distance (${unit})`,
    fast: `Band fast (min/${unit})`,
    slow: `Band slow (min/${unit})`
  };
}
