import { ExternalLink } from 'react-external-link';
import pack from '../../package.json' with { type: 'json' };
import type { SelectedServer } from '../servers/data';
import { isReachableServer } from '../servers/data';
import { versionToPrintable, versionToSemVer } from '../utils/helpers/version';

const SHLINK_WEB_CLIENT_VERSION = import.meta.env.VITE_APP_VERSION;
const normalizeVersion = (version: string) => versionToPrintable(versionToSemVer(version));

export interface ShlinkVersionsProps {
  selectedServer: SelectedServer;
  clientVersion?: string;
}

const VersionLink = ({ project, version }: { project: 'shlink' | 'shlink-web-client'; version: string }) => (
  <ExternalLink
    href={`${project === 'shlink' ? 'https://github.com/shlinkio/shlink' : pack.repository}/releases/${version === 'latest' ? 'latest' : `tag/${version}`}`}
    className="text-gray-500"
  >
    <b>{version}</b>
  </ExternalLink>
);

export const ShlinkVersions = ({ selectedServer, clientVersion = SHLINK_WEB_CLIENT_VERSION }: ShlinkVersionsProps) => {
  const normalizedClientVersion = normalizeVersion(clientVersion);

  return (
    <small className="text-gray-500">
      {isReachableServer(selectedServer) && (
        <>
          Server: <VersionLink project="shlink" version={selectedServer.printableVersion} /> -{' '}
        </>
      )}
      Client: <VersionLink project="shlink-web-client" version={normalizedClientVersion} />
    </small>
  );
};
