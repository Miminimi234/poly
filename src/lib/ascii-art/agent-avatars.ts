/**
 * ASCII Art Avatars for Agents
 * Different robot/creature avatars based on agent strategy
 */

export interface ASCIIAvatar {
  art: string;
  name: string;
  description: string;
}

export const AGENT_AVATARS: Record<string, ASCIIAvatar> = {
  conservative: {
    name: 'The Scholar',
    description: 'Methodical and careful',
    art: `
    ╔═══════════════╗
    ║     ____      ║
    ║    /    \\     ║
    ║   | ○  ○ |    ║
    ║   |  ͡° ͜ʖ ͡°|    ║
    ║   |  ______  |║
    ║  /  |  ||  | \\║
    ╚═══┴══┴┴┴┴┴═══╝
    `
  },
  aggressive: {
    name: 'The Hunter',
    description: 'Fast and decisive',
    art: `
    ╔═══════════════╗
    ║   ⚡⚡⚡⚡⚡⚡   ║
    ║   ▄▄▄▄▄▄▄▄   ║
    ║   ╰-╮╭-╮╭-╯   ║
    ║   │ ▼ ▼ │   ║
    ║   ╰─────╯   ║
    ║   / ▓▓▓▓ \\   ║
    ╚═══┴═══════┴═══╝
    `
  },
  speed_demon: {
    name: 'The Scout',
    description: 'Quick and efficient',
    art: `
    ╔═══════════════╗
    ║    ▄▄▄▄▄     ║
    ║    ▼ ▼ ▼     ║
    ║   │ o o │     ║
    ║   │  ╰  │     ║
    ║   ╰╦═══╦╯     ║
    ║    ║ ░ ║      ║
    ╚═══════════════╝
    `
  },
  academic: {
    name: 'The Sage',
    description: 'Wise and thorough',
    art: `
    ╔═══════════════╗
    ║     ╔═╗      ║
    ║     ║★║      ║
    ║   ┌─╨─╨─┐    ║
    ║  ╭┤ º º ┤╮   ║
    ║  │└─────┘│   ║
    ║  └╦═════╦┘   ║
    ╚═══╝     ╚═══╝
    `
  },
  hybrid: {
    name: 'The Hybrid',
    description: 'Evolved and balanced',
    art: `
    ╔═══════════════╗
    ║   ╔═══════╗   ║
    ║   ║ ◉ ◉ ║   ║
    ║   ║ ●══● ║   ║
    ║   ╚═══════╝   ║
    ║    ░░░░░░░    ║
    ║   ╔═══════╗   ║
    ╚═══╝       ╚═══╝
    `
  },
  default: {
    name: 'Agent',
    description: 'Autonomous operator',
    art: `
    ╔═══════════════╗
    ║   ▄▄█▄▄      ║
    ║   █ ▓ █      ║
    ║   █ ◉ ◉ █    ║
    ║   █ ▼▼▼ █    ║
    ║   ╰═════╯    ║
    ║   ║ ■■■ ║    ║
    ╚═══╝     ╚═══╝
    `
  }
};

export function getAgentAvatar(strategyType: string): ASCIIAvatar {
  return AGENT_AVATARS[strategyType] || AGENT_AVATARS.default;
}

export function generateASCIIBorder(width: number, style: 'single' | 'double' = 'single'): string {
  const chars = style === 'double' 
    ? { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║' }
    : { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│' };
  
  const hline = chars.h.repeat(width - 2);
  return `${chars.tl}${hline}${chars.tr}`;
}

export function generateASCIIBox(content: string[], width?: number): string {
  const maxWidth = width || Math.max(...content.map(line => line.length));
  const horizontal = '─'.repeat(maxWidth + 2);
  const lines = content.map(line => `│ ${line.padEnd(maxWidth)} │`);
  
  return [
    `┌${horizontal}┐`,
    ...lines,
    `└${horizontal}┘`
  ].join('\n');
}
