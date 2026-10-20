import { render, screen } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import type { ShlinkVersionsProps } from '../../src/common/ShlinkVersions';
import { ShlinkVersions } from '../../src/common/ShlinkVersions';
import type { NonReachableServer, NotFoundServer, ReachableServer } from '../../src/servers/data';
import { checkAccessibility } from '../__helpers__/accessibility';

describe('<ShlinkVersions />', () => {
  const setUp = (props: ShlinkVersionsProps) => render(<ShlinkVersions {...props} />);

  it('passes a11y checks', () =>
    checkAccessibility(setUp({ selectedServer: fromPartial({ version: '1.0.0', printableVersion: '1.0.0' }) })));

  it.each([
    ['1.2.3', fromPartial<ReachableServer>({ version: '1.0.0', printableVersion: 'foo' }), 'v1.2.3', 'foo'],
    ['foo', fromPartial<ReachableServer>({ version: '1.0.0', printableVersion: '1.2.3' }), 'latest', '1.2.3'],
    ['latest', fromPartial<ReachableServer>({ version: '1.0.0', printableVersion: 'latest' }), 'latest', 'latest'],
    [
      '4.9.0-beta.1',
      fromPartial<ReachableServer>({ version: '1.0.0', printableVersion: 'v1.0.0' }),
      'v4.9.0-beta.1',
      'v1.0.0',
    ],
    ['5.5.0', fromPartial<ReachableServer>({ version: '1.0.0', printableVersion: '0.2.8' }), 'v5.5.0', '0.2.8'],
    ['not-semver', fromPartial<ReachableServer>({ version: '1.0.0', printableVersion: 'some' }), 'latest', 'some'],
  ])(
    'displays expected versions when selected server is reachable',
    (clientVersion, selectedServer, expectedClientVersion, expectedServerVersion) => {
      setUp({ clientVersion, selectedServer });
      const [serverLink, clientLink] = screen.getAllByRole('link');

      expect(serverLink).toHaveAttribute(
        'href',
        `https://github.com/shlinkio/shlink/releases/${expectedServerVersion === 'latest' ? 'latest' : `tag/${expectedServerVersion}`}`,
      );
      expect(serverLink).toHaveTextContent(expectedServerVersion);
      expect(clientLink).toHaveAttribute(
        'href',
        `https://github.com/azntaiji/shlink-web-client/releases/${expectedClientVersion === 'latest' ? 'latest' : `tag/${expectedClientVersion}`}`,
      );
      expect(clientLink).toHaveTextContent(expectedClientVersion);
    },
  );

  it('shows the configured beta version by default and links to the fork release', () => {
    setUp({ selectedServer: null });
    expect(screen.getByRole('link')).toHaveTextContent('v4.9.0-beta.1');
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      'https://github.com/azntaiji/shlink-web-client/releases/tag/v4.9.0-beta.1',
    );
  });

  it.each([
    ['1.2.3', null],
    ['1.2.3', fromPartial<NotFoundServer>({ serverNotFound: true })],
    ['1.2.3', fromPartial<NonReachableServer>({ serverNotReachable: true })],
  ])('displays only client version when selected server is not reachable', (clientVersion, selectedServer) => {
    setUp({ clientVersion, selectedServer });
    const links = screen.getAllByRole('link');

    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', 'https://github.com/azntaiji/shlink-web-client/releases/tag/v1.2.3');
  });
});
