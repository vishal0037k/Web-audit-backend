import { Parser } from "json2csv";

export function generateAuditCSV(data) {
  const rows = [];

  /* =====================
     BROKEN LINKS
  ===================== */
  data.brokenLinks.forEach(link => {
    rows.push({
      section: "Broken Links",
      pageUrl: link.pageUrl,
      detail: link.faultyLink,
      status: link.statusCode,
      note: link.comment,
    });
  });

  /* =====================
     BASIC SEO
  ===================== */
  data.basicSeoChecks.forEach(seo => {
    rows.push({
      section: "SEO",
      pageUrl: seo.pageUrl,
      detail: `H1 Count: ${seo.h1Count}`,
      status: seo.titlePresent ? "Title OK" : "Missing Title",
      note: seo.metaDescriptionPresent
        ? "Meta OK"
        : "Missing Meta Description",
    });
  });

  /* =====================
     ORM / FORMS
  ===================== */
  data.ormChecks.forEach(form => {
    rows.push({
      section: "Forms",
      pageUrl: form.pageUrl,
      detail: `Form #${form.formIndex}`,
      status: form.submitClickable ? "Clickable" : "Disabled",
      note: form.issue,
    });
  });

  /* =====================
     PERFORMANCE
  ===================== */
  if (data.performance) {
    rows.push({
      section: "Performance",
      pageUrl: data.url,
      detail: "Mobile Score",
      status: data.performance.mobileScore,
      note: "",
    });

    rows.push({
      section: "Performance",
      pageUrl: data.url,
      detail: "Desktop Score",
      status: data.performance.desktopScore,
      note: "",
    });
  }

  /* =====================
     TRACKING
  ===================== */
  if (data.tracking) {
    rows.push({
      section: "Tracking",
      pageUrl: data.url,
      detail: "GA4",
      status: data.tracking.ga4Present ? "Yes" : "No",
      note: data.tracking.ga4Source,
    });

    rows.push({
      section: "Tracking",
      pageUrl: data.url,
      detail: "GTM",
      status: data.tracking.gtmPresent ? "Yes" : "No",
      note: data.tracking.gtmSource,
    });
  }

  const parser = new Parser({
    fields: ["section", "pageUrl", "detail", "status", "note"],
  });

  return parser.parse(rows);
}
