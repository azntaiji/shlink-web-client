import './setup';
import { ShlinkWebComponent } from '@shlinkio/shlink-web-component';
import type { ShlinkApiClient } from '@shlinkio/shlink-web-component/api-contract';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { fromPartial } from '@total-typescript/shoehorn';
import QRCodeStyling from 'qr-code-styling';
import { MemoryRouter } from 'react-router';
import { page } from 'vitest/browser';
import '../../../src/tailwind.css';
import { createLogo } from './logoFixtures';

describe('QR modal integration', () => {
  it('uses the existing modal and renderer for styling and resets options after closing', async () => {
    await page.viewport(1100, 900);
    const update = vi.spyOn(QRCodeStyling.prototype, 'update');
    const apiClient = fromPartial<ShlinkApiClient>({
      listTags: vi.fn().mockResolvedValue({ data: [] }),
      listDomains: vi.fn().mockResolvedValue({ data: [] }),
      mercureInfo: vi.fn().mockRejectedValue(new Error('Mercure disabled')),
      listShortUrls: vi.fn().mockResolvedValue({
        data: [
          {
            shortCode: 'qr',
            domain: null,
            shortUrl: 'https://example.com/qr',
            longUrl: 'https://example.com/long',
            dateCreated: '2026-10-20T00:00:00+00:00',
            tags: [],
            title: 'Test QR',
            visitsSummary: { total: 0, nonBots: 0, bots: 0 },
            meta: { validSince: null, validUntil: null, maxVisits: null },
          },
        ],
        pagination: { currentPage: 1, pagesCount: 1, totalItems: 1 },
      }),
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/list-short-urls/1']}>
        <ShlinkWebComponent apiClient={apiClient} serverVersion="4.5.0" />
      </MemoryRouter>,
    );
    const row = (await screen.findByText('Test QR')).closest('tr')!;
    await user.click(within(row).getByRole('button', { name: 'Options' }));
    await user.click(await screen.findByText('QR code', { exact: true }));
    const modal = within(await screen.findByRole('dialog'));
    const dots = within(modal.getByText('Dots Options').closest('details')!);
    expect(modal.getByText('Dots Options').closest('details')).toHaveAttribute('open');
    expect(modal.queryByLabelText('color', { exact: true })).not.toBeInTheDocument();
    expect(dots.getByLabelText('Dots Color')).toHaveValue('#000000');
    await user.selectOptions(modal.getByLabelText('Dots Style'), 'classy-rounded');
    await user.click(dots.getByRole('radio', { name: 'Color gradient' }));
    fireEvent.change(dots.getByRole('spinbutton'), { target: { value: '90' } });
    await waitFor(() =>
      expect(update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          dotsOptions: expect.objectContaining({
            type: 'classy-rounded',
            gradient: expect.objectContaining({ rotation: Math.PI / 2 }),
          }),
        }),
      ),
    );
    const originalCorrection = modal.getByRole('button', { name: 'Error correction (H)' });
    await user.click(originalCorrection);
    await user.click(await screen.findByRole('menuitem', { name: /edium/ }));
    const logoInput = modal.getByTestId('logo-input');
    const logoFile = async (wide = false) =>
      new File([await (await fetch(createLogo(wide ? 'wide' : 'opaque'))).blob()], wide ? 'wide.png' : 'logo.png', {
        type: 'image/png',
      });
    fireEvent.change(logoInput, { target: { files: [await logoFile()] } });
    const lockedCorrection = await modal.findByRole('button', { name: 'Error correction (H)' });
    expect(lockedCorrection).toBeDisabled();
    expect(modal.getByText('High error correction is required for logos.')).toBeInTheDocument();
    const previewWithLogo = modal.getByTestId('qr-code-container');
    await waitFor(() => expect(previewWithLogo.querySelector('image')).not.toBeNull());
    const firstLogo = previewWithLogo.querySelector('image')!.getAttribute('href');
    const logoRenderer = update.mock.contexts.at(-1) as QRCodeStyling;
    const logoPng = (await logoRenderer.getRawData('png')) as Blob;
    const expectedLogoUri = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(logoPng);
    });
    const logoCopy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    await user.click(modal.getByRole('button', { name: 'Copy data URI' }));
    await waitFor(() => expect(logoCopy).toHaveBeenCalledWith(expectedLogoUri));
    logoCopy.mockRestore();

    await user.click(modal.getByRole('button', { name: 'Clear logo (logo.png)' }));
    expect(modal.getByRole('button', { name: 'Error correction (M)' })).toBeEnabled();
    fireEvent.change(modal.getByTestId('logo-input'), { target: { files: [await logoFile(true)] } });
    await waitFor(() => expect(previewWithLogo.querySelector('image')!.getAttribute('href')).not.toBe(firstLogo));
    expect(modal.getByRole('button', { name: 'Error correction (H)' })).toBeDisabled();
    await user.click(modal.getByRole('button', { name: 'Clear logo (wide.png)' }));
    expect(modal.getByRole('button', { name: 'Error correction (M)' })).toBeEnabled();
    expect(modal.queryByText('High error correction is required for logos.')).not.toBeInTheDocument();
    await waitFor(() => expect(previewWithLogo.querySelector('image')).toBeNull());
    expect((update.mock.contexts.at(-1) as QRCodeStyling)._options.qrOptions.errorCorrectionLevel).toBe('M');

    expect(modal.getByRole('button', { name: /Download/ })).toBeInTheDocument();
    expect(modal.getByRole('button', { name: 'Copy data URI' })).toBeInTheDocument();
    await page.screenshot({ path: '../../../reports/qr-code-dots-options.png' });
    await user.click(dots.getByRole('radio', { name: 'Single color' }));
    await waitFor(() =>
      expect(update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          dotsOptions: { color: '#000000', type: 'classy-rounded', gradient: undefined },
        }),
      ),
    );
    await user.click(modal.getByText('Dots Options'));
    await user.click(modal.getByText('Corners Square Options'));
    const corners = within(modal.getByText('Corners Square Options').closest('details')!);
    await user.selectOptions(corners.getByLabelText('Corners Square Style'), 'dot');
    fireEvent.change(corners.getByLabelText('Corners Square Color picker'), { target: { value: '#ff0000' } });
    await waitFor(() =>
      expect(update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          cornersSquareOptions: { type: 'dot', color: '#ff0000', gradient: undefined },
          cornersDotOptions: { type: undefined, color: 'inherit', gradient: undefined },
          dotsOptions: { type: 'classy-rounded', color: '#000000', gradient: undefined },
        }),
      ),
    );
    await user.click(corners.getByRole('radio', { name: 'Color gradient' }));
    fireEvent.change(corners.getByRole('spinbutton'), { target: { value: '135' } });
    await waitFor(() =>
      expect(update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          cornersSquareOptions: expect.objectContaining({
            gradient: expect.objectContaining({ rotation: (135 * Math.PI) / 180 }),
          }),
        }),
      ),
    );
    await page.screenshot({ path: '../../../reports/qr-code-corners-square-options.png' });
    await user.click(corners.getByRole('button', { name: 'Clear' }));
    await waitFor(() =>
      expect(update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          cornersSquareOptions: { type: undefined, color: undefined, gradient: undefined },
          cornersDotOptions: undefined,
        }),
      ),
    );
    await user.selectOptions(corners.getByLabelText('Corners Square Style'), 'square');
    await user.click(corners.getByRole('radio', { name: 'Color gradient' }));
    await user.click(modal.getByText('Corners Square Options'));
    await user.click(modal.getByText('Corners Dot Options'));
    const inner = within(modal.getByText('Corners Dot Options').closest('details')!);
    const beforeInner = update.mock.contexts.at(-1) as QRCodeStyling;
    const beforePng = (await beforeInner.getRawData('png')) as Blob;
    await user.selectOptions(inner.getByLabelText('Corners Dot Style'), 'dots');
    fireEvent.change(inner.getByLabelText('Corners Dot Color picker'), { target: { value: '#ff00ff' } });
    await waitFor(() =>
      expect(update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          cornersDotOptions: { type: 'dots', color: '#ff00ff', gradient: undefined },
          cornersSquareOptions: expect.objectContaining({
            type: 'square',
            gradient: expect.objectContaining({ type: 'linear' }),
          }),
        }),
      ),
    );
    const afterInner = update.mock.contexts.at(-1) as QRCodeStyling;
    expect(afterInner).not.toBe(beforeInner);
    const afterPng = (await afterInner.getRawData('png')) as Blob;
    const beforeBytes = new Uint8Array(await beforePng.arrayBuffer());
    const afterBytes = new Uint8Array(await afterPng.arrayBuffer());
    expect(
      beforeBytes.length !== afterBytes.length || afterBytes.some((byte, index) => byte !== beforeBytes[index]),
    ).toBe(true);
    await user.click(inner.getByRole('radio', { name: 'Color gradient' }));
    await user.click(inner.getByRole('radio', { name: 'Radial' }));
    await waitFor(() =>
      expect(update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          cornersDotOptions: expect.objectContaining({
            type: 'dots',
            gradient: expect.objectContaining({ type: 'radial' }),
          }),
        }),
      ),
    );
    await user.click(inner.getByRole('radio', { name: 'Linear' }));
    fireEvent.change(inner.getByRole('spinbutton'), { target: { value: '-45' } });
    await waitFor(() =>
      expect(update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          cornersDotOptions: expect.objectContaining({ gradient: expect.objectContaining({ rotation: -Math.PI / 4 }) }),
        }),
      ),
    );
    await page.viewport(1100, 1100);
    await page.screenshot({ path: '../../../reports/qr-code-corners-dot-options.png' });
    await user.click(inner.getByRole('button', { name: 'Clear' }));
    await waitFor(() =>
      expect(update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          cornersDotOptions: { type: undefined, color: 'inherit', gradient: undefined },
          cornersSquareOptions: expect.objectContaining({
            type: 'square',
            gradient: expect.objectContaining({ type: 'linear' }),
          }),
        }),
      ),
    );
    await user.selectOptions(inner.getByLabelText('Corners Dot Style'), 'classy');
    fireEvent.change(inner.getByLabelText('Corners Dot Color picker'), { target: { value: '#ff00ff' } });
    await user.click(modal.getByText('Corners Dot Options'));
    await user.click(modal.getByText('Background Options'));
    const background = within(modal.getByText('Background Options').closest('details')!);
    expect(modal.queryByLabelText('background', { exact: true })).not.toBeInTheDocument();
    expect(background.getByLabelText('Background Color')).toHaveValue('#ffffff');
    fireEvent.change(background.getByLabelText('Background Color picker'), { target: { value: '#fedcba' } });
    await waitFor(() =>
      expect(update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          backgroundOptions: { color: '#fedcba', gradient: undefined },
        }),
      ),
    );
    const beforeBackground = update.mock.contexts.at(-1) as QRCodeStyling;
    const beforeBackgroundPng = new Uint8Array(
      await ((await beforeBackground.getRawData('png')) as Blob).arrayBuffer(),
    );
    await user.click(background.getByRole('radio', { name: 'Color gradient' }));
    expect(background.getByLabelText('Dots Gradient first color')).toHaveValue('#a7b6c5');
    expect(background.getByLabelText('Dots Gradient second color')).toHaveValue('#ffffff');
    expect(background.getByRole('spinbutton')).toHaveValue(0);
    fireEvent.change(background.getByLabelText('Dots Gradient first color picker'), { target: { value: '#c0d0e0' } });
    fireEvent.change(background.getByLabelText('Dots Gradient second color picker'), { target: { value: '#fefefe' } });
    fireEvent.change(background.getByRole('spinbutton'), { target: { value: '90' } });
    await waitFor(() =>
      expect(update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          backgroundOptions: {
            color: '#fedcba',
            gradient: {
              type: 'linear',
              rotation: Math.PI / 2,
              colorStops: [
                { offset: 0, color: '#c0d0e0' },
                { offset: 1, color: '#fefefe' },
              ],
            },
          },
          dotsOptions: { color: '#000000', type: 'classy-rounded', gradient: undefined },
          cornersDotOptions: { color: '#ff00ff', type: 'classy', gradient: undefined },
          cornersSquareOptions: expect.objectContaining({ type: 'square' }),
        }),
      ),
    );
    const afterBackground = update.mock.contexts.at(-1) as QRCodeStyling;
    const afterBackgroundPng = new Uint8Array(await ((await afterBackground.getRawData('png')) as Blob).arrayBuffer());
    expect(
      beforeBackgroundPng.length !== afterBackgroundPng.length ||
        afterBackgroundPng.some((byte, index) => byte !== beforeBackgroundPng[index]),
    ).toBe(true);
    await user.click(background.getByRole('radio', { name: 'Radial' }));
    await waitFor(() =>
      expect(update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          backgroundOptions: expect.objectContaining({
            gradient: expect.objectContaining({ type: 'radial', rotation: 0 }),
          }),
        }),
      ),
    );
    await user.click(background.getByRole('radio', { name: 'Linear' }));
    expect(background.getByRole('spinbutton')).toHaveValue(90);
    await page.screenshot({ path: '../../../reports/qr-code-background-options.png' });
    await user.click(background.getByRole('button', { name: 'Reset' }));
    expect(background.getByRole('radio', { name: 'Single color' })).toBeChecked();
    expect(background.getByLabelText('Background Color')).toHaveValue('#ffffff');
    await waitFor(() =>
      expect(update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          backgroundOptions: { color: '#ffffff', gradient: undefined },
          dotsOptions: { color: '#000000', type: 'classy-rounded', gradient: undefined },
          cornersDotOptions: { color: '#ff00ff', type: 'classy', gradient: undefined },
          cornersSquareOptions: expect.objectContaining({ type: 'square' }),
        }),
      ),
    );
    fireEvent.change(background.getByLabelText('Background Color picker'), { target: { value: '#fedcba' } });
    await user.click(background.getByRole('radio', { name: 'Color gradient' }));
    await user.click(background.getByRole('radio', { name: 'Single color' }));
    await waitFor(() =>
      expect(update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          backgroundOptions: { color: '#fedcba', gradient: undefined },
        }),
      ),
    );
    await user.click(background.getByRole('radio', { name: 'Color gradient' }));
    await user.click(background.getByRole('button', { name: 'Reset' }));
    await user.click(modal.getByText('Background Options'));
    await user.click(modal.getByText('Corners Square Options'));
    await user.click(corners.getByRole('button', { name: 'Clear' }));
    await user.click(modal.getByText('Corners Square Options'));
    await user.click(modal.getByText('Corners Dot Options'));
    await user.click(inner.getByRole('button', { name: 'Clear' }));
    await user.click(modal.getByText('Corners Dot Options'));
    await user.click(modal.getByText('Dots Options'));
    await user.selectOptions(dots.getByLabelText('Dots Style'), 'square');
    await user.click(modal.getByText('Dots Options'));
    expect(modal.getByText('Frame', { exact: true }).closest('details')).toHaveAttribute('open');
    const frame = within(modal.getByText('Frame', { exact: true }).closest('details')!);
    expect(frame.getByRole('checkbox', { name: 'Enable frame' })).toBeChecked();
    expect(frame.getByRole('radio', { name: 'Circle' })).toBeChecked();
    await user.click(frame.getByRole('radio', { name: 'Square' }));
    await user.type(frame.getByLabelText('Top Text'), 'SCAN ME');
    await user.type(frame.getByLabelText('Bottom Text'), 'EXAMPLE.COM');
    const preview = screen.getByTestId('qr-code-container');
    await waitFor(() => expect(preview.querySelector('[data-qr-frame]')).toHaveAttribute('data-qr-frame', 'square'));
    expect(preview.querySelector('[data-qr-frame-text="top"]')).toHaveTextContent('SCAN ME');
    await page.getByTestId('qr-code-container').screenshot({ path: '../../../reports/qr-code-frame-square.png' });
    await page.screenshot({ path: '../../../reports/qr-code-frame-options.png' });
    const squareRenderer = update.mock.contexts.at(-1) as QRCodeStyling;
    const squarePng = new Uint8Array(await ((await squareRenderer.getRawData('png')) as Blob).arrayBuffer());
    await user.click(frame.getByRole('radio', { name: 'Circle' }));
    await waitFor(() => expect(preview.querySelector('[data-qr-frame]')).toHaveAttribute('data-qr-frame', 'circle'));
    expect(preview.querySelectorAll('textPath')).toHaveLength(2);
    const circleRenderer = update.mock.contexts.at(-1) as QRCodeStyling;
    expect(circleRenderer._options.shape).toBe('circle');
    const circlePng = new Uint8Array(await ((await circleRenderer.getRawData('png')) as Blob).arrayBuffer());
    expect(squarePng.length !== circlePng.length || circlePng.some((byte, index) => byte !== squarePng[index])).toBe(
      true,
    );
    await page.getByTestId('qr-code-container').screenshot({ path: '../../../reports/qr-code-frame-circle.png' });
    const copy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    await user.click(modal.getByRole('button', { name: 'Copy data URI' }));
    await waitFor(() => expect(copy).toHaveBeenCalledWith(expect.stringMatching(/^data:image\/png;base64,/)));
    copy.mockRestore();
    fireEvent.change(frame.getByLabelText('Frame Color picker'), { target: { value: '#ff0000' } });
    await waitFor(() => expect(preview.querySelector('[data-qr-frame]')).toHaveAttribute('stroke', '#ff0000'));
    await user.click(frame.getByRole('checkbox', { name: 'Enable frame' }));
    await waitFor(() => expect(preview.querySelector('[data-qr-frame]')).toBeNull());
    expect((update.mock.contexts.at(-1) as QRCodeStyling)._options.shape).toBe('square');
    await user.click(frame.getByRole('checkbox', { name: 'Enable frame' }));
    fireEvent.change(modal.getByTestId('logo-input'), { target: { files: [await logoFile()] } });
    expect(modal.getByRole('button', { name: 'Error correction (H)' })).toBeDisabled();
    await user.click(modal.getByRole('button', { name: /close/i }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await user.click(within(row).getByRole('button', { name: 'Options' }));
    await user.click(await screen.findByText('QR code', { exact: true }));
    const reopened = within(await screen.findByRole('dialog'));
    expect(reopened.getByRole('button', { name: 'Error correction (H)' })).toBeEnabled();
    expect(reopened.getByRole('button', { name: 'Select logo' })).toBeInTheDocument();
    await waitFor(() => expect(reopened.getByTestId('qr-code-container').querySelector('image')).toBeNull());
    expect(reopened.getByText('Dots Options').closest('details')).toHaveAttribute('open');
    expect(reopened.getByLabelText('Dots Style')).toHaveValue('square');
    expect(
      within(reopened.getByText('Dots Options').closest('details')!).getByRole('radio', { name: 'Single color' }),
    ).toBeChecked();
    await user.click(reopened.getByText('Corners Square Options'));
    const resetCorners = within(reopened.getByText('Corners Square Options').closest('details')!);
    expect(resetCorners.getByLabelText('Corners Square Style')).toHaveValue('');
    expect(resetCorners.getByRole('button', { name: 'Clear' })).toBeDisabled();
    await user.click(reopened.getByText('Corners Dot Options'));
    const resetInner = within(reopened.getByText('Corners Dot Options').closest('details')!);
    expect(resetInner.getByLabelText('Corners Dot Style')).toHaveValue('square');
    expect(resetInner.getByRole('button', { name: 'Clear' })).toBeDisabled();
    await user.click(reopened.getByText('Background Options'));
    const resetBackground = within(reopened.getByText('Background Options').closest('details')!);
    expect(resetBackground.getByRole('radio', { name: 'Single color' })).toBeChecked();
    expect(resetBackground.getByLabelText('Background Color')).toHaveValue('#ffffff');
    await user.click(resetBackground.getByRole('radio', { name: 'Color gradient' }));
    expect(resetBackground.getByLabelText('Dots Gradient first color')).toHaveValue('#a7b6c5');
    expect(resetBackground.getByLabelText('Dots Gradient second color')).toHaveValue('#ffffff');
    expect(resetBackground.getByRole('spinbutton')).toHaveValue(0);
    expect(reopened.getByText('Frame', { exact: true }).closest('details')).toHaveAttribute('open');
    const resetFrame = within(reopened.getByText('Frame', { exact: true }).closest('details')!);
    expect(resetFrame.getByRole('checkbox', { name: 'Enable frame' })).toBeChecked();
    expect(resetFrame.getByRole('radio', { name: 'Circle' })).toBeChecked();
    expect(resetFrame.getByRole('checkbox', { name: 'Inherit dots color' })).toBeChecked();
    expect(resetFrame.getByLabelText('Top Text')).toHaveValue('');
    expect(resetFrame.getByLabelText('Bottom Text')).toHaveValue('');
    await page.viewport(1600, 1000);
    const dialog = screen.getByRole('dialog');
    const settingsPanel = dialog.querySelector('.qr-code-modal-settings')!;
    const previewPanel = dialog.querySelector('.qr-code-modal-preview')!;
    const expandedDots = reopened.getByText('Dots Options').closest('details')!;
    const expandedFrame = reopened.getByText('Frame', { exact: true }).closest('details')!;
    const expandedCorners = reopened.getByText('Corners Square Options').closest('details')!;
    expect(
      Array.from(settingsPanel.querySelectorAll(':scope > details > summary')).map((summary) => summary.textContent),
    ).toEqual(['Dots Options', 'Frame', 'Corners Square Options', 'Corners Dot Options', 'Background Options']);
    const logoButton = reopened.getByRole('button', { name: 'Select logo' });
    expect(
      reopened.getByRole('button', { name: 'Error correction (H)' }).getBoundingClientRect().bottom,
    ).toBeLessThanOrEqual(logoButton.getBoundingClientRect().top);
    expect(logoButton.getBoundingClientRect().bottom).toBeLessThanOrEqual(expandedDots.getBoundingClientRect().top);
    dialog.scrollTop = 0;
    await waitFor(() => {
      expect(dialog.querySelector('[data-testid="transition-container"]')!.getBoundingClientRect().width).toBe(1280);
      expect(getComputedStyle(dialog.querySelector('[data-testid="transition-container"]')!).opacity).toBe('1');
      expect(settingsPanel.getBoundingClientRect().width).toBeGreaterThan(
        previewPanel.getBoundingClientRect().width * 1.8,
      );
      expect(expandedFrame.getBoundingClientRect().x).toBeGreaterThan(expandedDots.getBoundingClientRect().right);
      expect(expandedFrame.getBoundingClientRect().top).toBe(expandedDots.getBoundingClientRect().top);
    });
    await page.screenshot({ path: '../../../reports/qr-code-modal-wide.png' });
    await page.viewport(390, 844);
    dialog.scrollTop = 0;
    await waitFor(() => {
      expect(expandedCorners.getBoundingClientRect().x).toBe(expandedDots.getBoundingClientRect().x);
      expect(previewPanel.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        settingsPanel.getBoundingClientRect().top,
      );
      expect(dialog.scrollWidth).toBeLessThanOrEqual(dialog.clientWidth);
      expect(settingsPanel.getBoundingClientRect().width).toBeLessThan(390);
    });
    await page.screenshot({ path: '../../../reports/qr-code-modal-mobile.png' });
    update.mockRestore();
  }, 30_000);
});
