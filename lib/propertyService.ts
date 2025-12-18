// lib/propertyService.ts

export const fetchRentCastData = async (address: string) => {
    const apiKey = process.env.NEXT_PUBLIC_RENTCAST_API_KEY;
    
    // 1. Fetch Subject Property Details
    const res = await fetch(`https://api.rentcast.io/v1/properties?address=${encodeURIComponent(address)}`, {
      headers: { 'X-Api-Key': apiKey || '461eb23bfc794c26ada21be451af10c8' }
    });
    const data = await res.json();
    const subject = data[0];
  
    // 2. Fetch 4 Similar Neighbors (Comps)
    const sqftMin = Math.floor(subject.squareFootage * 0.9);
    const sqftMax = Math.ceil(subject.squareFootage * 1.1);
    
    const compsRes = await fetch(
      `https://api.rentcast.io/v1/properties?address=${encodeURIComponent(address)}&radius=0.25&squareFootage=${sqftMin}-${sqftMax}&limit=5`,
      { headers: { 'X-Api-Key': apiKey || '461eb23bfc794c26ada21be451af10c8' } }
    );
    const compsData = await compsRes.json();
  
    // Filter out the subject property if it appears in comps, then take top 4
    const finalComps = compsData
      .filter((c: any) => c.addressLine1 !== subject.addressLine1)
      .slice(0, 4);
  
    return { subject, comps: finalComps };
  };