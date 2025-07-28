import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StatsCards from '../StatsCards';

// Mock the useJobs hook
vi.mock('../../hooks/useJobs', () => ({
  useJobs: vi.fn(),
}));

// Import after mocking
import { useJobs } from '../../hooks/useJobs';
const mockUseJobs = vi.mocked(useJobs);

describe('StatsCards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all stat cards with default data', () => {
    // Mock the hook to return empty array
    mockUseJobs.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    render(<StatsCards />);
    
    // Check that all card titles are rendered
    expect(screen.getByText('Active Jobs')).toBeInTheDocument();
    expect(screen.getByText('Queued')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
    
    // Check that all values are 0 when no jobs
    const zeroValues = screen.getAllByText('0');
    expect(zeroValues).toHaveLength(4);
  });

  it('displays correct counts for different job statuses', () => {
    // Mock jobs data with various statuses
    const mockJobs = [
      { id: 1, status: 'running', name: 'Job 1' },
      { id: 2, status: 'running', name: 'Job 2' },
      { id: 3, status: 'queued', name: 'Job 3' },
      { id: 4, status: 'done', name: 'Job 4' },
      { id: 5, status: 'done', name: 'Job 5' },
      { id: 6, status: 'done', name: 'Job 6' },
      { id: 7, status: 'failed', name: 'Job 7' },
    ];

    mockUseJobs.mockReturnValue({
      data: mockJobs,
      isLoading: false,
      error: null,
    } as any);

    render(<StatsCards />);
    
    // Check active jobs count (running status)
    expect(screen.getByText('Active Jobs')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    
    // Check queued jobs count  
    expect(screen.getByText('Queued')).toBeInTheDocument();
    const allOnes = screen.getAllByText('1');
    expect(allOnes).toHaveLength(2); // Should be exactly 2 cards with "1"
    
    // Check completed jobs count (done status)
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    
    // Check failed jobs count
    expect(screen.getByText('Failed')).toBeInTheDocument();
    // We already verified there are 2 "1"s above (queued and failed)
  });

  it('displays percentage changes', () => {
    mockUseJobs.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    render(<StatsCards />);
    
    // Check that percentage changes are displayed
    expect(screen.getByText('+8%')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('+12%')).toBeInTheDocument();
    expect(screen.getByText('+2%')).toBeInTheDocument();
    
    // Check that "vs last month" text is displayed
    const vsLastMonthTexts = screen.getAllByText('vs last month');
    expect(vsLastMonthTexts).toHaveLength(4);
  });

  it('handles undefined data gracefully', () => {
    mockUseJobs.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    } as any);

    render(<StatsCards />);
    
    // Should render with 0 values when data is undefined
    expect(screen.getByText('Active Jobs')).toBeInTheDocument();
    const zeroValues = screen.getAllByText('0');
    expect(zeroValues).toHaveLength(4);
  });
}); 