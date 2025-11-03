import { seedCelebrityAgents } from '../src/lib/db/agents';

async function main() {
  console.log('🤖 SEEDING CELEBRITY AI AGENTS\n');
  
  const result = seedCelebrityAgents();
  
  console.log('✅ DONE!');
  process.exit(0);
}

main();

