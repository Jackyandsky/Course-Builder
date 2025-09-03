import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
  const headersList = headers();
  
  // Get all relevant IP-related headers
  const ipHeaders = {
    'cf-connecting-ip': headersList.get('cf-connecting-ip'),
    'cf-connecting-ipv4': headersList.get('cf-connecting-ipv4'),
    'true-client-ip': headersList.get('true-client-ip'),
    'x-forwarded-for': headersList.get('x-forwarded-for'),
    'x-real-ip': headersList.get('x-real-ip'),
    'x-client-ip': headersList.get('x-client-ip'),
    'x-forwarded': headersList.get('x-forwarded'),
    'forwarded-for': headersList.get('forwarded-for'),
    'forwarded': headersList.get('forwarded'),
    'x-cluster-client-ip': headersList.get('x-cluster-client-ip'),
    'user-agent': headersList.get('user-agent'),
  
  } catch (error) {
    console.error('Error in GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }};
  
  // Helper function to extract IPv4
  const extractIPv4 = (ipString: string | null): string | null => {
    if (!ipString) return null;
    // Match IPv4 pattern
    const ipv4Match = ipString.match(/(\d{1,3}\.){3}\d{1,3}/);
    if (ipv4Match) return ipv4Match[0];
    
    // Check if it's IPv6-mapped IPv4 (::ffff:192.168.1.1)
    const mappedMatch = ipString.match(/::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/i);
    if (mappedMatch) return mappedMatch[1];
    
    return null;
  };
  
  // Try to get IPv4 address first
  let detectedIpv4 = extractIPv4(ipHeaders['cf-connecting-ipv4']) || 
                     extractIPv4(ipHeaders['cf-connecting-ip']) ||
                     extractIPv4(ipHeaders['true-client-ip']) ||
                     extractIPv4(ipHeaders['x-forwarded-for']?.split(',')[0].trim()) ||
                     extractIPv4(ipHeaders['x-real-ip']) ||
                     extractIPv4(ipHeaders['x-client-ip']);
  
  // Fallback to any IP
  const detectedIp = detectedIpv4 ||
    ipHeaders['cf-connecting-ip'] ||
    ipHeaders['true-client-ip'] ||
    ipHeaders['x-forwarded-for']?.split(',')[0].trim() ||
    ipHeaders['x-real-ip'] ||
    ipHeaders['x-client-ip'] ||
    'Not detected';
  
  return NextResponse.json({
    message: 'Header inspection for IP detection',
    detectedIpv4,
    detectedIp,
    headers: ipHeaders,
    allHeaders: Object.fromEntries(headersList.entries())
  });
}