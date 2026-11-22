// Netlify's project firewall checks the source before invoking this diagnostic.
export default function activityProbe(request) {
  if (request.method !== "POST") {
    return new Response(null, {
      status: 405,
      headers: { Allow: "POST", "Cache-Control": "no-store" },
    });
  }

  console.info("form_garmin_ingress_probe_post_v1");
  return new Response(null, {
    status: 503,
    headers: { "Cache-Control": "no-store" },
  });
}

export const config = { path: "/integrations/garmin/activities" };
