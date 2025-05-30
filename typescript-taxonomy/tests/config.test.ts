import { getApiKey } from '../src/config';
import * as fs from 'fs';
import * as path from 'path';

describe('Config Module', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.OPENAI_API_KEY;
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe('getApiKey', () => {
    it('should return provided API key as first priority', () => {
      const providedKey = 'sk-provided-key';
      const result = getApiKey(providedKey);
      expect(result).toBe(providedKey);
    });

    it('should return environment variable as second priority', () => {
      process.env.OPENAI_API_KEY = 'sk-env-key';
      const result = getApiKey();
      expect(result).toBe('sk-env-key');
    });

    it('should read from file as third priority', () => {
      const fileKey = 'sk-file-key';
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(fileKey);
      
      const result = getApiKey();
      expect(result).toBe(fileKey);
    });

    it('should return null if no API key found', () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      const result = getApiKey();
      expect(result).toBeNull();
    });

    it('should trim whitespace from file-based key', () => {
      const fileKey = '  sk-file-key-with-spaces  \n';
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(fileKey);
      
      const result = getApiKey();
      expect(result).toBe('sk-file-key-with-spaces');
    });

    it('should handle file read errors gracefully', () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
        throw new Error('File read error');
      });
      
      const result = getApiKey();
      expect(result).toBeNull();
    });
  });
}); 