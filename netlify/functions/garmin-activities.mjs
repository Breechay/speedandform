import { receive as receiveCore } from '../../garmin-push/receive.mjs';
import { BlockList, isIPv4, isIP } from 'node:net';

// Source networks are supplied from the partner portal in runtime configuration.
function sourceRejection(ip, ranges) {
  const family = isIP(ip ?? '');
  if (!family) return 'missing_client_ip';
  if (!ranges) return 'missing_source_ranges';
  const sources = new BlockList();
  for (const cidr of ranges.split(',')) {
    const [network, bits, extra] = cidr.trim().split('/');
    if (extra !== undefined || !isIPv4(network) || !/^(2[0-9]|3[0-2])$/.test(bits ?? '')) return 'invalid_source_ranges';
    sources.addSubnet(network, Number(bits), 'ipv4');
  }
  return sources.check(ip, family === 4 ? 'ipv4' : 'ipv6') ? null : 'source_outside_ranges';
}

export function receive(request, context, env, send) {
  return receiveCore(request,{ip:context.ip,sourceRejection},env,send);
}
export default (request, context) => receive(request, context, process.env, fetch);
export const config = { path: ['/integrations/garmin/activities','/integrations/garmin/activityDetails','/integrations/garmin/sleeps','/integrations/garmin/hrv','/integrations/garmin/dailies','/integrations/garmin/userPermissionsChange','/integrations/garmin/deregistrations'] };
