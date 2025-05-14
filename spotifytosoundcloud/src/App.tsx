import { useEffect, useState } from "react";
import Profile from "./components/Profile";
import Playlist from "./components/Playlist";
import {
  fetchProfile,
  fetchPlaylists,
  getAccessToken,
  redirectToAuthCodeFlow,
  generateCodeVerifier,
} from "./spotify";
import {
  getSoundCloudAccessToken,
  redirectToSoundCloudAuth,
} from "./soundcloud";

function App() {
  const [accessToken, setAccessToken] = useState<string>("");
  const [scAccessToken, setScAccessToken] = useState<string>("");
  const [profile, setProfile] = useState<any>(null);
  const [playlists, setPlaylists] = useState<any[]>([]);

  //  Spotify Auth Handler
  async function handleSpotifyAuth(code: string | null) {
    const storedToken = localStorage.getItem("access_token");
    const verifier = localStorage.getItem("verifier");

    if (storedToken) {
      try {
        const testProfile = await fetchProfile(storedToken);
        if (testProfile.error) throw new Error("Invalid token");
        setAccessToken(storedToken);
        return;
      } catch {
        localStorage.removeItem("access_token");
        localStorage.removeItem("verifier");
      }
    }

    if (code && verifier) {
      try {
        const token = await getAccessToken(code, verifier);
        localStorage.setItem("access_token", token);
        setAccessToken(token);
        // Clean up URL
        window.history.replaceState({}, document.title, "/");
        return;
      } catch {
        localStorage.removeItem("access_token");
        localStorage.removeItem("verifier");
      }
    }

    const newVerifier = generateCodeVerifier();
    await redirectToAuthCodeFlow(newVerifier);
  }

  //  SoundCloud Auth Handler
  async function handleSoundCloudAuth(code: string | null) {
    const storedToken = localStorage.getItem("sc_access_token");

    if (storedToken) {
      try {
        const res = await fetch("https://api.soundcloud.com/me", {
          headers: { Authorization: `OAuth ${storedToken}` },
        });
        if (!res.ok) throw new Error("Invalid token");
        console.log(storedToken);
        setScAccessToken(storedToken);
        return;
      } catch {
        localStorage.removeItem("sc_access_token");
      }
    }

    if (code) {
      try {
        const token = await getSoundCloudAccessToken(code);
        const res = await fetch("https://api.soundcloud.com/me", {
          headers: { Authorization: `OAuth ${token}` },
        });
        if (!res.ok) throw new Error("Invalid token after login");
        localStorage.setItem("sc_access_token", token);
        setScAccessToken(token);
        // Clean up URL
        console.log(token);
        window.history.replaceState({}, document.title, "/");
        return;
      } catch (err) {
        console.warn("SoundCloud login/token validation failed:", err);
        localStorage.removeItem("sc_access_token");
      }
    }

    await redirectToSoundCloudAuth();
  }

  const [spotifyHandled, setSpotifyHandled] = useState(false);

  useEffect(() => {
    if (spotifyHandled) return;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const verifier = localStorage.getItem("verifier");

    if (!accessToken && verifier && code) {
      setSpotifyHandled(true);
      handleSpotifyAuth(code);
    } else if (!accessToken && !code) {
      setSpotifyHandled(true);
      handleSpotifyAuth(null);
    }
  }, [accessToken, spotifyHandled]);

  const [scHandled, setScHandled] = useState(false);

  useEffect(() => {
    if (scHandled) return;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (!scAccessToken && code && !localStorage.getItem("access_token")) {
      setScHandled(true);
      handleSoundCloudAuth(code);
    } else if (!scAccessToken && !code) {
      setScHandled(true);
      handleSoundCloudAuth(null);
    }
  }, [scAccessToken, scHandled]);

  //  Fetch Spotify data
  useEffect(() => {
    if (!accessToken) return;

    async function loadData() {
      try {
        const profileData = await fetchProfile(accessToken);
        setProfile(profileData);

        const playlistsData = await fetchPlaylists(accessToken);
        setPlaylists(playlistsData || []);
      } catch (e) {
        console.error("Error loading Spotify data:", e);
      }
    }

    loadData();
  }, [accessToken]);

  return (
    <div className="App">
      <h1>Spotify Profile Viewer</h1>
      {profile && <Profile profile={profile} />}
      <h2>Your Playlists</h2>
      {playlists.map((playlist) => (
        <Playlist
          key={playlist.id}
          playlist={playlist}
          accessToken={accessToken}
          scAccessToken={scAccessToken}
        />
      ))}
    </div>
  );
}

export default App;
