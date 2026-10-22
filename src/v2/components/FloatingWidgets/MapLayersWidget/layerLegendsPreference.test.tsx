import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLayerLegendsPreference } from './layerLegendsPreference';
import { LegendToggleButton } from './LegendToggleButton';

const STORAGE_KEY = 'v2-map-layers-show-legends';

beforeEach(() => window.localStorage.clear());

describe('useLayerLegendsPreference', () => {
  it('is on by default', () => {
    const { result } = renderHook(() => useLayerLegendsPreference());

    expect(result.current[0]).toBe(true);
  });

  it('remembers being switched off, and on again', () => {
    const { result, unmount } = renderHook(() => useLayerLegendsPreference());

    act(() => result.current[1](false));
    expect(result.current[0]).toBe(false);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('false');

    unmount();
    const next = renderHook(() => useLayerLegendsPreference());
    expect(next.result.current[0]).toBe(false);

    act(() => next.result.current[1](true));
    expect(next.result.current[0]).toBe(true);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe('LegendToggleButton', () => {
  it('is highlighted and pressed while the legends are on', () => {
    render(<LegendToggleButton isOn onToggle={() => {}} />);

    const button = screen.getByRole('button', { name: 'Show legend entries under layers' });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveClass('bg-emerald-100');
  });

  it('is plain while the legends are off, and toggles when pressed', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<LegendToggleButton isOn={false} onToggle={onToggle} />);

    const button = screen.getByRole('button', { name: 'Show legend entries under layers' });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(button).not.toHaveClass('bg-emerald-100');

    await user.click(button);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
