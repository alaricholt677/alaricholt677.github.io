async function GetSpotifyOpenTrack(url) {

    const trackId = url.split("/track/")[1].split("?")[0];

    const previewUrl = `https://p.scdn.co/mp3-preview/${trackId}`;

    const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
    const meta = await fetch(oembedUrl).then(r => r.json());
    const albumImageUrl = meta.thumbnail_url;

    async function toDataURL(resourceUrl) {
        const res = await fetch(resourceUrl);

        // If Spotify returns 403 or empty file → no preview exists
        if (!res.ok || res.headers.get("content-type") === "application/octet-stream") {
            return null;
        }

        const blob = await res.blob();
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
    }

    const audioDataLink = await toDataURL(previewUrl);
    const albumImage = await toDataURL(albumImageUrl);

    return {
        audioDataLink,
        albumImage
    };
}

window.GetSpotifyOpenTrack = GetSpotifyOpenTrack;
