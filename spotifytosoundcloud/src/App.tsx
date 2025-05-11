// src/App.tsx
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

function App() {
  const [accessToken, setAccessToken] = useState<string>("");
  const [profile, setProfile] = useState<any>(null);
  const [playlists, setPlaylists] = useState<any[]>([]);

  useEffect(() => {
    async function handleAuth() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      const storedToken = localStorage.getItem("access_token");
      const verifier = localStorage.getItem("verifier");

      if (storedToken) {
        // ✅ Check if stored token actually works by testing it
        try {
          const testProfile = await fetchProfile(storedToken);
          if (testProfile.error) throw new Error("Invalid token");
          console.log("Using stored token");
          setAccessToken(storedToken);
        } catch (e) {
          console.warn("Stored token invalid, clearing and restarting auth");
          localStorage.removeItem("access_token");
          localStorage.removeItem("verifier");
          const verifier = generateCodeVerifier();
          await redirectToAuthCodeFlow(verifier);
        }
      } else if (code && verifier) {
        try {
          console.log("Trying this part");
          const token = await getAccessToken(code, verifier);
          localStorage.setItem("access_token", token);
          setAccessToken(token);
          // 🧹 Clean up URL
          window.history.replaceState({}, document.title, "/");
        } catch (e) {
          console.error("Token exchange failed, restarting auth flow", e);
          localStorage.removeItem("access_token");
          localStorage.removeItem("verifier");
          const verifier = generateCodeVerifier();
          await redirectToAuthCodeFlow(verifier);
        }
      } else {
        // Start fresh auth flow
        console.log("Starting from fresh");
        const verifier = generateCodeVerifier();
        await redirectToAuthCodeFlow(verifier);
      }
    }

    handleAuth();
  }, []);

  useEffect(() => {
    if (!accessToken) return;

    async function loadData() {
      try {
        const profileData = await fetchProfile(accessToken);
        console.log("Profile:", profileData);
        setProfile(profileData);

        const playlistsData = await fetchPlaylists(accessToken);
        console.log("Playlists:", playlistsData);
        setPlaylists(playlistsData || []); // Ensure .items is used
      } catch (e) {
        console.error("Error fetching data:", e);
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
        <Playlist key={playlist.id} playlist={playlist} />
      ))}
    </div>
  );
}

export default App;
