import express from "express";
import cors from "cors";
import puppeteer from "puppeteer";

const app = express();
app.use(cors());

// Health check route
app.get("/", (req, res) => {
  res.send("✅ NHS Pay API (Render + Puppeteer) is live! Try /api/payscale");
});

app.get("/api/payscale", async (req, res) => {
  let browser;
  try {
    // Launch Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });
    const page = await browser.newPage();
    await page.goto("https://www.nhsbands.co.uk/", {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    // Wait for table rows
    await page.waitForSelector(".band-wrapper table tbody tr");

    // Scrape all rows
    const bands = await page.$$eval(".band-wrapper table tbody tr", (rows) => {
      return rows.map((row) => {
        const cols = Array.from(row.querySelectorAll("td")).map((td) =>
          td.textContent.trim()
        );
        if (cols.length >= 3) {
          return {
            Band: cols[0],
            "Bottom of band": parseInt(cols[1].replace(/,/g, ""), 10) || null,
            "Top of band": parseInt(cols[2].replace(/,/g, ""), 10) || null,
          };
        }
        return null;
      }).filter(Boolean);
    });

    // Fix band naming: 8a–8d
    const correctedBands = [];
    let band8Count = 0;
    for (const band of bands) {
      if (band.Band.startsWith("Band 8")) {
        const suffixes = ["a", "b", "c", "d"];
        if (band8Count < 4) {
          correctedBands.push({
            ...band,
            Band: `Band 8${suffixes[band8Count]}`,
          });
        }
        band8Count++;
      } else if (!band.Band.startsWith("Band 8")) {
        correctedBands.push(band);
      }
    }

    res.json({
      status: "success",
      source: "https://www.nhsbands.co.uk/",
      bands: correctedBands,
    });
  } catch (err) {
    console.error("❌ Scraping failed:", err);
    res.status(500).json({ status: "error", message: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ Server running on port ${PORT}`)
);
