/**
 * @file gstScraper.js
 * @description Direct scraper for the official GST portal.
 */
const logger = require('./logger');

/**
 * Direct GST Portal Scraper with Audio Captcha support.
 * @param {string} gstin 
 */
async function scrapeGSTPortal(gstin) {
  let playwrightExtra;
  let stealthPlugin;

  // Professional Lazy Loading: Prevents startup crash if dependencies are missing
  try {
    playwrightExtra = require('playwright-extra');
    stealthPlugin = require('puppeteer-extra-plugin-stealth');
  } catch (err) {
    logger.error('[GSTScraper] Required dependencies (playwright-extra, puppeteer-extra-plugin-stealth) are not installed.');
    return { success: false, message: 'Automation engine not available on server.' };
  }

  const { chromium } = playwrightExtra;
  
  // Apply stealth only once
  if (!chromium._stealthApplied) {
    chromium.use(stealthPlugin());
    chromium._stealthApplied = true;
  }

  let browser;
  try {
    browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('https://services.gst.gov.in/services/searchtp');
    await page.fill('#for_gstin', gstin);

    // Handle Audio Captcha
    const audioBtn = page.locator('#captcha-audio'); 
    if (await audioBtn.isVisible()) {
      const [response] = await Promise.all([
        page.waitForResponse(r => r.url().includes('captcha/audio')),
        audioBtn.click(),
      ]);
      
      logger.info(`[GSTScraper] Audio captcha triggered for ${gstin}`);
      const audioBuffer = await response.body();
      const captchaText = await solveAudioCaptcha(audioBuffer);
      
      if (captchaText) {
        await page.fill('#captcha', captchaText);
        await page.click('#search');
        
        await page.waitForSelector('.taxpayer-details', { timeout: 5000 });
        logger.info(`[GSTScraper] Data successfully scraped for ${gstin}`);
        
        return {
          success: true,
          data: await page.evaluate(() => ({
            legalName: document.querySelector('#lglNm')?.innerText,
            tradeName: document.querySelector('#trdNm')?.innerText,
            address: document.querySelector('#addr')?.innerText,
            gstStatus: document.querySelector('#sts')?.innerText,
          }))
        };
      }
    }
    return { success: false, message: 'Captcha challenge not visible or failed' };
  } catch (err) {
    logger.error(`[GSTScraper] Scrape failed for ${gstin}:`, err);
    return { success: false, message: err.message };
  } finally {
    if (browser) await browser.close();
  }
}

/**
 * Conceptual Speech-to-Text handler for Audio Captcha.
 */
async function solveAudioCaptcha(buffer) {
  // Integration point for Whisper or Google STT
  // Returns digits 0-9
  return "123456"; 
}

module.exports = { scrapeGSTPortal };

