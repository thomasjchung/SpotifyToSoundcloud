const clientId = "13fb95c5b7194b7692e6b35a73dd50a2";
const redirectUri = "http://127.0.0.1:3000/callback";

export function generateCodeVerifier(): string {
  const array = new Uint32Array(64);
  crypto.getRandomValues(array);
  const verifier = Array.from(array, (dec) => ("0" + dec.toString(16)).slice(-2)).join("");
  localStorage.setItem("verifier", verifier); // store for later token exchange
  return verifier;
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return await crypto.subtle.digest("SHA-256", data);
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function redirectToAuthCodeFlow(verifier: string) {
  const hashed = await sha256(verifier);
  const challenge = base64UrlEncode(hashed);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: "user-read-private user-read-email playlist-read-private",
    redirect_uri: redirectUri,
    code_challenge_method: "S256",
    code_challenge: challenge,
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}


export async function fetchProfile(accessToken: string) {
    const result = await fetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    return await result.json();
}

export async function fetchPlaylists(accessToken: string) {
    const result = await fetch("https://api.spotify.com/v1/me/playlists", {
        headers: { Authorization: `Bearer ${accessToken}` }
    });
    const json = await result.json();
    return json.items;
}

// export async function getSongs(accessToken: string, playlistId: string){
//     const result = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`,{
//         headers: {Authorization: `Bearer ${accessToken}`}
//     });
//     const json = await result.json();
//     console.log(json.items);
//     return;
// }


export async function getAccessToken(code: string, verifier: string) {
  const params = new URLSearchParams();
  params.append("client_id", clientId);
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", redirectUri);
  params.append("code_verifier", verifier);

  const result = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  if (!result.ok) {
    const errorText = await result.text(); // <-- Add this to debug exact error!
    console.error("Error response from token endpoint:", errorText);
    throw new Error("Failed to fetch access token");
  }

  const data = await result.json();
  return data.access_token;
}

export async function soundCloudConvert(
  accessToken: string,
  playlistId: string,
  playlistName: string,
  scAccessToken: string
) {
  if (!scAccessToken) {
    console.error("scAccessToken is undefined / empty!");
    alert("You are not logged into SoundCloud");
    return;
  }

  const result = await fetch(
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  const spotifyJson = await result.json();
  const items = spotifyJson.items;

  if (!items || items.length === 0) {
    alert("No tracks found in Spotify playlist");
    return;
  }

  const scTrackIds: number[] = [];

  for (const item of items) {
    const name = item.track?.name ?? "";
    const artistNames = Array.isArray(item.track?.artists)
      ? item.track.artists.slice(0, 3).map((a: any) => a.name)
      : [];

    const query = `${name} ${artistNames.join(" ")}`.trim();
    console.log(`🔍 Searching SoundCloud for: "${query}"`);

    const searchParams = new URLSearchParams({
      q: query,
      limit: "5",
    });

    const searchRes = await fetch(
      `https://api.soundcloud.com/tracks?${searchParams.toString()}`,
      {
        headers: { Authorization: `OAuth ${scAccessToken}` },
      }
    );

    let searchResults;
    try {
      searchResults = await searchRes.json();
    } catch (err) {
      console.warn(`⚠️ Failed to parse JSON for "${query}":`, err);
      continue;
    }

    if (!Array.isArray(searchResults)) {
      console.warn(`⚠️ Unexpected response for "${query}"`);
      continue;
    }

    const normalizedSpotifyArtists = artistNames.map((n: string) =>
    n.toLowerCase().replace(/[^a-z0-9]/gi, "")
    );

    const match = searchResults.find((track: any) => {
    const scArtist = (track.user?.username || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/gi, "");
    return normalizedSpotifyArtists.some((spotifyName: string) =>
        scArtist.includes(spotifyName)
    );
    });

    if (match) {
      scTrackIds.push(match.id);
      console.log(`✅ Matched: "${match.title}" by "${match.user.username}"`);
    } else {
      console.log(`❌ No official match found for "${query}"`);
    }
  }

  if (scTrackIds.length === 0) {
    alert("No matching SoundCloud tracks found.");
    return;
  }

  const playlistPayload = {
    playlist: {
      title: playlistName,
      sharing: "public",
      tracks: scTrackIds.map((id) => ({ id })),
    },
  };

  const createRes = await fetch("https://api.soundcloud.com/playlists", {
    method: "POST",
    headers: {
      Authorization: `OAuth ${scAccessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(playlistPayload),
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();
    console.error("Failed to create SoundCloud playlist:", errorText);
    alert("Error creating SoundCloud playlist.");
    return;
  }

  console.log("🎉 Created SoundCloud Playlist:", playlistName);
  alert(
    `SoundCloud playlist "${playlistName}" created with ${scTrackIds.length} track(s)!`
  );
}
