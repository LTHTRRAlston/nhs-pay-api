import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

const app = express();
app.use(cors());

// ✅ Root route for Render / health check
app.get("/", (req, res) => {
  res.send("✅ NHS Pay API is running. Try /api/payscale");
});

// Main API route
app.get("/api/payscale", async (req, res) => {
  try {
    const response = await fetch("https://www.nhsbands.co.uk/");
    const body = await response.text();

    const $ = cheerio.load(body);
    const rows = $("table tbody tr");

    const bands = [];
    let previousTop = 0;

    rows.each((index, row) => {
      const cols = $(row).find("td");
      const bandName = $(cols[0]).text().trim();
      const bottomOfBand = parseInt($(cols[1]).text().replace(/,/g, ""), 10);
      const topOfBand = parseInt($(cols[2]).text().replace(/,/g, ""), 10);

      bands.push({
        Band: bandName,
        "Bottom of band": bottomOfBand,
        "Top of band": topOfBand,
      });

      previousTop = topOfBand;
    });

    // Fix NHS band naming 8a–8d
    const correctedBands = [];
    for (let i = 0; i < bands.length; i++) {
      if (bands[i].Band === "Band 8") {
        correctedBands.push({ Band: "Band 8a", ...bands[i] });
        correctedBands.push({ Band: "Band 8b", ...bands[i + 1] });
        correctedBands.push({ Band: "Band 8c", ...bands[i + 2] });
        correctedBands.push({ Band: "Band 8d", ...bands[i + 3] });
        i += 3;
      } else if (!bands[i].Band.startsWith("Band 8")) {
        correctedBands.push(bands[i]);
      }
    }

    res.json({
      status: "success",
      source: "https://www.nhsbands.co.uk/",
      bands: correctedBands,
    });
  } catch (error) {
    console.error("Error fetching NHS band data:", error);
    res.status(500).json({ status: "error", message: "Failed to fetch pay scale data" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
