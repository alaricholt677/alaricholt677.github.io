// GetSpotifyOpenTrack.js
// Returns JSON: { audioDataLink: "...", albumImage: "..." }

async function GetSpotifyOpenTrack(url) {

    // Extract track ID from ANY open.spotify.com/track/... URL
    const trackId = url.split("/track/")[1].split("?")[0];

    // Spotify preview MP3 (public)
    const previewUrl = `https://p.scdn.co/mp3-preview/${trackId}`;

    // Spotify oEmbed for metadata + album art (public)
    const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
    const meta = await fetch(oembedUrl).then(r => r.json());
    const albumImageUrl = meta.thumbnail_url;

    // Helper: fetch → blob → dataURL
    async function toDataURL(resourceUrl) {
        const blob = await fetch(resourceUrl).then(r => r.blob());
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
    }

    // Convert both to data URLs
    const audioDataLink = await toDataURL(previewUrl);
    const albumImage = await toDataURL(albumImageUrl);

    // Final JSON object
    return {
        audioDataLink,
        albumImage
    };
}

// Export globally
window.GetSpotifyOpenTrack = GetSpotifyOpenTrack;
