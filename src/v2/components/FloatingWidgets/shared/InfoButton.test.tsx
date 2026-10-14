import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InfoButton } from './InfoButton';
import { WidgetHeader } from './WidgetHeader';

function renderInfo() {
  return render(
    <div>
      <InfoButton id="test-info" label="About this widget">
        <p>Helpful explanation</p>
      </InfoButton>
      <button type="button">elsewhere</button>
    </div>,
  );
}

describe('InfoButton', () => {
  it('keeps its explanation hidden until opened', () => {
    renderInfo();

    expect(screen.getByRole('button', { name: 'About this widget' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Helpful explanation')).not.toBeInTheDocument();
  });

  it('opens and closes from its button', async () => {
    const user = userEvent.setup();
    renderInfo();
    const button = screen.getByRole('button', { name: 'About this widget' });

    await user.click(button);
    expect(screen.getByText('Helpful explanation')).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'true');

    await user.click(button);
    expect(screen.queryByText('Helpful explanation')).not.toBeInTheDocument();
  });

  it('closes on Escape or a press elsewhere', async () => {
    const user = userEvent.setup();
    renderInfo();
    const button = screen.getByRole('button', { name: 'About this widget' });

    await user.click(button);
    await user.keyboard('{Escape}');
    expect(screen.queryByText('Helpful explanation')).not.toBeInTheDocument();

    await user.click(button);
    await user.click(screen.getByRole('button', { name: 'elsewhere' }));
    expect(screen.queryByText('Helpful explanation')).not.toBeInTheDocument();
  });
});

describe('WidgetHeader undo', () => {
  const baseProps = {
    icon: <span />,
    title: 'Map Layers',
    isCollapsed: false,
    onToggleCollapse: () => {},
  };

  it('has no undo button unless the widget supplies one', () => {
    render(<WidgetHeader {...baseProps} />);

    expect(screen.queryByTitle('No actions to undo')).not.toBeInTheDocument();
  });

  it('shows the undo button when an undo handler is given', () => {
    render(<WidgetHeader {...baseProps} canUndo={false} onUndo={() => {}} />);

    expect(screen.getByTitle('No actions to undo')).toBeInTheDocument();
  });
});
