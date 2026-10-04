/**
 * Live Scraper & Real-Time RAG Module for SSRU Registration Division
 * Source: https://reg.ssru.ac.th (https://share.google/o9BnGzbQACRVfvE4n)
 */

const axios = require('axios');
const cheerio = require('cheerio');
const { RAG_DOCUMENTS, retrieveRAGContext } = require('./ragKnowledge');

let liveCache = {
  lastUpdated: null,
  announcements: [],
  rawLiveText: ''
};

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes auto-refresh

/**
 * Scrape live content from reg.ssru.ac.th & ssru.ac.th
 */
async function fetchLiveSSRUData(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && liveCache.lastUpdated && (now - liveCache.lastUpdated < CACHE_TTL_MS)) {
    return liveCache;
  }

  try {
    console.log('🌐 [Real-Time Scraper] Fetching live data from https://reg.ssru.ac.th ...');
    
    const [regRes, ssruRes] = await Promise.allSettled([
      axios.get('https://reg.ssru.ac.th/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 8000
      }),
      axios.get('https://ssru.ac.th/', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 8000
      })
    ]);

    let scrapedItems = [];
    let combinedText = '';

    if (regRes.status === 'fulfilled') {
      const $ = cheerio.load(regRes.value.data);
      const title = $('title').text().trim() || 'ฝ่ายทะเบียนและประมวลผล มหาวิทยาลัยราชภัฏสวนสุนันทา';
      combinedText += ` [เว็บไซต์ reg.ssru.ac.th: ${title}] `;

      $('a, h1, h2, h3, h4, p, li').each((_, el) => {
        const text = $(el).text().replace(/\s+/g, ' ').trim();
        if (text.length > 15 && text.length < 200 && !scrapedItems.includes(text)) {
          scrapedItems.push(text);
        }
      });
    }

    if (ssruRes.status === 'fulfilled') {
      const $ssru = cheerio.load(ssruRes.value.data);
      $ssru('a, h2, h3, h4').each((_, el) => {
        const text = $ssru(el).text().replace(/\s+/g, ' ').trim();
        if (text.length > 20 && text.length < 180 && !scrapedItems.includes(text)) {
          scrapedItems.push(text);
        }
      });
    }

    liveCache = {
      lastUpdated: now,
      lastUpdatedISO: new Date().toISOString(),
      announcements: scrapedItems.slice(0, 20),
      rawLiveText: combinedText + ' ' + scrapedItems.slice(0, 15).join('; ')
    };

    console.log(`✅ [Real-Time Scraper] Successfully updated ${scrapedItems.length} live topics from reg.ssru.ac.th`);
    return liveCache;
  } catch (err) {
    console.error('⚠️ [Real-Time Scraper Warning] Could not fetch live site, using fallback RAG knowledge:', err.message);
    return liveCache;
  }
}

/**
 * Get Real-Time Grounded RAG Context for a query
 */
async function getRealtimeRAGContext(query) {
  // 1. Ensure live cache is warm
  const liveData = await fetchLiveSSRUData();

  // 2. Retrieve base RAG documents matching query
  const matchedDocs = retrieveRAGContext(query, 3);

  // 3. Filter relevant live announcements
  const lowerQuery = query.toLowerCase();
  const relevantLiveNews = liveData.announcements.filter(item => {
    const itemLower = item.toLowerCase();
    return lowerQuery.split(/\s+/).some(word => word.length > 2 && itemLower.includes(word));
  });

  return {
    matchedDocs,
    liveNews: relevantLiveNews,
    lastSynced: liveData.lastUpdatedISO || new Date().toISOString(),
    liveSummaryText: liveData.rawLiveText
  };
}

module.exports = {
  fetchLiveSSRUData,
  getRealtimeRAGContext
};
