/**
 * Dot-Matrix ASCII Art Utilities
 * Electric blue terminal aesthetic with dot-matrix portraits
 */

export interface DotMatrixAvatar {
  pattern: string;
  width: number;
  height: number;
}

/**
 * Generate dot-matrix ASCII art from a character map
 */
export function generateDotMatrix(
  pattern: string[][],
  onChar: string = '*',
  offChar: string = ' '
): string {
  return pattern
    .map(row => row.map(cell => cell === '1' ? onChar : offChar).join(''))
    .join('\n');
}

/**
 * Predefined dot-matrix avatars for agents
 */
export const DOT_MATRIX_AVATARS: Record<string, string> = {
  conservative: `
     ████    
   ██    ██  
  █  ○○  █   
  █  ◉◉  █   
  █  ──  █   
   █ ▓▓ █    
    ████     
  `,
  aggressive: `
   ╔════╗    
  ║⚡⚡  ║    
  ║  ▼▼ ║    
  ║  ◉◉ ║    
  ║ ──── ║   
  ╚════╝     
  `,
  speed_demon: `
    █████    
   █     █   
  █   ▲▲  █  
  █   ▲▲  █  
   █ ▓▓▓ █   
    █████    
  `,
  academic: `
    ░░░░░    
   ░★★★░    
  ░○ ○ ○░    
  ░  ◉  ░    
  ░ ─── ░    
   ░░▓▓░    
  `,
  hybrid: `
  ╔═══════╗  
  ║ ◉ ◉ ◉ ║  
  ║ ●═══● ║  
  ║ ░░░░░ ║  
  ║ ░▓▓▓░ ║  
  ╚═══════╝  
  `,
  default: `
    █████    
   █ ▓▓▓ █   
  █  ◉◉ ◉  █  
  █ ░░░░░ █   
   █ ▓▓▓ █    
    █████     
  `
};

/**
 * Generate box drawing border for agent cards
 */
export function generateBoxBorder(width: number, height: number): string {
  const h = '─'.repeat(width - 2);
  const v = '│';
  const tl = '┌';
  const tr = '┐';
  const bl = '└';
  const br = '┘';
  
  const top = tl + h + tr;
  const middle = v + ' '.repeat(width - 2) + v;
  const bottom = bl + h + br;
  
  return [top, middle, bottom].join('\n');
}

/**
 * Generate terminal header with all caps styling
 */
export function generateTerminalHeader(title: string, width: number = 60): string {
  const padding = Math.max(0, Math.floor((width - title.length - 6) / 2));
  const dashes = '─'.repeat(padding);
  return `┌─${dashes} ${title.toUpperCase()} ${dashes}─┐`;
}

/**
 * Generate employee directory style listing
 */
export function generateEmployeeDirectory(items: Array<{role: string, name: string}>): string {
  const lines = items.map(item => 
    `[${item.role.toUpperCase()}] ${item.name}`
  );
  return lines.join('\n');
}

/**
 * Generate ASCII table with box drawing
 */
export function generateASCIITable(
  headers: string[],
  rows: string[][],
  columnWidths: number[]
): string {
  const top = '┌' + columnWidths.map(w => '─'.repeat(w)).join('┬') + '┐';
  const header = '│' + headers.map((h, i) => h.padEnd(columnWidths[i])).join('│') + '│';
  const middle = '├' + columnWidths.map(w => '─'.repeat(w)).join('┼') + '┤';
  const dataRows = rows.map(row => 
    '│' + row.map((cell, i) => cell.padEnd(columnWidths[i])).join('│') + '│'
  );
  const bottom = '└' + columnWidths.map(w => '─'.repeat(w)).join('┴') + '┘';
  
  return [top, header, middle, ...dataRows, bottom].join('\n');
}

/**
 * Generate terminal command log
 */
export function generateTerminalLog(commands: Array<{time: string, user: string, command: string}>): string {
  return commands.map(cmd => 
    `[${cmd.time}] ${cmd.user}@agentseer:~$ ${cmd.command}`
  ).join('\n');
}

