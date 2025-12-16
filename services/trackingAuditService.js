import axios from "axios";
import * as cheerio from "cheerio";

const axiosConfig = {
  headers: {
    "User-Agent": "Mozilla/5.0 Chrome/120",
  },
  timeout: 10000,
};

export async function auditTracking(url) {
  try {
    const res = await axios.get(url, axiosConfig);
    const html = res.data;
    const $ = cheerio.load(html);

    const scripts = $("script")
      .map((_, el) => $(el).html() || $(el).attr("src") || "")
      .get()
      .join(" ");

    // --- GTM ---
    const gtmPresent = scripts.includes("googletagmanager.com/gtm.js");

    // --- GA4 ---
    const ga4Hardcoded = scripts.includes("gtag('config'");
    const ga4ViaGtm = gtmPresent && scripts.includes("G-");

    // --- META PIXEL ---
    const metaHardcoded = scripts.includes("fbq('init'");
    const metaViaGtm =
      gtmPresent && scripts.toLowerCase().includes("facebook");

    return {
      pageUrl: url,
      ga4Present: ga4Hardcoded || ga4ViaGtm,
      ga4Source: ga4Hardcoded
        ? "Hard-coded"
        : ga4ViaGtm
        ? "Via GTM"
        : "Not Found",

      gtmPresent: gtmPresent ? "Yes" : "No",

      metaPixelPresent: metaHardcoded || metaViaGtm,
      metaPixelSource: metaHardcoded
        ? "Hard-coded"
        : metaViaGtm
        ? "Via GTM"
        : "Not Found",
    };
  } catch (error) {
    console.error("Tracking audit error:", error.message);
    return {
      pageUrl: url,
      ga4Present: "Error",
      gtmPresent: "Error",
      metaPixelPresent: "Error",
    };
  }
}
