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

describe('<CornersSquareOptions />', () => {
  const setUp = async () => {
    const result = render(<Controls />);
    const user = userEvent.setup();
    const summary = screen.getByText('Corners Square Options');
    const corners = within(summary.closest('details')!);
    const dots = within(screen.getByText('Dots Options').closest('details')!);
    await user.click(summary);
    return { ...result, user, corners, dots };
  };

  it('starts inherited with the four styles and Clear disabled', async () => {
    const { corners } = await setUp();
    expect(corners.getByLabelText('Corners Square Style')).toHaveValue('');
    expect(corners.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'None',
      'Square',
      'Dot',
      'Extra Rounded',
    ]);
    expect(corners.getByLabelText('Corners Square Color')).toHaveValue('#123456');
    expect(corners.getByRole('button', { name: 'Clear' })).toBeDisabled();
  });

  it('inherits live gradients and rotations from dots until color is overridden', async () => {
    const { user, corners, dots } = await setUp();
    await user.selectOptions(corners.getByLabelText('Corners Square Style'), 'dot');
    await user.click(dots.getByRole('radio', { name: 'Color gradient' }));
    fireEvent.change(dots.getByRole('spinbutton'), { target: { value: '45' } });
    expect(corners.getByRole('spinbutton')).toHaveValue(45);
    fireEvent.change(dots.getByRole('spinbutton'), { target: { value: '90' } });
    expect(corners.getByRole('spinbutton')).toHaveValue(90);
    fireEvent.change(dots.getByLabelText('Dots Gradient first color'), { target: { value: '#ff0000' } });
    expect(corners.getByLabelText('Dots Gradient first color')).toHaveValue('#ff0000');
    expect(corners.getByLabelText('Corners Square Style')).toHaveValue('dot');

    fireEvent.change(corners.getByLabelText('Dots Gradient second color'), { target: { value: '#00ff00' } });
    await user.click(dots.getByRole('radio', { name: 'Radial' }));
    expect(corners.getByRole('radio', { name: 'Linear' })).toBeChecked();
    expect(corners.getByLabelText('Dots Gradient second color')).toHaveValue('#00ff00');
    expect(dots.getByLabelText('Dots Gradient second color')).toHaveValue('#000000');
    await user.click(corners.getByRole('button', { name: 'Clear' }));
    expect(corners.getByLabelText('Corners Square Style')).toHaveValue('');
    expect(corners.getByRole('radio', { name: 'Radial' })).toBeChecked();
    expect(corners.getByRole('button', { name: 'Clear' })).toBeDisabled();
  });

  it('overrides single color independently and clears every override', async () => {
    const { user, corners, dots } = await setUp();
    fireEvent.change(corners.getByLabelText('Corners Square Color'), { target: { value: '#ff0000' } });
    await user.selectOptions(corners.getByLabelText('Corners Square Style'), 'extra-rounded');
    expect(dots.getByLabelText('Dots Color')).toHaveValue('#123456');
    await user.click(dots.getByRole('radio', { name: 'Color gradient' }));
    expect(corners.getByRole('radio', { name: 'Single color' })).toBeChecked();
    expect(corners.getByLabelText('Corners Square Color')).toHaveValue('#ff0000');
    await user.selectOptions(corners.getByLabelText('Corners Square Style'), '');
    expect(corners.getByRole('button', { name: 'Clear' })).toBeEnabled();
    await user.click(corners.getByRole('button', { name: 'Clear' }));
    expect(corners.getByRole('radio', { name: 'Color gradient' })).toBeChecked();
    expect(corners.getByRole('button', { name: 'Clear' })).toBeDisabled();
  });

  it('edits outer-eye gradients without affecting dots and restores rotation on Clear', async () => {
    const { user, corners, dots } = await setUp();
    await user.click(corners.getByRole('radio', { name: 'Color gradient' }));
    fireEvent.change(corners.getByLabelText('Dots Gradient first color'), { target: { value: '#ff0000' } });
    await user.clear(corners.getByRole('spinbutton'));
    await user.type(corners.getByRole('spinbutton'), '-90.5');
    await user.tab();
    expect(corners.getByRole('spinbutton')).toHaveValue(-90.5);
    await user.click(corners.getByRole('radio', { name: 'Radial' }));
    expect(corners.queryByRole('spinbutton')).not.toBeInTheDocument();
    await user.click(corners.getByRole('radio', { name: 'Linear' }));
    expect(corners.getByRole('spinbutton')).toHaveValue(-90.5);
    await user.click(dots.getByRole('radio', { name: 'Color gradient' }));
    expect(dots.getByRole('spinbutton')).toHaveValue(0);
    await user.click(corners.getByRole('button', { name: 'Clear' }));
    expect(corners.getByRole('spinbutton')).toHaveValue(0);
    expect(corners.getByLabelText('Dots Gradient first color')).toHaveValue('#2078cf');
  });

  it('passes accessibility checks with both sections expanded', async () => {
    const result = await setUp();
    await checkAccessibility(result);
    await result.user.click(result.corners.getByRole('radio', { name: 'Color gradient' }));
    await checkAccessibility(result);
  });
});
