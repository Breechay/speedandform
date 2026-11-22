// Return the minimum accepted fields. Raw samples, routes and sensor series never leave the gateway.
const metrics = {
  activityDetails:['startTimeInSeconds','durationInSeconds','distanceInMeters','averageHeartRateInBeatsPerMinute','maxHeartRateInBeatsPerMinute'],
  sleeps:['startTimeInSeconds','durationInSeconds','deepSleepDurationInSeconds','lightSleepDurationInSeconds','remSleepInSeconds','awakeDurationInSeconds'],
  hrv:['startTimeInSeconds','durationInSeconds','lastNightAvg','lastNight5MinHigh'],
  dailies:['startTimeInSeconds','durationInSeconds','steps','restingHeartRateInBeatsPerMinute'],
};
export function projectFeed(kind, item) {
  if (!Object.hasOwn(metrics,kind) || !item || typeof item.userId !== 'string' || !item.userId.trim() || item.userId.length>256 ||
      typeof item.summaryId !== 'string' || !item.summaryId.trim() || item.summaryId.length>256) throw Error('invalid_summary');
  const result={userId:item.userId,summaryId:item.summaryId};
  const values=kind==='activityDetails'?item.summary:item;
  if (!values || typeof values!=='object' || Array.isArray(values)) throw Error('invalid_summary');
  if (kind==='activityDetails') {
    if (typeof item.activityId !== 'string' || !/^[A-Za-z0-9_.:-]{1,128}$/.test(item.activityId)) throw Error('invalid_id');
    result.activityId=item.activityId;
    if (typeof values.activityType==='string' && /^[A-Z_]{1,80}$/.test(values.activityType)) result.activityType=values.activityType;
  } else {
    if (typeof item.calendarDate!=='string'|| !/^\d{4}-\d{2}-\d{2}$/.test(item.calendarDate)) throw Error('invalid_date');
    result.calendarDate=item.calendarDate;
  }
  for (const field of metrics[kind]) if (Number.isFinite(values[field]) && values[field]>=0) result[field]=values[field];
  return result;
}
