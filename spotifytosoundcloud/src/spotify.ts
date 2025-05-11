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
