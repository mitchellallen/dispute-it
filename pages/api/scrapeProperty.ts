// pages/api/scrapeProperty.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url, source } = req.query;
  const HASDATA_KEY = process.env.HASDATA_API_KEY;
  const RENTCAST_KEY = process.env.NEXT_PUBLIC_RENTCAST_API_KEY;

  if (!url || !source) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  const headers: HeadersInit = source === 'rentcast' 
    ? { 'X-Api-Key': RENTCAST_KEY || '', 'accept': 'application/json' }
    : { 'x-api-key': HASDATA_KEY || '' };

  // RentCast 404 Fix: Use /properties?address=... instead of /property/records
  const endpoint = source === 'rentcast'
    ? `https://api.rentcast.io/v1/properties?address=${encodeURIComponent(url as string)}`
    : `https://api.hasdata.com/scrape/${source}/property?url=${encodeURIComponent(url as string)}`;

  try {
    const response = await fetch(endpoint, { 
      headers,
      signal: AbortSignal.timeout(20000) 
    });

    // Check if the provider returned an error
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ 
        error: `Provider Error (${response.status}): ${errorText || 'Empty body'}` 
      });
    }

    const data = await response.json();
    
    // Safety: If data is empty, return a specific error so the frontend knows
    if (!data || Object.keys(data).length === 0) {
      return res.status(404).json({ error: `${source} found no matching records.` });
    }

    return res.status(200).json(data);

  } catch (error: any) {
    console.error(`[Scraper Error] ${source}:`, error.message);
    // CRITICAL: Always return JSON to avoid "Unexpected end of input"
    return res.status(500).json({ 
      error: error.name === 'AbortError' ? 'Scraper timed out' : error.message 
    });
  }
}