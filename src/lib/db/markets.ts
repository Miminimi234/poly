import db, { initDatabase } from './sqlite';

// Ensure database is initialized
initDatabase();

export interface Market {
  id: string;
  question: string;
  description: string;
  slug: string;
  yes_price: number;
  no_price: number;
  volume: number;
  volume_24hr: number;
  category: string;
  end_date: string;
  image_url: string;
}

// Get all markets
export function getAllMarkets(): Market[] {
  const stmt = db.prepare('SELECT * FROM markets ORDER BY volume DESC LIMIT 100');
  return stmt.all() as Market[];
}

// Get single market
export function getMarket(id: string): Market | undefined {
  const stmt = db.prepare('SELECT * FROM markets WHERE id = ?');
  return stmt.get(id) as Market | undefined;
}

// Insert or update market
export function upsertMarket(market: Market) {
  const stmt = db.prepare(`
    INSERT INTO markets (id, question, description, slug, yes_price, no_price, volume, volume_24hr, category, end_date, image_url, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      yes_price = excluded.yes_price,
      no_price = excluded.no_price,
      volume = excluded.volume,
      volume_24hr = excluded.volume_24hr,
      updated_at = CURRENT_TIMESTAMP
  `);

  stmt.run(
    market.id,
    market.question,
    market.description,
    market.slug,
    market.yes_price,
    market.no_price,
    market.volume,
    market.volume_24hr,
    market.category,
    market.end_date,
    market.image_url
  );
}

// Sync markets from Polymarket
export async function syncMarketsFromPolymarket() {
  console.log('🔄 Syncing markets from Polymarket...');
  
  try {
    const response = await fetch('https://gamma-api.polymarket.com/markets?limit=100&closed=false');
    const data = await response.json();
    
    let added = 0;
    let updated = 0;
    
    for (const market of data) {
      const existing = getMarket(market.id);
      
      const marketData: Market = {
        id: market.id,
        question: market.question,
        description: market.description || '',
        slug: market.slug || market.id,
        yes_price: parseFloat(market.outcomePrices?.[0] || '0.5'),
        no_price: parseFloat(market.outcomePrices?.[1] || '0.5'),
        volume: parseFloat(market.volume || '0'),
        volume_24hr: parseFloat(market.volume24hr || '0'),
        category: market.groupItemTitle || market.categoryLabel || 'Other',
        end_date: market.endDate || '',
        image_url: market.image || market.icon || ''
      };
      
      upsertMarket(marketData);
      
      if (existing) {
        updated++;
      } else {
        added++;
      }
    }
    
    console.log(`✅ Sync complete: ${added} added, ${updated} updated`);
    return { success: true, added, updated };
    
  } catch (error: any) {
    console.error('❌ Sync failed:', error.message);
    return { success: false, error: error.message };
  }
}

