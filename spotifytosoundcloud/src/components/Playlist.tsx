// src/components/Playlist.tsx

interface PlaylistProps {
  playlist: any;
}

export default function Playlist({ playlist }: PlaylistProps) {
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
      {/* <a
        href={playlist.external_urls.spotify}
        target="_blank"
        rel="noopener noreferrer"
      >
        Open on Spotify
      </a> */}
      <button>Click Here!</button>
    </div>
  );
}
