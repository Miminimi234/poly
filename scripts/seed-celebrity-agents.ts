import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';
import { CELEBRITY_AGENTS } from '../src/lib/celebrity-agents';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function seedCelebrityAgents() {
  console.log('🌱 Seeding celebrity AI agents...\n');
  
  for (const celebrity of CELEBRITY_AGENTS) {
    try {
      // Check if agent already exists
      const { data: existing } = await supabase
        .from('agents')
        .select('id')
        .eq('name', celebrity.name)
        .eq('is_celebrity', true)
        .single();
      
      if (existing) {
        console.log(`⏭️  ${celebrity.avatar} ${celebrity.name} already exists, skipping...`);
        continue;
      }
      
      // Generate wallet for the agent
      const wallet = ethers.Wallet.createRandom();
      
      // Create agent with celebrity-specific traits
      const { data: agent, error } = await supabase
        .from('agents')
        .insert({
          name: celebrity.name,
          description: celebrity.description,
          strategy_type: celebrity.strategy_type,
          wallet_address: wallet.address,
          wallet_private_key: wallet.privateKey,
          balance: celebrity.initial_balance,
          initial_balance: celebrity.initial_balance,
          is_celebrity: true,
          celebrity_model: celebrity.model,
          // Store additional celebrity metadata as JSON traits
          traits: {
            avatar: celebrity.avatar,
            color: celebrity.color,
            personality: celebrity.personality,
            apiProvider: celebrity.apiProvider,
            systemPrompt: celebrity.systemPrompt
          }
        })
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Error creating ${celebrity.name}:`, error.message);
        continue;
      }
      
      console.log(`✅ Created ${celebrity.avatar} ${celebrity.name}`);
      console.log(`   Model: ${celebrity.model}`);
      console.log(`   Provider: ${celebrity.apiProvider}`);
      console.log(`   Strategy: ${celebrity.strategy_type}`);
      console.log(`   Wallet: ${wallet.address}`);
      console.log(`   Balance: $${celebrity.initial_balance}\n`);
      
    } catch (error: any) {
      console.error(`❌ Failed to seed ${celebrity.name}:`, error.message);
    }
  }
  
  console.log('\n🎉 Celebrity agent seeding complete!\n');
  
  // Print summary
  const { data: allCelebrities, error } = await supabase
    .from('agents')
    .select('*')
    .eq('is_celebrity', true);
  
  if (!error && allCelebrities) {
    console.log('📊 Celebrity AI Battle Arena:\n');
    allCelebrities.forEach((agent: any) => {
      const traits = agent.traits || {};
      console.log(`   ${traits.avatar || '🤖'} ${agent.name} - ${agent.celebrity_model}`);
    });
    console.log(`\n   Total: ${allCelebrities.length} AI models ready to compete\n`);
  }
}

// Run the seeding
seedCelebrityAgents()
  .then(() => {
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  });

