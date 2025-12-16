import { crawlWebsite } from "../services/linkAuditService.js";
import { getPerformanceData } from "../services/pageSpeedService.js";
import { auditTracking } from "../services/trackingAuditService.js";

export const auditWebsite = async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({
      success: false,
      message: "URL is required",
      brokenLinks: [],
      basicSeoChecks: [],
      ormChecks: [],
      performance: null,
      tracking: null,
    });
  }

  try {
    console.log("Audit started:", url);

    // 🔹 Run audits in parallel
    const [crawlResult, performanceResult, trackingResult] =
      await Promise.all([
        crawlWebsite(url, 5),
        getPerformanceData(url).catch((err) => {
          console.error("PageSpeed error:", err.message);
          return null; // 👈 fallback
        }),
        auditTracking(url).catch((err) => {
          console.error("Tracking error:", err.message);
          return null;
        }),
      ]);

    return res.status(200).json({
      success: true,
      message: "Audit completed",
      brokenLinks: crawlResult.brokenLinks || [],
      basicSeoChecks: crawlResult.basicSeoChecks || [],
      ormChecks: crawlResult.ormChecks || [],
      performance: performanceResult,
      tracking: trackingResult,
    });
  } catch (error) {
    console.error("Audit error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Audit failed",
      brokenLinks: [],
      basicSeoChecks: [],
      ormChecks: [],
      performance: null,
      tracking: null,
    });
  }
};
