// pages/api/scrapeProperty.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { url, source } = req.query;
  const HASDATA_KEY = process.env.HASDATA_API_KEY;
  const RENTCAST_KEY = process.env.NEXT_PUBLIC_RENTCAST_API_KEY;

  // This log will appear in your VS Code terminal when you click the button
  console.log("Checking Keys:", { hasData: !!HASDATA_KEY, rentCast: !!RENTCAST_KEY });

  if (!HASDATA_KEY && source !== 'rentcast') {
    return res.status(500).json({ error: `SERVER_ERROR: HASDATA_API_KEY is undefined. Try restarting 'npm run dev'.` });
  }

  const headers: HeadersInit = source === 'rentcast' 
    ? { 'X-Api-Key': RENTCAST_KEY || '' }
    : { 'x-api-key': HASDATA_KEY || '' };

  // RentCast uses the 'url' parameter as the physical address string here
  const endpoint = source === 'rentcast'
    ? `https://api.rentcast.io/v1/properties/records?address=${encodeURIComponent(url as string)}`
    : `https://api.hasdata.com/scrape/${source}/property?url=${encodeURIComponent(url as string)}`;

  try {
    const response = await fetch(endpoint, { headers, signal: AbortSignal.timeout(15000) });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.message || `Status ${response.status}` });
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Timeout" });
  }
}