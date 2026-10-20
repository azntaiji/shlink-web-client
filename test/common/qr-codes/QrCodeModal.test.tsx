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
    expect(modal.getByText('Dots Options').closest('details')).toHaveAttribute('open');
    expect(modal.queryByLabelText('color', { exact: true })).not.toBeInTheDocument();
    expect(modal.getByLabelText('Dots Color')).toHaveValue('#000000');
    await user.selectOptions(modal.getByLabelText('Dots Style'), 'classy-rounded');
    await user.click(modal.getByRole('radio', { name: 'Color gradient' }));
    fireEvent.change(modal.getByRole('spinbutton'), { target: { value: '90' } });
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
    await user.click(modal.getByRole('radio', { name: 'Single color' }));
    await waitFor(() =>
      expect(update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          dotsOptions: { color: '#000000', type: 'classy-rounded', gradient: undefined },
        }),
      ),
    );
    await user.click(modal.getByRole('button', { name: /close/i }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await user.click(within(row).getByRole('button', { name: 'Options' }));
    await user.click(await screen.findByText('QR code', { exact: true }));
    const reopened = within(await screen.findByRole('dialog'));
    expect(reopened.getByText('Dots Options').closest('details')).toHaveAttribute('open');
    expect(reopened.getByLabelText('Dots Style')).toHaveValue('square');
    expect(reopened.getByRole('radio', { name: 'Single color' })).toBeChecked();
    update.mockRestore();
  });
});
