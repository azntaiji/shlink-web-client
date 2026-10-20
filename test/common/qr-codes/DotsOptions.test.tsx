import { fireEvent, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import type { ColorControlProps } from '../../../src/common/qr-codes/DotsOptions';
import { DotsOptions } from '../../../src/common/qr-codes/DotsOptions';
import { useDotsStyling } from '../../../src/common/qr-codes/dotsStyling';
import { checkAccessibility } from '../../__helpers__/accessibility';

const ColorControl = ({ name, color, onChange }: ColorControlProps) => (
  <input aria-label={name} value={color} onChange={(event) => onChange(event.target.value)} />
);

const Controls = () => {
  const { styling, setStyling } = useDotsStyling();
  return (
    <DotsOptions {...{ styling, setStyling }} color="#000000" onColorChange={vi.fn()} ColorControl={ColorControl} />
  );
};

describe('<DotsOptions />', () => {
  const setUp = async () => {
    const result = render(<Controls />);
    const user = userEvent.setup();
    return { ...result, user };
  };

  it('starts expanded with the requested defaults and six styles', () => {
    render(<Controls />);
    expect(screen.getByText('Dots Options').closest('details')).toHaveAttribute('open');
    expect(screen.getByLabelText('Dots Style')).toHaveValue('square');
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Square',
      'Dots',
      'Rounded',
      'Extra Rounded',
      'Classy',
      'Classy Rounded',
    ]);
    expect(screen.getByRole('radio', { name: 'Single color' })).toBeChecked();
    expect(screen.getByLabelText('Dots Color')).toHaveValue('#000000');
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
  });

  it('preserves styles and colors when collapsing and switching color and gradient types', async () => {
    const { user } = await setUp();
    await user.selectOptions(screen.getByLabelText('Dots Style'), 'classy-rounded');
    await user.click(screen.getByRole('radio', { name: 'Color gradient' }));
    expect(screen.getByRole('radio', { name: 'Linear' })).toBeChecked();
    expect(screen.getByLabelText('Dots Gradient first color')).toHaveValue('#2078cf');
    expect(screen.getByLabelText('Dots Gradient second color')).toHaveValue('#000000');
    expect(screen.getByRole('spinbutton')).toHaveValue(0);

    fireEvent.change(screen.getByLabelText('Dots Gradient first color'), { target: { value: '#ff0000' } });
    fireEvent.change(screen.getByLabelText('Dots Gradient second color'), { target: { value: '#00ff00' } });
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '-90.5' } });
    await user.click(screen.getByRole('radio', { name: 'Radial' }));
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'Linear' }));
    expect(screen.getByRole('spinbutton')).toHaveValue(-90.5);

    await user.click(screen.getByRole('radio', { name: 'Single color' }));
    expect(screen.queryByLabelText('Dots Gradient first color')).not.toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'Color gradient' }));
    await user.click(screen.getByText('Dots Options'));
    await user.click(screen.getByText('Dots Options'));
    expect(screen.getByLabelText('Dots Style')).toHaveValue('classy-rounded');
    expect(screen.getByLabelText('Dots Gradient first color')).toHaveValue('#ff0000');
    expect(screen.getByLabelText('Dots Gradient second color')).toHaveValue('#00ff00');
  });

  it('keeps invalid rotation values out of the renderer', async () => {
    const { user } = await setUp();
    await user.click(screen.getByRole('radio', { name: 'Color gradient' }));
    await user.click(screen.getByRole('spinbutton'));
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '' } });
    await user.tab();
    expect(screen.getByRole('spinbutton')).toHaveValue(0);
  });

  it('allows typing negative and fractional rotations', async () => {
    const { user } = await setUp();
    await user.click(screen.getByRole('radio', { name: 'Color gradient' }));
    await user.clear(screen.getByRole('spinbutton'));
    await user.type(screen.getByRole('spinbutton'), '-90.5');
    await user.tab();
    expect(screen.getByRole('spinbutton')).toHaveValue(-90.5);
  });

  it('passes accessibility checks with single color and gradient controls', async () => {
    const result = await setUp();
    await checkAccessibility(result);
    await result.user.click(screen.getByRole('radio', { name: 'Color gradient' }));
    await checkAccessibility(result);
  });
});
