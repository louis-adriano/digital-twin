import { config } from 'dotenv';
config({ path: '.env.local' });

/**
 * Test LinkedIn RSS Feed Access
 * 
 * LinkedIn provides RSS feeds for public profiles at:
 * https://www.linkedin.com/in/USERNAME/recent-activity/
 * 
 * However, LinkedIn deprecated public RSS feeds in 2018.
 * We'll test if any alternative methods work.
 */

async function testLinkedInRSS() {
  const linkedinUsername = 'louisadriano'; // from your profile URL
  
  console.log('🔍 Testing LinkedIn RSS Feed Access...\n');
  
  // Try different RSS/feed endpoints
  const endpoints = [
    `https://www.linkedin.com/in/${linkedinUsername}/recent-activity/`,
    `https://www.linkedin.com/in/${linkedinUsername}/detail/recent-activity/shares/`,
    `https://www.linkedin.com/feed/update/`,
  ];

  for (const endpoint of endpoints) {
    console.log(`Testing: ${endpoint}`);
    try {
      const response = await fetch(endpoint, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      
      console.log(`Status: ${response.status}`);
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        console.log(`Content-Type: ${contentType}`);
        
        const text = await response.text();
        console.log(`Response length: ${text.length} chars`);
        
        // Check if it's RSS/XML
        if (text.includes('<rss') || text.includes('<?xml')) {
          console.log('✅ Found RSS/XML feed!\n');
          console.log(text.substring(0, 500));
        } else if (text.includes('linkedin')) {
          console.log('⚠️  HTML page returned (not RSS)\n');
        }
      } else {
        console.log(`❌ Failed: ${response.statusText}\n`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    }
  }

  console.log('\n📝 Summary:');
  console.log('LinkedIn deprecated public RSS feeds in 2018.');
  console.log('Alternative options:');
  console.log('1. Use LinkedIn API (requires OAuth2 + Developer App)');
  console.log('2. Use a third-party service like RSS.app or Feed43');
  console.log('3. Manual entry via admin panel (recommended)');
  console.log('4. Use web scraping (unreliable, against ToS)');
}

testLinkedInRSS().catch(console.error);
