import { describe, it, expect, beforeEach } from 'vitest';
import api from '../services/api';

describe('API Service and Interceptors', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('has base URL configured', () => {
    expect(api.defaults.baseURL).toBeDefined();
  });

  it('correctly sets Authorization header if token exists in localStorage', async () => {
    localStorage.setItem('eventra_token', 'mock_jwt_token_xyz');

    // Simulate request interceptor
    const config = { headers: {} };
    const interceptedConfig = api.interceptors.request.handlers[0].fulfilled(config);

    expect(interceptedConfig.headers.Authorization).toBe('Bearer mock_jwt_token_xyz');
  });

  it('leaves Authorization header undefined if token does not exist', async () => {
    const config = { headers: {} };
    const interceptedConfig = api.interceptors.request.handlers[0].fulfilled(config);

    expect(interceptedConfig.headers.Authorization).toBeUndefined();
  });
});
