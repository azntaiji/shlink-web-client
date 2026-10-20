import { fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useState } from 'react';
import type { ColorControlProps } from '../../../src/common/qr-codes/DotsOptions';
import { FrameOptions } from '../../../src/common/qr-codes/FrameOptions';
import { QrStylingOptions } from '../../../src/common/qr-codes/QrStylingOptions';
import { useQrStyling } from '../../../src/common/qr-codes/useQrStyling';
import { checkAccessibility } from '../../__helpers__/accessibility';

const ColorControl = ({ name, color, onChange }: ColorControlProps) => (
  <input aria-label={name} value={color} onChange={(event) => onChange(event.target.value)} />
);

const Controls = () => {
  const qr = useQrStyling();
  const [color, setColor] = useState('#123456');
  return (
    <>
      <QrStylingOptions {...qr} color={color} onColorChange={setColor} ColorControl={ColorControl} />
      <FrameOptions {...qr} color={color} ColorControl={ColorControl} />
    </>
  );
};

describe('<FrameOptions />', () => {
  const setUp = async () => {
    const result = render(<Controls />);
    const user = userEvent.setup();
    const summary = screen.getByText('Frame', { exact: true });
    expect(summary.closest('details')).not.toHaveAttribute('open');
    await user.click(summary);
    return {
      ...result,
      user,
      frame: within(summary.closest('details')!),
      dots: within(screen.getByText('Dots Options').closest('details')!),
    };
  };

  it('starts disabled, then enables a square frame with inherited color and empty text', async () => {
    const { user, frame } = await setUp();
    expect(frame.getByRole('checkbox', { name: 'Enable frame' })).not.toBeChecked();
    expect(frame.queryByRole('radio')).not.toBeInTheDocument();
    await user.click(frame.getByRole('checkbox', { name: 'Enable frame' }));
    expect(frame.getByRole('radio', { name: 'Square' })).toBeChecked();
    expect(frame.getByRole('checkbox', { name: 'Inherit dots color' })).toBeChecked();
    expect(frame.getByLabelText('Frame Color')).toHaveValue('#123456');
    expect(frame.getByLabelText('Top Text')).toHaveValue('');
    expect(frame.getByLabelText('Bottom Text')).toHaveValue('');
  });

  it('inherits live dots color or gradient and supports a separate custom color', async () => {
    const { user, frame, dots } = await setUp();
    await user.click(frame.getByRole('checkbox', { name: 'Enable frame' }));
    fireEvent.change(dots.getByLabelText('Dots Color'), { target: { value: '#00ff00' } });
    expect(frame.getByLabelText('Frame Color')).toHaveValue('#00ff00');
    await user.click(dots.getByRole('radio', { name: 'Color gradient' }));
    expect(frame.getByLabelText('Frame Color')).toHaveValue('#2078cf');
    fireEvent.change(frame.getByLabelText('Frame Color'), { target: { value: '#ff0000' } });
    expect(frame.getByRole('checkbox', { name: 'Inherit dots color' })).not.toBeChecked();
    fireEvent.change(dots.getByLabelText('Dots Gradient first color'), { target: { value: '#abcdef' } });
    expect(frame.getByLabelText('Frame Color')).toHaveValue('#ff0000');
    await user.click(frame.getByRole('checkbox', { name: 'Inherit dots color' }));
    expect(frame.getByLabelText('Frame Color')).toHaveValue('#abcdef');
    await user.click(frame.getByRole('checkbox', { name: 'Inherit dots color' }));
    fireEvent.change(dots.getByLabelText('Dots Gradient first color'), { target: { value: '#000000' } });
    expect(frame.getByLabelText('Frame Color')).toHaveValue('#abcdef');
  });

  it('limits both text inputs to 20 characters and retains choices when toggled off', async () => {
    const { user, frame } = await setUp();
    await user.click(frame.getByRole('checkbox', { name: 'Enable frame' }));
    await user.click(frame.getByRole('radio', { name: 'Circle' }));
    await user.type(frame.getByLabelText('Top Text'), '1234567890123456789012345');
    fireEvent.change(frame.getByLabelText('Bottom Text'), { target: { value: 'abcdefghijklmnopqrstuvw' } });
    expect(frame.getByLabelText('Top Text')).toHaveValue('12345678901234567890');
    expect(frame.getByLabelText('Bottom Text')).toHaveValue('abcdefghijklmnopqrst');
    await user.click(frame.getByRole('checkbox', { name: 'Enable frame' }));
    expect(frame.queryByLabelText('Top Text')).not.toBeInTheDocument();
    await user.click(frame.getByRole('checkbox', { name: 'Enable frame' }));
    expect(frame.getByRole('radio', { name: 'Circle' })).toBeChecked();
    expect(frame.getByLabelText('Top Text')).toHaveValue('12345678901234567890');
    expect(frame.getByLabelText('Bottom Text')).toHaveValue('abcdefghijklmnopqrst');
  });

  it('passes accessibility checks disabled and with circular frame controls', async () => {
    const result = await setUp();
    await checkAccessibility(result);
    await result.user.click(result.frame.getByRole('checkbox', { name: 'Enable frame' }));
    await result.user.click(result.frame.getByRole('radio', { name: 'Circle' }));
    await checkAccessibility(result);
  });
});
