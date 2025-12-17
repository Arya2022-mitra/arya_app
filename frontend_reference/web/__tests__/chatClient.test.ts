import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

/**
 * Tests for sendChatMessage context parameter support.
 *
 * These tests verify that the sendChatMessage function correctly forwards
 * the context parameter to the backend when provided.
 */

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock the getApiUrl function
vi.mock('@/lib/api', () => ({
  getApiUrl: (path: string) => `http://localhost:5000${path}`,
}));

// Import after mocking
import { sendChatMessage, type ChatContext } from '@/lib/chatClient';

describe('sendChatMessage', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends request without context when not provided', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      json: async () => ({ composed: 'Test response' }),
    });

    await sendChatMessage({
      token: 'test-token',
      profileId: '123',
      question: 'What is my future?',
      lang: 'en',
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    
    expect(url).toBe('http://localhost:5000/chat');
    expect(options.method).toBe('POST');
    
    const body = JSON.parse(options.body);
    expect(body.profile_id).toBe('123');
    expect(body.question).toBe('What is my future?');
    expect(body.lang).toBe('en');
    expect(body.context).toBeUndefined();
  });

  it('sends request with context when provided', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      json: async () => ({ composed: 'Response with context' }),
    });

    const context: ChatContext = {
      session: 'abc123',
      extra: 'data',
    };

    await sendChatMessage({
      token: 'test-token',
      profileId: '456',
      question: 'Tell me about my career',
      context,
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, options] = mockFetch.mock.calls[0];
    
    const body = JSON.parse(options.body);
    expect(body.profile_id).toBe('456');
    expect(body.question).toBe('Tell me about my career');
    expect(body.context).toEqual({
      session: 'abc123',
      extra: 'data',
    });
  });

  it('does not include context key when context is null', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      json: async () => ({ composed: 'Response' }),
    });

    await sendChatMessage({
      token: 'test-token',
      profileId: '789',
      question: 'My question',
      context: null,
    });

    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.context).toBeUndefined();
  });

  it('includes authorization header when token provided', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      json: async () => ({ composed: 'Response' }),
    });

    await sendChatMessage({
      token: 'my-auth-token',
      profileId: '123',
      question: 'Test',
    });

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers.Authorization).toBe('Bearer my-auth-token');
  });

  it('omits authorization header when token is null', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      json: async () => ({ composed: 'Response' }),
    });

    await sendChatMessage({
      token: null,
      profileId: '123',
      question: 'Test',
    });

    const [, options] = mockFetch.mock.calls[0];
    expect(options.headers.Authorization).toBeUndefined();
  });

  it('throws UNAUTHORIZED error on 401 response', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 401,
      json: async () => ({ error: 'Unauthorized' }),
    });

    await expect(
      sendChatMessage({
        token: 'expired-token',
        profileId: '123',
        question: 'Test',
      })
    ).rejects.toThrow('UNAUTHORIZED');
  });

  it('returns default message when composed is empty', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      json: async () => ({ composed: '' }),
    });

    const result = await sendChatMessage({
      token: 'token',
      profileId: '123',
      question: 'Test',
    });

    expect(result.composed).toBe('No GPT response available.');
  });

  it('returns default message when composed is missing', async () => {
    mockFetch.mockResolvedValueOnce({
      status: 200,
      json: async () => ({}),
    });

    const result = await sendChatMessage({
      token: 'token',
      profileId: '123',
      question: 'Test',
    });

    expect(result.composed).toBe('No GPT response available.');
  });
});
