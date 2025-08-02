// Test setup for Vitest
import { vi } from 'vitest';

// Mock Phaser globally
global.Phaser = {
  Scene: class {
    constructor(config) {
      this.scene = { key: config.key };
      this.events = {
        on: vi.fn()
      };
      this.add = {
        text: vi.fn().mockReturnValue({
          setOrigin: vi.fn().mockReturnThis(),
          setText: vi.fn().mockReturnThis(),
          setFill: vi.fn().mockReturnThis()
        }),
        rectangle: vi.fn().mockReturnValue({
          setInteractive: vi.fn().mockReturnValue({
            on: vi.fn().mockReturnThis()
          })
        })
      };
    }
  }
};

// Mock WebSocket
global.WebSocket = vi.fn().mockImplementation(() => ({
  readyState: 1,
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
}));