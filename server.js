const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const payBands = [
  { band: 1, bottom_of_band: 22383, top_of_band: 22383 },
  { band: 2, bottom_of_band: 24169, top_of_band: 24169 },
  { band: 3, bottom_of_band: 24625, top_of_band: 25674 },
  { band: 4, bottom_of_band: 26530, top_of_band: 29114 },
  { band: 5, bottom_of_band: 29970, top_of_band: 36483 },
  { band: 6, bottom_of_band: 37338, top_of_band: 44962 },
  { band: 7, bottom_of_band: 45494, top_of_band: 53965 },
  { band: 8, bottom_of_band: 52130, top_of_band: 75417 },
  { band: 9, bottom_of_band: 98571, top_of_band: 114949 }
];

app.get("/api/payscales", (req, res) => {
  res.json({
    last_updated: "2025-04-01",
    results: payBands.map(b => ({
      label: `Band ${b.band} (£${b.bottom_of_band.toLocaleString()} - £${b.top_of_band.toLocaleString()})`,
      value: b.band
    }))
  });
});

app.listen(PORT, () => console.log(`✅ NHS Pay API running on port ${PORT}`));
