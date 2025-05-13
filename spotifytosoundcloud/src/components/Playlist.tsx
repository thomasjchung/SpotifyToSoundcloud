// src/components/Playlist.tsx

import { soundCloudConvert } from "../spotify";

interface PlaylistProps {
  playlist: any;
  accessToken: string;
  scAccessToken: string;
}

export default function Playlist({
  playlist,
  accessToken,
  scAccessToken,
}: PlaylistProps) {
  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: "1rem",
        marginBottom: "1rem",
      }}
    >
      <h3>{playlist.name}</h3>
      <p>Tracks: {playlist.tracks.total}</p>
      <p>Href: {playlist.tracks.href}</p>
      {/* <a
        href={playlist.external_urls.spotify}
        target="_blank"
        rel="noopener noreferrer"
      >
        Open on Spotify
      </a> */}
      <button
        onClick={() =>
          soundCloudConvert(
            accessToken,
            playlist.id,
            playlist.name,
            scAccessToken
          )
        }
      >
        Click Here!
      </button>
    </div>
  );
}
