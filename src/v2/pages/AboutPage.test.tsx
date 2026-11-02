import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AboutPage } from './AboutPage';

function Where() {
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? 'nowhere';
  return <p data-testid="where">{`${location.pathname} from ${from}`}</p>;
}

function renderAbout() {
  return render(
    <MemoryRouter initialEntries={['/about']}>
      <Routes>
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AboutPage', () => {
  it('shows the description, team, and contact sidebar', () => {
    renderAbout();

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

  it('sends visitors to the feedback form instead of listing an email address', async () => {
    const user = userEvent.setup();
    const { container } = renderAbout();

    expect(container.innerHTML).not.toContain('@ucsb.edu');
    expect(screen.queryByRole('link', { name: /@/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /copy email/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Go to the feedback form' }));

    expect(screen.getByTestId('where').textContent).toBe('/feedback from /about');
  });

  it('no longer offers a contact form', () => {
    renderAbout();

    expect(screen.queryByRole('button', { name: 'Send message' })).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('gives the two section headings the same size', () => {
    renderAbout();

    const about = screen.getByRole('heading', { name: 'About the platform' });
    const team = screen.getByRole('heading', { name: 'Our team' });
    expect(about.className).toBe(team.className);
    expect(about.className).toContain('text-2xl');
  });
});
