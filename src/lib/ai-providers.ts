/**
 * Multi-provider AI service for celebrity agent predictions
 * Supports OpenAI, Anthropic, Google, Meta, Perplexity, and xAI
 */

interface AIResponse {
  prediction: 'YES' | 'NO';
  confidence: number;
  reasoning: string;
}

export class AIProviderService {
  private openaiKey: string;
  private anthropicKey: string;
  private googleKey: string;
  private perplexityKey: string;
  private xaiKey: string;

  constructor() {
    this.openaiKey = process.env.OPENAI_API_KEY || '';
    this.anthropicKey = process.env.ANTHROPIC_API_KEY || '';
    this.googleKey = process.env.GOOGLE_AI_API_KEY || '';
    this.perplexityKey = process.env.PERPLEXITY_API_KEY || '';
    this.xaiKey = process.env.XAI_API_KEY || '';
  }

  async analyzeMarket(
    provider: string,
    model: string,
    systemPrompt: string,
    marketData: {
      question: string;
      description: string;
      currentOdds: number;
      volume: number;
    }
  ): Promise<AIResponse> {
    const userPrompt = `Analyze this prediction market and provide your prediction:

Market Question: ${marketData.question}
Description: ${marketData.description}
Current Market Odds: ${(marketData.currentOdds * 100).toFixed(1)}% YES
24h Volume: $${marketData.volume.toLocaleString()}

Based on all available information, make your prediction and explain your reasoning.`;

    switch (provider) {
      case 'openai':
        return this.callOpenAI(model, systemPrompt, userPrompt);
      case 'anthropic':
        return this.callAnthropic(model, systemPrompt, userPrompt);
      case 'google':
        return this.callGoogle(model, systemPrompt, userPrompt);
      case 'meta':
        return this.callMeta(model, systemPrompt, userPrompt);
      case 'perplexity':
        return this.callPerplexity(model, systemPrompt, userPrompt);
      case 'xai':
        return this.callXAI(model, systemPrompt, userPrompt);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  private async callOpenAI(model: string, systemPrompt: string, userPrompt: string): Promise<AIResponse> {
    if (!this.openaiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    return this.parseAIResponse(content);
  }

  private async callAnthropic(model: string, systemPrompt: string, userPrompt: string): Promise<AIResponse> {
    if (!this.anthropicKey) {
      throw new Error('Anthropic API key not configured');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.anthropicKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.content[0].text;
    
    return this.parseAIResponse(content);
  }

  private async callGoogle(model: string, systemPrompt: string, userPrompt: string): Promise<AIResponse> {
    if (!this.googleKey) {
      throw new Error('Google AI API key not configured');
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.googleKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${systemPrompt}\n\n${userPrompt}`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Google AI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.candidates[0].content.parts[0].text;
    
    return this.parseAIResponse(content);
  }

  private async callMeta(model: string, systemPrompt: string, userPrompt: string): Promise<AIResponse> {
    // Meta/Llama models via Replicate or Together AI
    // Using Together AI as default endpoint for Llama models
    const togetherKey = process.env.TOGETHER_API_KEY;
    
    if (!togetherKey) {
      throw new Error('Together AI API key not configured (needed for Meta/Llama models)');
    }

    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${togetherKey}`
      },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3-70b-chat-hf',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`Together AI (Meta) API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    return this.parseAIResponse(content);
  }

  private async callPerplexity(model: string, systemPrompt: string, userPrompt: string): Promise<AIResponse> {
    if (!this.perplexityKey) {
      throw new Error('Perplexity API key not configured');
    }

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.perplexityKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    return this.parseAIResponse(content);
  }

  private async callXAI(model: string, systemPrompt: string, userPrompt: string): Promise<AIResponse> {
    if (!this.xaiKey) {
      throw new Error('xAI API key not configured');
    }

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.xaiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`xAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    return this.parseAIResponse(content);
  }

  private parseAIResponse(content: string): AIResponse {
    try {
      // Try to parse as JSON first
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          prediction: parsed.prediction.toUpperCase() as 'YES' | 'NO',
          confidence: Math.max(0, Math.min(1, parsed.confidence)),
          reasoning: parsed.reasoning
        };
      }
    } catch (e) {
      // Fallback to text parsing
    }

    // Fallback: look for YES/NO in text and extract reasoning
    const yesMatch = content.match(/\b(YES|Yes|yes)\b/);
    const noMatch = content.match(/\b(NO|No|no)\b/);
    const confidenceMatch = content.match(/confidence[:\s]+(\d+\.?\d*)/i);
    
    return {
      prediction: yesMatch ? 'YES' : 'NO',
      confidence: confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.5,
      reasoning: content.substring(0, 500) // Take first 500 chars as reasoning
    };
  }
}

export const aiProviderService = new AIProviderService();

