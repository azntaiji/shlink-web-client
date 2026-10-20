import './setup';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { BackgroundOptions } from '../../../src/common/qr-codes/BackgroundOptions';
import type { ColorControlProps } from '../../../src/common/qr-codes/DotsOptions';
import { QrStylingOptions } from '../../../src/common/qr-codes/QrStylingOptions';
import { useQrStyling } from '../../../src/common/qr-codes/useQrStyling';
import { checkAccessibility } from '../../__helpers__/accessibility';

const ColorControl = ({ name, color, onChange }: ColorControlProps) => (
  <input aria-label={name} value={color} onChange={(event) => onChange(event.target.value)} />
);

const Controls = () => {
  const qr = useQrStyling();
  const [color, setColor] = useState('#ffffff');
  return (
    <>
      <QrStylingOptions {...qr} color="#123456" onColorChange={vi.fn()} ColorControl={ColorControl} />
      <BackgroundOptions {...qr} color={color} onColorChange={setColor} ColorControl={ColorControl} />
    </>
  );
};

describe('<BackgroundOptions />', () => {
  const setUp = async () => {
    const result = render(<Controls />);
    const user = userEvent.setup();
    const summary = screen.getByText('Background Options');
    expect(summary.closest('details')).not.toHaveAttribute('open');
    await user.click(summary);
    return {
      ...result,
      user,
      background: within(summary.closest('details')!),
      dots: within(screen.getByText('Dots Options').closest('details')!),
    };
  };

  it('starts with a white single color and the requested gradient defaults', async () => {
    const { user, background } = await setUp();
    expect(background.getByRole('radio', { name: 'Single color' })).toBeChecked();
    expect(background.getByLabelText('Background Color')).toHaveValue('#ffffff');
    expect(background.queryByRole('spinbutton')).not.toBeInTheDocument();
    await user.click(background.getByRole('radio', { name: 'Color gradient' }));
    expect(background.getByRole('radio', { name: 'Linear' })).toBeChecked();
    expect(background.getByLabelText('Dots Gradient first color')).toHaveValue('#a7b6c5');
    expect(background.getByLabelText('Dots Gradient second color')).toHaveValue('#ffffff');
    expect(background.getByRole('spinbutton')).toHaveValue(0);
  });

  it('edits gradient colors and rotation and retains values across toggles', async () => {
    const { user, background } = await setUp();
    fireEvent.change(background.getByLabelText('Background Color'), { target: { value: '#fedcba' } });
    await user.click(background.getByRole('radio', { name: 'Color gradient' }));
    fireEvent.change(background.getByLabelText('Dots Gradient first color'), { target: { value: '#ddeeff' } });
    fireEvent.change(background.getByLabelText('Dots Gradient second color'), { target: { value: '#abcdef' } });
    await user.clear(background.getByRole('spinbutton'));
    await user.type(background.getByRole('spinbutton'), '-90.5');
    await user.tab();
    expect(background.getByRole('spinbutton')).toHaveValue(-90.5);
    await user.click(background.getByRole('radio', { name: 'Radial' }));
    expect(background.queryByRole('spinbutton')).not.toBeInTheDocument();
    await user.click(background.getByRole('radio', { name: 'Linear' }));
    expect(background.getByRole('spinbutton')).toHaveValue(-90.5);
    await user.click(background.getByRole('radio', { name: 'Single color' }));
    expect(background.getByLabelText('Background Color')).toHaveValue('#fedcba');
    await user.click(background.getByRole('radio', { name: 'Color gradient' }));
    await user.click(screen.getByText('Background Options'));
    await user.click(screen.getByText('Background Options'));
    expect(background.getByLabelText('Dots Gradient first color')).toHaveValue('#ddeeff');
    expect(background.getByLabelText('Dots Gradient second color')).toHaveValue('#abcdef');
    expect(background.getByRole('spinbutton')).toHaveValue(-90.5);
  });

  it('keeps background styling independent of dots and corner overrides', async () => {
    const { user, background, dots } = await setUp();
    await user.click(background.getByRole('radio', { name: 'Color gradient' }));
    fireEvent.change(background.getByRole('spinbutton'), { target: { value: '45' } });
    await user.click(dots.getByRole('radio', { name: 'Color gradient' }));
    await user.click(dots.getByRole('radio', { name: 'Radial' }));
    fireEvent.change(dots.getByLabelText('Dots Gradient first color'), { target: { value: '#ff0000' } });
    await user.click(screen.getByText('Corners Dot Options'));
    const inner = within(screen.getByText('Corners Dot Options').closest('details')!);
    await user.selectOptions(inner.getByLabelText('Corners Dot Style'), 'dots');
    await user.click(inner.getByRole('button', { name: 'Clear' }));
    expect(background.getByRole('radio', { name: 'Linear' })).toBeChecked();
    expect(background.getByRole('spinbutton')).toHaveValue(45);
    expect(background.getByLabelText('Dots Gradient first color')).toHaveValue('#a7b6c5');
    fireEvent.change(background.getByLabelText('Dots Gradient first color'), { target: { value: '#eeeeee' } });
    expect(dots.getByRole('radio', { name: 'Radial' })).toBeChecked();
    expect(dots.getByLabelText('Dots Gradient first color')).toHaveValue('#ff0000');
  });

  it('resets solid color and gradient settings without changing foreground styling', async () => {
    const { user, background, dots } = await setUp();
    await user.selectOptions(dots.getByLabelText('Dots Style'), 'classy');
    await user.click(screen.getByText('Corners Dot Options'));
    const inner = within(screen.getByText('Corners Dot Options').closest('details')!);
    await user.selectOptions(inner.getByLabelText('Corners Dot Style'), 'dots');
    fireEvent.change(background.getByLabelText('Background Color'), { target: { value: '#fedcba' } });
    await user.click(background.getByRole('button', { name: 'Reset' }));
    expect(background.getByLabelText('Background Color')).toHaveValue('#ffffff');

    fireEvent.change(background.getByLabelText('Background Color'), { target: { value: '#fedcba' } });
    await user.click(background.getByRole('radio', { name: 'Color gradient' }));
    fireEvent.change(background.getByLabelText('Dots Gradient first color'), { target: { value: '#ddeeff' } });
    fireEvent.change(background.getByLabelText('Dots Gradient second color'), { target: { value: '#abcdef' } });
    fireEvent.change(background.getByRole('spinbutton'), { target: { value: '45' } });
    await user.click(background.getByRole('radio', { name: 'Radial' }));
    await user.click(background.getByRole('button', { name: 'Reset' }));
    expect(background.getByRole('radio', { name: 'Single color' })).toBeChecked();
    expect(background.getByLabelText('Background Color')).toHaveValue('#ffffff');
    expect(dots.getByLabelText('Dots Style')).toHaveValue('classy');
    expect(inner.getByLabelText('Corners Dot Style')).toHaveValue('dots');
    expect(inner.getByRole('button', { name: 'Clear' })).toBeEnabled();
    await user.click(background.getByRole('radio', { name: 'Color gradient' }));
    expect(background.getByRole('radio', { name: 'Linear' })).toBeChecked();
    expect(background.getByLabelText('Dots Gradient first color')).toHaveValue('#a7b6c5');
    expect(background.getByLabelText('Dots Gradient second color')).toHaveValue('#ffffff');
    expect(background.getByRole('spinbutton')).toHaveValue(0);
  });

  it('passes accessibility checks with single color and gradient controls', async () => {
    const result = await setUp();
    await checkAccessibility(result);
    await result.user.click(result.background.getByRole('radio', { name: 'Color gradient' }));
    await checkAccessibility(result);
  });
});
