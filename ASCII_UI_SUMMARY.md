# ASCII Terminal UI System

## Overview
Hybrid modern-ASCII interface combining cyberpunk aesthetics with retro computing vibes for AgentSeer.

## Components Created

### 1. ASCII Art System
- **File**: `src/lib/ascii-art/agent-avatars.ts`
- ASCII avatars for different agent strategies
- Border generation utilities
- Box drawing helpers

### 2. Terminal CSS Theme
- **File**: `src/styles/ascii/terminal.css`
- Complete terminal styling
- Color palette: Green, Amber, Cyan, Pink
- Animations and glow effects
- Responsive design

### 3. Agent Card Component
- **File**: `src/components/ascii-ui/AgentCard.tsx`
- ASCII avatar display
- Progress bars
- Status badges
- Stats visualization

### 4. ASCII Progress Bar
- **File**: `src/components/ascii-ui/ASCIIProgressBar.tsx`
- Character-based progress bars
- Multiple colors
- Customizable

## Features

### Visual Elements
✅ ASCII art avatars
✅ Terminal borders and frames
✅ Monospace fonts (JetBrains Mono, Courier Prime)
✅ Terminal green color scheme
✅ Glow effects and animations
✅ Blinking cursor
✅ Scanline effects

### Components
✅ Terminal windows with headers
✅ ASCII progress bars
✅ Terminal-style buttons
✅ Command-line inputs
✅ ASCII tables
✅ Status indicators

### Interactive Elements
✅ Hover effects
✅ Click animations
✅ Typing animations
✅ Glow pulses
✅ Transform effects

## Color Palette

### Primary Colors
- Terminal Green: `#00ff00` (Primary text)
- Terminal Amber: `#ffb000` (Accents, headers)
- Terminal Blue: `#00d9ff` (Links, highlights)
- Terminal Pink: `#ff00ff` (Special elements)
- Terminal Cyan: `#00ffff` (Stats, data)

### Backgrounds
- Primary: `#0a0e0f` (Almost black)
- Secondary: `#1a1e1f` (Cards, windows)
- Tertiary: `#2a2e2f` (Inputs, nested elements)

## Usage Example

```tsx
import { AgentCard } from '@/components/ascii-ui/AgentCard';
import '@/styles/ascii/terminal.css';

export default function AgentsPage() {
  return (
    <div className="terminal-container">
      <AgentCard agent={agent} onClick={handleClick} />
    </div>
  );
}
```

## Future Components

### Planned
- [ ] Terminal log viewer
- [ ] ASCII leaderboard table
- [ ] Terminal command history
- [ ] Matrix background effect
- [ ] Typing animation utilities
- [ ] ASCII charts and graphs
- [ ] Terminal notifications
- [ ] ASCII modals/dialogs

## Design Philosophy

### Retro Computing Aesthetics
- Terminal green on black
- Monospace fonts
- ASCII borders
- Box drawing characters
- Command-line feel

### Modern Functionality
- Smooth animations
- Responsive design
- Interactive components
- Real-time updates
- Professional UX

### Cyberpunk Vibes
- Neon glow effects
- Dark backgrounds
- Electric colors
- Futuristic feel
- Hacker aesthetic

## Integration with AgentSeer

### Agent Dashboard
- ASCII cards showing agent stats
- Progress bars for metrics
- Terminal windows for logs
- ASCII avatars for personality

### Agent Creation
- Terminal-style wizard
- ASCII progress indicators
- Command-line inputs
- Retro UI elements

### Leaderboards
- ASCII tables with box drawing
- Terminal-styled rankings
- ASCII art headers
- Retro data visualization

## Accessibility

### Considerations
- High contrast for readability
- Monospace fonts for clarity
- Clear status indicators
- Readable text sizes
- Keyboard navigation

## Performance

### Optimizations
- CSS animations (GPU-accelerated)
- Efficient font loading
- Minimal JavaScript
- Optimized rendering
- Lazy loading

## Next Steps

1. Complete remaining components
2. Add more ASCII art
3. Implement terminal log viewer
4. Create ASCII charts
5. Add sound effects
6. Implement keyboard shortcuts
7. Add terminal themes
8. Create customization options
