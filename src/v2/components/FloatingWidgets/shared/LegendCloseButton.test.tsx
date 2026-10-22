import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LegendCloseButton } from './LegendCloseButton';
import { hideLegend, showLegend, useLegendHidden } from './legendVisibilityStore';

afterEach(() => act(() => showLegend()));

describe('legendVisibilityStore', () => {
  it('starts shown, hides, and shows again for every subscriber', () => {
    const first = renderHook(() => useLegendHidden());
    const second = renderHook(() => useLegendHidden());
    expect(first.result.current).toBe(false);

    act(() => hideLegend());
    expect(first.result.current).toBe(true);
    expect(second.result.current).toBe(true);

    act(() => showLegend());
    expect(first.result.current).toBe(false);
    expect(second.result.current).toBe(false);
  });
});

describe('LegendCloseButton', () => {
  it('hides the legend without triggering the title bar it sits in', async () => {
    const user = userEvent.setup();
    const onHeaderClick = vi.fn();
    const onHeaderKeyDown = vi.fn();
    const hidden = renderHook(() => useLegendHidden());
    render(
      <div role="button" tabIndex={0} onClick={onHeaderClick} onKeyDown={onHeaderKeyDown}>
        <LegendCloseButton id="test-close" />
      </div>,
    );

    await user.click(screen.getByRole('button', { name: 'Close legend' }));

    expect(hidden.result.current).toBe(true);
    expect(onHeaderClick).not.toHaveBeenCalled();

    act(() => showLegend());
    screen.getByRole('button', { name: 'Close legend' }).focus();
    await user.keyboard('{Enter}');
    expect(hidden.result.current).toBe(true);
    expect(onHeaderKeyDown).not.toHaveBeenCalled();
  });
});
