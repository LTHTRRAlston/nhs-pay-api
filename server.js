import express from 'express';
import puppeteer from 'puppeteer';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/payscale', async (req, res) => {
  const url = 'https://www.nhsbands.co.uk/';

  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('table'); // wait for tables

    const bands = await page.evaluate(() => {
      const result = [];
      const tables = document.querySelectorAll('table');
      let previousTop = 0;

      const nhsBandNames = [
        'Band 1','Band 2','Band 3','Band 4','Band 5','Band 6','Band 7',
        'Band 8a','Band 8b','Band 8c','Band 8d','Band 9'
      ];

      tables.forEach((table, index) => {
        let top = 0;

        table.querySelectorAll('tbody tr td').forEach(td => {
          const n = Number(td.innerText.replace(/[£,<,+]/g, '').trim());
          if (!isNaN(n) && n > top) top = n;
        });

        const bottom = previousTop + 1;
        previousTop = top;

        result.push({
          Band: nhsBandNames[index] || `Band ${index + 1}`,
          'Bottom of band': bottom,
          'Top of band': top
        });
      });

      return result;
    });

    await browser.close();

    res.json({ status: 'success', source: url, bands });

  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ NHS Pay API running at http://localhost:${PORT}`);
});
