import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DifficultyBadge, VerdictBadge } from '../components/ui/Badge';

describe('DifficultyBadge', () => {
  it('renders Easy with correct class', () => {
    render(<DifficultyBadge difficulty="easy" />);
    expect(screen.getByText('Easy')).toBeTruthy();
  });

  it('renders Medium', () => {
    render(<DifficultyBadge difficulty="medium" />);
    expect(screen.getByText('Medium')).toBeTruthy();
  });

  it('renders Hard', () => {
    render(<DifficultyBadge difficulty="hard" />);
    expect(screen.getByText('Hard')).toBeTruthy();
  });
});

describe('VerdictBadge', () => {
  it('renders Accepted verdict', () => {
    render(<VerdictBadge verdict="ACCEPTED" />);
    expect(screen.getByText(/Accepted/i)).toBeTruthy();
  });

  it('renders Wrong Answer verdict', () => {
    render(<VerdictBadge verdict="WRONG_ANSWER" />);
    expect(screen.getByText(/Wrong Answer/i)).toBeTruthy();
  });

  it('renders Compilation Error verdict', () => {
    render(<VerdictBadge verdict="COMPILATION_ERROR" />);
    expect(screen.getByText(/Compile Error/i)).toBeTruthy();
  });

  it('renders Pending verdict', () => {
    render(<VerdictBadge verdict="PENDING" />);
    expect(screen.getByText(/Pending/i)).toBeTruthy();
  });

  it('renders TLE verdict', () => {
    render(<VerdictBadge verdict="TIME_LIMIT_EXCEEDED" />);
    expect(screen.getByText(/Time Limit/i)).toBeTruthy();
  });
});
