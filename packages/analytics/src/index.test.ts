import { NexusAnalytics } from './index';

// Declaración de tipos globales de testing para TypeScript sin dependencias externas
declare const describe: (name: string, fn: () => void) => void;
declare const it: (name: string, fn: () => void) => void;
declare const expect: (actual: unknown) => {
  toBe: (expected: unknown) => void;
  toEqual: (expected: unknown) => void;
  toHaveBeenCalledTimes: (count: number) => void;
  not: {
    toHaveBeenCalled: () => void;
  };
};
declare const beforeEach: (fn: () => void) => void;
declare const afterEach: (fn: () => void) => void;
declare const jest: {
  spyOn: (obj: unknown, method: string) => {
    mockImplementation: (fn: () => void) => unknown;
    mock: { calls: unknown[][] };
  };
  restoreAllMocks: () => void;
};

describe('NexusAnalytics', () => {
  let consoleSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    // Interceptamos console.log para validar las salidas del Logger
    consoleSpy = jest.spyOn(console, 'log');
    consoleSpy.mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('debe registrar un evento estándar correctamente', () => {
    const analytics = new NexusAnalytics('test-app');

    analytics.trackCoreEvent('session_started', 'user_123', { source: 'web' });

    expect(consoleSpy).toHaveBeenCalledTimes(1);

    const logOutput = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(logOutput.appId).toBe('analytics:test-app');
    expect(logOutput.level).toBe('INFO');
    expect(logOutput.message).toBe('[Event: session_started]');
    expect(logOutput.metadata.eventName).toBe('session_started');
    expect(logOutput.metadata.userId).toBe('user_123');
    expect(logOutput.metadata.properties).toEqual({ source: 'web' });
  });

  it('debe registrar interacciones de IA con el formato esperado', () => {
    const analytics = new NexusAnalytics('test-app');

    analytics.trackAIInteraction('user_456', 'openai', 150, 240);

    expect(consoleSpy).toHaveBeenCalledTimes(1);

    const logOutput = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(logOutput.message).toBe('[Event: ai_interaction]');
    expect(logOutput.metadata.properties).toEqual({
      provider: 'openai',
      tokensUsed: 150,
      latencyMs: 240,
    });
  });

  it('no debe emitir eventos si está deshabilitado', () => {
    const analytics = new NexusAnalytics('test-app', false);

    analytics.trackCoreEvent('page_loaded');

    expect(consoleSpy).not.toHaveBeenCalled();
  });
});