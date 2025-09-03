import { headers } from 'next/headers';

/**
 * Extract IPv4 address from a string that might contain IPv4, IPv6, or both
 */
export function extractIPv4(ipString: string | null): string | null {
  if (!ipString) return null;
  
  // Match standard IPv4 pattern (e.g., 192.168.1.1)
  const ipv4Match = ipString.match(/(\d{1,3}\.){3}\d{1,3}/);
  if (ipv4Match) {
    const ip = ipv4Match[0];
    // Validate that each octet is <= 255
    const octets = ip.split('.');
    if (octets.every(octet => parseInt(octet) <= 255)) {
      return ip;
    }
  }
  
  // Check if it's IPv6-mapped IPv4 (e.g., ::ffff:192.168.1.1)
  const mappedMatch = ipString.match(/::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/i);
  if (mappedMatch) {
    const ip = mappedMatch[1];
    const octets = ip.split('.');
    if (octets.every(octet => parseInt(octet) <= 255)) {
      return ip;
    }
  }
  
  return null;
}

/**
 * Get the client's IP address from request headers, preferring IPv4
 */
export function getClientIP(): string {
  const headersList = headers();
  
  // Check various headers that might contain the client IP
  const cfConnectingIpv4 = headersList.get('cf-connecting-ipv4'); // Cloudflare IPv4
  const cfConnectingIp = headersList.get('cf-connecting-ip'); // Cloudflare
  const trueClientIp = headersList.get('true-client-ip'); // Cloudflare Enterprise
  const forwardedFor = headersList.get('x-forwarded-for'); // Standard proxy
  const realIp = headersList.get('x-real-ip'); // Nginx
  const clientIp = headersList.get('x-client-ip'); // Some proxies
  
  // Try to get IPv4 address first (preferred)
  let ipAddress = extractIPv4(cfConnectingIpv4) || 
                  extractIPv4(cfConnectingIp) ||
                  extractIPv4(trueClientIp) ||
                  extractIPv4(forwardedFor?.split(',')[0].trim()) ||
                  extractIPv4(realIp) ||
                  extractIPv4(clientIp);
  
  // If no IPv4 found, fall back to any IP (might be IPv6)
  if (!ipAddress) {
    ipAddress = cfConnectingIp || 
                trueClientIp || 
                forwardedFor?.split(',')[0].trim() || 
                realIp || 
                clientIp ||
                'Unknown';
  }
  
  return ipAddress;
}

/**
 * Get client IP with debugging information
 */
export function getClientIPWithDebug(): { ip: string; debug: Record<string, string | null> } {
  const headersList = headers();
  
  const debug = {
    'cf-connecting-ipv4': headersList.get('cf-connecting-ipv4'),
    'cf-connecting-ip': headersList.get('cf-connecting-ip'),
    'true-client-ip': headersList.get('true-client-ip'),
    'x-forwarded-for': headersList.get('x-forwarded-for'),
    'x-real-ip': headersList.get('x-real-ip'),
    'x-client-ip': headersList.get('x-client-ip'),
  };
  
  const ip = getClientIP();
  
  return { ip, debug };
}