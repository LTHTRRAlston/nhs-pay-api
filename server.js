import express from 'express';
import puppeteer from 'puppeteer'; // not puppeteer-core

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/payscale', async (req, res) => {
  const url = 'https://www.nhsbands.co.uk/';

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'], // required on Render
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0' });

    await page.waitForSelector('table', { timeout: 20000 });

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

    res.json({
      status: 'success',
      source: url,
      bands
    });

  } catch (error) {
    if (browser) await browser.close();
    console.error(error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ NHS Pay API running at http://localhost:${PORT}`);
});
