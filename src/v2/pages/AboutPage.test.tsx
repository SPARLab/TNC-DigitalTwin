import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AboutPage } from './AboutPage';

describe('AboutPage', () => {
  it('shows the description, contact topics, and team', () => {
    render(<AboutPage />);

    expect(
      screen.getByRole('heading', { name: 'Dangermond Preserve Digital Twin' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/one of the first digital twins of nature/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Questions/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Feedback/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Functionality & data requests/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Kelly Easterday' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Mark Reynolds' })).toBeInTheDocument();
  });

  it('asks for the missing fields before sending', async () => {
    const user = userEvent.setup();
    render(<AboutPage />);

    await user.click(screen.getByRole('button', { name: 'Send message' }));

    expect(screen.getByRole('status')).toHaveTextContent(/name, email, and a message/i);
  });
});
