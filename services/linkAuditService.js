import axios from "axios";
import * as cheerio from "cheerio";
import { normalizeUrl } from "../utils/urlUtils.js";

/* =======================
   AXIOS CONFIG
======================= */
const axiosConfig = {
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120",
  },
  timeout: 10000,
  maxRedirects: 5,
  validateStatus: () => true,
};

/* =======================
   FETCH PAGE
======================= */
async function fetchPage(url) {
  try {
    const res = await axios.get(url, axiosConfig);
    return res.data;
  } catch {
    return null;
  }
}

/* =======================
   CHECK LINK STATUS
======================= */
async function checkLinkStatus(url) {
  try {
    const res = await axios.get(url, axiosConfig);
    return res.status;
  } catch {
    return "FAILED";
  }
}

/* =======================
   AUDIT LINKS ON PAGE
======================= */
async function auditLinksOnPage(pageUrl, $) {
  const brokenLinks = [];
  const tasks = [];

  $("a").each((_, el) => {
    tasks.push(
      (async () => {
        const href = $(el).attr("href");
        const text = $(el).text().trim();

        if (!href || href === "#" || href.startsWith("javascript")) {
          brokenLinks.push({
            pageUrl,
            faultyLink: href || "EMPTY",
            anchorText: text,
            statusCode: "N/A",
            comment: "Invalid link",
          });
          return;
        }

        const fullUrl = normalizeUrl(href, pageUrl);
        if (!fullUrl) return;

        const status = await checkLinkStatus(fullUrl);

        if (status === "FAILED") {
          brokenLinks.push({
            pageUrl,
            faultyLink: fullUrl,
            anchorText: text,
            statusCode: "FAILED",
            comment: "Request failed",
          });
        } else if (status >= 400) {
          brokenLinks.push({
            pageUrl,
            faultyLink: fullUrl,
            anchorText: text,
            statusCode: status,
            comment: "Broken link",
          });
        } else if (status >= 300 && status < 400) {
          brokenLinks.push({
            pageUrl,
            faultyLink: fullUrl,
            anchorText: text,
            statusCode: status,
            comment: "Redirect",
          });
        }
      })()
    );
  });

  $("img").each((_, el) => {
    tasks.push(
      (async () => {
        const src = $(el).attr("src");
        const fullUrl = normalizeUrl(src, pageUrl);
        if (!fullUrl) return;

        const status = await checkLinkStatus(fullUrl);
        if (status === "FAILED" || status >= 400) {
          brokenLinks.push({
            pageUrl,
            faultyLink: fullUrl,
            anchorText: "IMAGE",
            statusCode: status,
            comment: "Broken image",
          });
        }
      })()
    );
  });

  await Promise.all(tasks);
  return brokenLinks;
}

/* =======================
   BASIC SEO ANALYSIS
======================= */
function analyzeBasicSeo(pageUrl, $) {
  const title = $("title").text().trim();
  const metaDescription = $('meta[name="description"]').attr("content");
  const h1Count = $("h1").length;
  const canonical = $('link[rel="canonical"]').attr("href");

  let missingAltCount = 0;
  $("img").each((_, el) => {
    if (!$(el).attr("alt")) missingAltCount++;
  });

  return {
    pageUrl,
    titlePresent: Boolean(title),
    metaDescriptionPresent: Boolean(metaDescription),
    h1Count,
    missingAltCount,
    canonicalPresent: Boolean(canonical),
  };
}

/* =======================
   ORM (FORM) ANALYSIS
======================= */
function analyzeForms(pageUrl, $) {
  const forms = [];

  $("form").each((index, form) => {
    const action = $(form).attr("action");
    const method = ($(form).attr("method") || "GET").toUpperCase();

    let fieldsCount = 0;
    $(form)
      .find("input, textarea, select")
      .each(() => fieldsCount++);

    const submitBtn = $(form).find(
      'button[type="submit"], input[type="submit"]'
    );

    const submitDisabled =
      submitBtn.attr("disabled") !== undefined ||
      submitBtn.hasClass("disabled");

    const actionValid =
      action &&
      action !== "#" &&
      !action.startsWith("javascript");

    forms.push({
      pageUrl,
      formIndex: index + 1,
      method,
      fieldsCount,
      actionUrl: action || "EMPTY",
      actionValid: Boolean(actionValid),
      submitClickable: !submitDisabled,
      issue:
        !actionValid || submitDisabled
          ? "Form not submitting"
          : "No issue detected",
    });
  });

  return forms;
}

/* =======================
   SITEMAP CHECK
======================= */
async function checkSitemap(startUrl) {
  try {
    const sitemapUrl = new URL("/sitemap.xml", startUrl).href;
    const res = await axios.get(sitemapUrl, axiosConfig);
    return res.status === 200;
  } catch {
    return false;
  }
}

/* =======================
   CRAWL WEBSITE
======================= */
export async function crawlWebsite(startUrl, limit = 5) {
  const visited = new Set();
  const queue = [startUrl];

  const allBrokenLinks = [];
  const seoResults = [];
  const ormResults = [];

  const baseHost = new URL(startUrl).hostname;
  const sitemapAccessible = await checkSitemap(startUrl);

  while (queue.length && visited.size < limit) {
    const pageUrl = queue.shift();
    if (visited.has(pageUrl)) continue;

    visited.add(pageUrl);
    console.log("Crawling:", pageUrl);

    const html = await fetchPage(pageUrl);
    if (!html) continue;

    const $ = cheerio.load(html);

    // 🔹 SEO
    const seoData = analyzeBasicSeo(pageUrl, $);
    seoData.sitemapAccessible = sitemapAccessible;
    seoResults.push(seoData);

    // 🔹 ORM
    const forms = analyzeForms(pageUrl, $);
    ormResults.push(...forms);

    // 🔹 BROKEN LINKS
    const broken = await auditLinksOnPage(pageUrl, $);
    allBrokenLinks.push(...broken);

    // 🔹 INTERNAL LINKS
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href");
      const fullUrl = normalizeUrl(href, pageUrl);
      if (!fullUrl) return;

      try {
        if (new URL(fullUrl).hostname === baseHost) {
          queue.push(fullUrl);
        }
      } catch {}
    });
  }

  return {
    brokenLinks: allBrokenLinks,
    basicSeoChecks: seoResults,
    ormChecks: ormResults,
  };
}
