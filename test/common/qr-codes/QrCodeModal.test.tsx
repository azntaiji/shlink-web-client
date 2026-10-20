import { ShlinkWebComponent } from '@shlinkio/shlink-web-component';
import type { ShlinkApiClient } from '@shlinkio/shlink-web-component/api-contract';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { fromPartial } from '@total-typescript/shoehorn';
import QRCodeStyling from 'qr-code-styling';
import { MemoryRouter } from 'react-router';
import { page } from 'vitest/browser';
import '../../../src/tailwind.css';

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
    expect(modal.getByLabelText('Dots Color')).toHaveValue('#000000');
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
    await user.click(modal.getByRole('button', { name: /close/i }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await user.click(within(row).getByRole('button', { name: 'Options' }));
    await user.click(await screen.findByText('QR code', { exact: true }));
    const reopened = within(await screen.findByRole('dialog'));
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
    update.mockRestore();
  });
});
