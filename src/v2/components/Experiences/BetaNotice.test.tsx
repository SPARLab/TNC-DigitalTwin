import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { BetaNotice } from './BetaNotice';

function Where() {
  const location = useLocation();
  return (
    <p data-testid="where">
      {location.pathname} from {(location.state as { from?: string } | null)?.from ?? 'nowhere'}
    </p>
  );
}

describe('BetaNotice', () => {
  it('opens the Feedback page and remembers where the user came from', () => {
    render(
      <MemoryRouter initialEntries={['/experiences/sdm']}>
        <Routes>
          <Route path="*" element={<><BetaNotice /><Where /></>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /in beta/i }));
    expect(screen.getByTestId('where').textContent).toBe('/feedback from /experiences/sdm');
  });

  it('is plain text, naming the menu, when it should not be clickable', () => {
    render(
      <MemoryRouter>
        <BetaNotice clickable={false} />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByRole('note').textContent).toMatch(/Feedback in the left-hand menu/);
  });

  it('is plain text outside a router', () => {
    render(<BetaNotice />);
    expect(screen.getByRole('note').textContent).toMatch(/beta/i);
  });
});
