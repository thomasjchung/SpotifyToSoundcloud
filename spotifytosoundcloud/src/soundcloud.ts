const clientId = "tqVSanrix47tssDPrp99xwUyGkN5aei6"
const clientSecret = "tddA2sn3ZYss6S49KwwH7xePTCVWgm85"
const redirectUri = "http://127.0.0.1:3000/callback"

export function redirectToSoundCloudAuth(state = "soundcloud") {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "non-expiring",
    display: "popup",
    state,
  });

  window.location.href = `https://soundcloud.com/connect?${params.toString()}`;
}


export async function getSoundCloudAccessToken(code: string){
    const params = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        code: code
    });

    const response = await fetch("https://api.soundcloud.com/oauth2/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params
    });

    if (!response.ok){
        const error = await response.text();
        throw new Error("SoundCloud token error: " + error);
    }

    const data = await response.json();
    return data.access_token;
}