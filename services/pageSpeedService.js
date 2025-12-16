import axios from "axios";

const API_KEY = process.env.PAGESPEED_API_KEY;
const API_URL = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

/* =======================
   FETCH PAGESPEED DATA
======================= */
async function fetchPageSpeed(url, strategy) {
  const res = await axios.get(API_URL, {
    params: {
      url,
      strategy, // mobile | desktop
      key: API_KEY,
    },
  });

  return res.data;
}

/* =======================
   MAIN PERFORMANCE AUDIT
======================= */
export async function getPerformanceData(url) {
  try {
    const mobileData = await fetchPageSpeed(url, "mobile");
    const desktopData = await fetchPageSpeed(url, "desktop");

    const getMetric = (data, key) =>
      data.lighthouseResult.audits[key]?.numericValue || null;

    return {
      mobileScore: Math.round(
        mobileData.lighthouseResult.categories.performance.score * 100
      ),
      desktopScore: Math.round(
        desktopData.lighthouseResult.categories.performance.score * 100
      ),
      lcp: (getMetric(mobileData, "largest-contentful-paint") / 1000).toFixed(2),
      cls: getMetric(mobileData, "cumulative-layout-shift").toFixed(2),
      tbt: Math.round(getMetric(mobileData, "total-blocking-time")),
    };
  } catch (error) {
    console.error("PageSpeed FULL ERROR:", error.response?.data || error.message);

    return {
      error: true,
      message: "PageSpeed API failed",
      mobileScore: null,
      desktopScore: null,
      lcp: null,
      cls: null,
      tbt: null,
    };
  }
}
