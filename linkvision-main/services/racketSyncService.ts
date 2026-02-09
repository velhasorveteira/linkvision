
import { supabase } from './supabase';
import { RacketSpec } from '../types';
import { compare_rackets } from './geminiService';

export const syncRacketsFromAI = async (query: string, language: string = 'pt') => {
  if (!supabase) {
    console.error('Supabase is not configured');
    return;
  }

  console.log(`Syncing rackets for query: ${query}`);
  const { rackets } = await compare_rackets(query, language);

  for (const racket of rackets) {
    const { error } = await supabase
      .from('rackets')
      .upsert({
        name: racket.name,
        brand: racket.brand,
        weight: racket.weight,
        head_size: racket.headSize,
        string_pattern: racket.stringPattern,
        balance: racket.balance,
        swingweight: racket.swingweight,
        stiffness: racket.stiffness,
        power_level: racket.powerLevel,
        control_level: racket.controlLevel,
        comfort_level: racket.comfortLevel,
        player_type: racket.playerType,
        recommended_level: racket.recommendedLevel,
        pro_players: racket.proPlayers,
        summary: racket.summary,
        pros: racket.pros || [],
        cons: racket.cons || [],
        price_value: racket.priceValue || 0,
        price_display: racket.priceDisplay || '',
        image_url: racket.imageUrl || '',
        is_ai_generated: true,
        year: racket.year,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'name, brand' // Ensure uniqueness
      });

    if (error) {
      console.error(`Error syncing racket ${racket.name}:`, error);
    } else {
      console.log(`Synced: ${racket.name}`);
    }
  }
};

export const fetchRacketsFromDb = async (filters: any = {}): Promise<RacketSpec[]> => {
  if (!supabase) return [];

  let query = supabase.from('rackets').select('*');

  if (filters.brand && filters.brand !== 'All') {
    query = query.eq('brand', filters.brand);
  }

  if (filters.year) {
    query = query.gte('year', filters.year);
  }

  if (filters.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }

  const { data, error } = await query.order('name', { ascending: true });

  if (error) {
    console.error('Error fetching rackets:', error);
    return [];
  }

  return data.map(r => ({
    id: r.id,
    name: r.name,
    brand: r.brand,
    weight: r.weight,
    headSize: r.head_size,
    stringPattern: r.string_pattern,
    balance: r.balance,
    swingweight: r.swingweight,
    stiffness: r.stiffness,
    powerLevel: r.power_level,
    controlLevel: r.control_level,
    comfortLevel: r.comfort_level,
    playerType: r.player_type,
    recommendedLevel: r.recommended_level,
    proPlayers: r.pro_players || [],
    summary: r.summary,
    pros: r.pros || [],
    cons: r.cons || [],
    priceValue: r.price_value,
    priceDisplay: r.price_display,
    imageUrl: r.image_url,
    isAiGenerated: r.is_ai_generated,
    year: r.year
  }));
};
