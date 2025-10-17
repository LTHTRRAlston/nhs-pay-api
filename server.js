import express from "express";
import cors from "cors";
import puppeteer, { executablePath } from "puppeteer";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get("/api/payscale", async (req, res) => {
  const url = "https://www.nhsbands.co.uk/";

  try {
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: executablePath(), // ✅ finds installed Chrome
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage"
      ]
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded" });

    const data = await page.evaluate(() => {
      const bands = [];
      const rows = document.querySelectorAll("table tbody tr");
      rows.forEach((row) => {
        const cells = row.querySelectorAll("td");
        if (cells.length >= 2) {
          const band = cells[0].innerText.trim();
          const topOfBand = parseInt(cells[cells.length - 1].innerText.replace(/[^0-9]/g, ""), 10);
          bands.push({ Band: band, "Top of band": topOfBand });
        }
      });

      // Compute Bottom of Band by shifting previous top value
      for (let i = 0; i < bands.length; i++) {
        bands[i]["Bottom of band"] = i === 0 ? 1 : bands[i - 1]["Top of band"] + 1;
      }

      // Fix NHS naming for higher bands
      const names = [
        "Band 1", "Band 2", "Band 3", "Band 4", "Band 5",
        "Band 6", "Band 7", "Band 8a", "Band 8b", "Band 8c",
        "Band 8d", "Band 9"
      ];
      bands.forEach((b, i) => {
        if (names[i]) b.Band = names[i];
      });

      return bands;
    });

    await browser.close();

    res.json({
      status: "success",
      source: url,
      bands: data
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

app.get("/", (req, res) => {
  res.send("✅ NHS Pay API is running!");
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
