// src/components/Profile.tsx

interface ProfileProps {
  profile: any;
}

export default function Profile({ profile }: ProfileProps) {
  return (
    <section>
      <h2>Logged in as {profile.display_name}</h2>
      {profile.images.length > 0 && (
        <img src={profile.images[0].url} alt="Avatar" width={100} />
      )}
      <ul>
        <li>User ID: {profile.id}</li>
        <li>Email: {profile.email}</li>
        <li>
          Spotify URI: <a href={profile.uri}>{profile.uri}</a>
        </li>
        <li>
          Link:{" "}
          <a href={profile.external_urls.spotify}>
            {profile.external_urls.spotify}
          </a>
        </li>
      </ul>
    </section>
  );
}
