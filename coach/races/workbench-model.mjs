const EDITABLE = [
  'name','starts_on','ends_on','city','venue','official_url','brief',
  'brief_source_url','course_overview','full_course','half_course',
  'start_address','start_time','cover_image_url','cover_image_alt',
  'cover_rights_confirmed','source_checked_at'
];

const LIMITS = {name:240,city:180,venue:250,brief:240,course_overview:500,
  full_course:500,half_course:500,start_address:500,start_time:180};

const MEDIA_ORIGIN='https://pbgsjjegycacodiltbhn.supabase.co';
const UUID_PATTERN='[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

function validDate(value){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return false;
  const date=new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;
}

export function isRaceCoverUrl(value,eventId){
  if(!value||!new RegExp(`^${UUID_PATTERN}$`).test(eventId||''))return false;
  try{
    const url=new URL(value);
    const path=new RegExp(`^/storage/v1/object/public/collective-media/races/${eventId}/${UUID_PATTERN}\\.(jpg|png|webp)$`);
    return url.origin===MEDIA_ORIGIN&&!url.username&&!url.password&&!url.search&&!url.hash&&path.test(url.pathname);
  }catch{return false;}
}

export function wordCount(value){return String(value||'').trim().split(/\s+/u).filter(Boolean).length;}

export function normalizePayload(input={}) {
  const result={};
  for(const field of EDITABLE) {
    if(field==='cover_rights_confirmed')result[field]=input[field]===true;
    else result[field]=String(input[field]??'').trim()||null;
  }
  return result;
}

export function validatePayload(data,{publish=false,eventId=null}={}) {
  const d=normalizePayload(data),errors=[];
  if(!d.name)errors.push('Name the race.');
  for(const [field,max] of Object.entries(LIMITS))if((d[field]||'').length>max)
    errors.push(`${field.replaceAll('_',' ')} is too long (max ${max}).`);
  if(!validDate(d.starts_on)||!validDate(d.ends_on)||
     d.starts_on>d.ends_on)errors.push('Enter valid start and end dates.');
  for(const key of ['official_url','brief_source_url']) {
    if(d[key]){
      try{const u=new URL(d[key]);if(u.protocol!=='https:'||!u.hostname||u.username||u.password)throw Error();}
      catch{errors.push(`${key.replaceAll('_',' ')} must be an HTTPS link.`);}
    }
  }
  if(d.cover_image_url&&!isRaceCoverUrl(d.cover_image_url,eventId))errors.push('Use a cover uploaded to this race.');
  if(d.source_checked_at && (!validDate(d.source_checked_at)||
      d.source_checked_at>new Date().toISOString().slice(0,10)))errors.push('Source check date must be valid and not in the future.');
  if(publish){
    if(!d.source_checked_at)errors.push('Record when you checked the organizer facts.');
    if(d.brief&&!d.brief_source_url)errors.push('Attribute the race introduction to a source.');
    if(d.cover_image_url&&(!d.cover_rights_confirmed||!d.cover_image_alt))errors.push('Confirm cover rights and describe the photograph.');
  }
  return {payload:d,errors};
}

export function validateWorkbench(data){
  if(data?.schema_version!==1||!Array.isArray(data.events))throw Error('Unsupported race workbench response.');
  for(const row of data.events)if(!row.event_id||!row.published||!Number.isInteger(row.draft_revision))
    throw Error('Incomplete race workbench response.');
  return data;
}

export function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export function safeHttps(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;}catch{return null;}}
export const EDITABLE_FIELDS=Object.freeze(EDITABLE.slice());
