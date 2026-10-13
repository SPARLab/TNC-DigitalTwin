import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AboutPage } from './AboutPage';

describe('AboutPage', () => {
  it('shows the description, team, and contact sidebar', () => {
    render(<AboutPage />);

    expect(
      screen.getByRole('heading', { name: 'Dangermond Preserve Digital Twin' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'About the platform' })).toBeInTheDocument();
    expect(screen.getByText(/one of the first digital twins of nature/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Kelly Easterday' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Mark Reynolds' })).toBeInTheDocument();

    const contact = screen.getByRole('complementary', { name: 'Contact information' });
    expect(contact).toHaveTextContent('Contact us');
    expect(contact).toHaveTextContent('Questions');
    expect(contact).toHaveTextContent('Feedback');
    expect(contact).toHaveTextContent('Functionality & data requests');
  });

  it('copies the team email without printing it on the page', async () => {
    const user = userEvent.setup();
    const { container } = render(<AboutPage />);

    expect(container.innerHTML).not.toContain('spatial-admin@ucsb.edu');
    expect(screen.queryByRole('link', { name: /@/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Copy email address' }));

    expect(await navigator.clipboard.readText()).toBe('spatial-admin@ucsb.edu');
    expect(screen.getByRole('button', { name: 'Email copied' })).toBeInTheDocument();
    expect(container.innerHTML).not.toContain('spatial-admin@ucsb.edu');
  });

  it('shows the address when the browser blocks copying', async () => {
    const user = userEvent.setup();
    render(<AboutPage />);
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValueOnce(new Error('denied'));

    await user.click(screen.getByRole('button', { name: 'Copy email address' }));

    expect(await screen.findByText('spatial-admin@ucsb.edu')).toBeInTheDocument();
  });

  it('no longer offers a contact form', () => {
    render(<AboutPage />);

    expect(screen.queryByRole('button', { name: 'Send message' })).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('gives the two section headings the same size', () => {
    render(<AboutPage />);

    const about = screen.getByRole('heading', { name: 'About the platform' });
    const team = screen.getByRole('heading', { name: 'Our team' });
    expect(about.className).toBe(team.className);
    expect(about.className).toContain('text-2xl');
  });
});
