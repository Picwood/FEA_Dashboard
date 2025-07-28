import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('utils', () => {
  describe('cn', () => {
    it('combines class names correctly', () => {
      const result = cn('bg-red-500', 'text-white', 'p-4');
      expect(result).toBe('bg-red-500 text-white p-4');
    });

    it('handles conditional classes', () => {
      const isActive = true;
      const result = cn('base-class', isActive && 'active-class');
      expect(result).toBe('base-class active-class');
    });

    it('handles false conditional classes', () => {
      const isActive = false;
      const result = cn('base-class', isActive && 'active-class');
      expect(result).toBe('base-class');
    });

    it('merges conflicting Tailwind classes correctly', () => {
      // twMerge should handle conflicting classes
      const result = cn('p-4', 'p-2');
      expect(result).toBe('p-2'); // later class should win
    });

    it('handles arrays of class names', () => {
      const result = cn(['bg-blue-500', 'text-white'], 'p-4');
      expect(result).toBe('bg-blue-500 text-white p-4');
    });

    it('handles objects with conditional classes', () => {
      const result = cn({
        'bg-green-500': true,
        'bg-red-500': false,
        'text-white': true,
      });
      expect(result).toBe('bg-green-500 text-white');
    });

    it('handles empty inputs', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('handles undefined and null values', () => {
      const result = cn('base-class', undefined, null, 'other-class');
      expect(result).toBe('base-class other-class');
    });

    it('handles complex mixed inputs', () => {
      const isActive = true;
      const result = cn(
        'base-class',
        ['conditional-class', isActive && 'active'],
        { 'object-class': true, 'false-class': false },
        undefined,
        'final-class'
      );
      expect(result).toBe('base-class conditional-class active object-class final-class');
    });
  });
}); 