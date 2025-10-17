import express from "express";
import cors from "cors";
import puppeteer from "puppeteer";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// In-memory cache
let cachedBands = null;
let lastScrape = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

app.get("/api/payscale", async (req, res) => {
  try {
    const now = Date.now();
    if (cachedBands && now - lastScrape < CACHE_TTL) {
      return res.json({
        status: "success",
        source: "https://www.nhsbands.co.uk/",
        bands: cachedBands,
        cached: true,
      });
    }

    const url = "https://www.nhsbands.co.uk/";

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded" });

    const bands = await page.evaluate(() => {
      const bandEls = Array.from(document.querySelectorAll(".band-wrapper"));
      const result = [];

      // Extract top-of-band numbers from the page
      const topNumbers = Array.from(
        document.querySelectorAll(".band-wrapper .band-row .salary")
      ).map((el) => parseInt(el.innerText.replace(/[^0-9]/g, ""), 10));

      // Map band names correctly: 1-7, 8a-8d, 9
      const bandNames = [
        "Band 1",
        "Band 2",
        "Band 3",
        "Band 4",
        "Band 5",
        "Band 6",
        "Band 7",
        "Band 8a",
        "Band 8b",
        "Band 8c",
        "Band 8d",
        "Band 9",
      ];

      let bottom = 1;
      topNumbers.forEach((top, i) => {
        result.push({
          Band: bandNames[i] || `Band ${i + 1}`,
          "Bottom of band": bottom,
          "Top of band": top,
        });
        bottom = top + 1;
      });

      return result;
    });

    await browser.close();

    // Cache result
    cachedBands = bands;
    lastScrape = Date.now();

    res.json({
      status: "success",
      source: url,
      bands,
      cached: false,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ NHS Pay API running at http://localhost:${PORT}`);
});
