import { fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { ColorControlProps } from '../../../src/common/qr-codes/DotsOptions';
import { QrStylingOptions } from '../../../src/common/qr-codes/QrStylingOptions';
import { useQrStyling } from '../../../src/common/qr-codes/useQrStyling';
import { checkAccessibility } from '../../__helpers__/accessibility';

const ColorControl = ({ name, color, onChange }: ColorControlProps) => (
  <input aria-label={name} value={color} onChange={(event) => onChange(event.target.value)} />
);

const Controls = () => (
  <QrStylingOptions {...useQrStyling()} color="#123456" onColorChange={vi.fn()} ColorControl={ColorControl} />
);

describe('<CornersDotOptions />', () => {
  const setUp = async () => {
    const result = render(<Controls />);
    const user = userEvent.setup();
    const innerSummary = screen.getByText('Corners Dot Options');
    expect(innerSummary.closest('details')).not.toHaveAttribute('open');
    await user.click(innerSummary);
    await user.click(screen.getByText('Corners Square Options'));
    return {
      ...result,
      user,
      inner: within(innerSummary.closest('details')!),
      outer: within(screen.getByText('Corners Square Options').closest('details')!),
      dots: within(screen.getByText('Dots Options').closest('details')!),
    };
  };

  it('starts with six styles and inherits dots rather than outer-eye overrides', async () => {
    const { user, inner, outer, dots } = await setUp();
    expect(inner.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Square',
      'Dots',
      'Rounded',
      'Extra Rounded',
      'Classy',
      'Classy Rounded',
    ]);
    expect(inner.getByLabelText('Corners Dot Style')).toHaveValue('square');
    expect(inner.getByLabelText('Corners Dot Color')).toHaveValue('#123456');
    expect(inner.getByRole('button', { name: 'Clear' })).toBeDisabled();
    await user.selectOptions(dots.getByLabelText('Dots Style'), 'classy-rounded');
    await user.selectOptions(outer.getByLabelText('Corners Square Style'), 'dot');
    fireEvent.change(outer.getByLabelText('Corners Square Color'), { target: { value: '#ff0000' } });
    expect(inner.getByLabelText('Corners Dot Style')).toHaveValue('classy-rounded');
    expect(inner.getByLabelText('Corners Dot Color')).toHaveValue('#123456');
    expect(inner.getByRole('button', { name: 'Clear' })).toBeDisabled();
  });

  it('overrides shape independently and restores current dots settings with Clear', async () => {
    const { user, inner, outer, dots } = await setUp();
    await user.selectOptions(inner.getByLabelText('Corners Dot Style'), 'dots');
    await user.selectOptions(outer.getByLabelText('Corners Square Style'), 'extra-rounded');
    await user.selectOptions(dots.getByLabelText('Dots Style'), 'rounded');
    await user.click(dots.getByRole('radio', { name: 'Color gradient' }));
    expect(inner.getByLabelText('Corners Dot Style')).toHaveValue('dots');
    expect(inner.getByRole('radio', { name: 'Color gradient' })).toBeChecked();
    fireEvent.change(dots.getByRole('spinbutton'), { target: { value: '90' } });
    expect(inner.getByRole('spinbutton')).toHaveValue(90);
    await user.click(inner.getByRole('button', { name: 'Clear' }));
    expect(inner.getByLabelText('Corners Dot Style')).toHaveValue('rounded');
    expect(inner.getByRole('button', { name: 'Clear' })).toBeDisabled();
    expect(outer.getByLabelText('Corners Square Style')).toHaveValue('extra-rounded');
    expect(outer.getByRole('button', { name: 'Clear' })).toBeEnabled();
  });

  it('keeps single-color overrides independent of both other sections', async () => {
    const { user, inner, outer, dots } = await setUp();
    fireEvent.change(inner.getByLabelText('Corners Dot Color'), { target: { value: '#00ff00' } });
    await user.click(dots.getByRole('radio', { name: 'Color gradient' }));
    fireEvent.change(outer.getByLabelText('Dots Gradient first color'), { target: { value: '#ff0000' } });
    expect(inner.getByRole('radio', { name: 'Single color' })).toBeChecked();
    expect(inner.getByLabelText('Corners Dot Color')).toHaveValue('#00ff00');
    await user.click(outer.getByRole('button', { name: 'Clear' }));
    expect(inner.getByLabelText('Corners Dot Color')).toHaveValue('#00ff00');
    await user.click(inner.getByRole('button', { name: 'Clear' }));
    expect(inner.getByRole('radio', { name: 'Color gradient' })).toBeChecked();
    expect(inner.getByLabelText('Dots Gradient first color')).toHaveValue('#2078cf');
  });

  it('edits gradient stops, type, and rotation independently and restores inheritance', async () => {
    const { user, inner, dots } = await setUp();
    await user.click(inner.getByRole('radio', { name: 'Color gradient' }));
    fireEvent.change(inner.getByLabelText('Dots Gradient first color'), { target: { value: '#ff0000' } });
    fireEvent.change(inner.getByLabelText('Dots Gradient second color'), { target: { value: '#00ff00' } });
    await user.clear(inner.getByRole('spinbutton'));
    await user.type(inner.getByRole('spinbutton'), '-45.5');
    await user.tab();
    expect(inner.getByRole('spinbutton')).toHaveValue(-45.5);
    await user.click(inner.getByRole('radio', { name: 'Radial' }));
    expect(inner.queryByRole('spinbutton')).not.toBeInTheDocument();
    await user.click(dots.getByRole('radio', { name: 'Color gradient' }));
    expect(dots.getByRole('radio', { name: 'Linear' })).toBeChecked();
    expect(dots.getByLabelText('Dots Gradient first color')).toHaveValue('#2078cf');
    await user.click(inner.getByRole('radio', { name: 'Linear' }));
    expect(inner.getByRole('spinbutton')).toHaveValue(-45.5);
    await user.click(inner.getByRole('button', { name: 'Clear' }));
    expect(inner.getByRole('spinbutton')).toHaveValue(0);
    expect(inner.getByLabelText('Dots Gradient first color')).toHaveValue('#2078cf');
    expect(inner.getByLabelText('Dots Gradient second color')).toHaveValue('#000000');
  });

  it('passes accessibility checks with all sections expanded', async () => {
    const result = await setUp();
    await checkAccessibility(result);
    await result.user.click(result.inner.getByRole('radio', { name: 'Color gradient' }));
    await checkAccessibility(result);
  });
});
