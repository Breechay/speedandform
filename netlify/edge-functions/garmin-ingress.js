import { receive } from '../../garmin-push/receive.mjs';

// Evaluate only Netlify's connection metadata. Request headers never supply the peer address.
function ipv4Number(input) {
  if (typeof input !== 'string' || !/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(input)) return null;
  const parts=input.split('.').map(Number);
  return parts.some(n=>n>255) ? null : parts.reduce((value,n)=>value*256+n,0);
}
export function sourceRejection(ip,ranges) {
  if (!ranges) return 'missing_source_ranges';
  const peer=ipv4Number(typeof ip==='string' ? ip.replace(/^::ffff:/i,'') : '');
  if (peer===null) return 'missing_client_ip';
  let allowed=false;
  for(const item of ranges.split(',')) {
    const [address,bits,extra]=item.trim().split('/');
    const network=ipv4Number(address);
    if (extra!==undefined || network===null || !/^(2[0-9]|3[0-2])$/.test(bits??'')) return 'invalid_source_ranges';
    const block=2**(32-Number(bits));
    if (Math.floor(peer/block)===Math.floor(network/block)) allowed=true;
  }
  return allowed?null:'source_outside_ranges';
}
export default function gateway(request,context) {
  const env = {};
  for (const name of ['GARMIN_PUSH_ENABLED','GARMIN_LIFECYCLE_ENABLED','FORM_GARMIN_SOURCE_RANGES','GARMIN_GATEWAY_TOKEN','FORM_SUPABASE_PUBLISHABLE_KEY'])
    env[name]=Netlify.env.get(name);
  return receive(request,{ip:context.ip,sourceRejection},env,fetch);
}
export const config={path:'/integrations/garmin/activities'};
