// os.spotify.js
// "OS" proxy for Spotify metadata & artwork (JSON edition, CORS-safe).
// NOTE: This does NOT bypass paywalls or give full audio.
// It uses only public, allowed endpoints.

(function(global){
    const SpotifyOS = {};

    // Helper: fetch → blob → dataURL
    async function toDataURL(url){
        const blob = await fetch(url).then(r => r.blob());
        return new Promise(resolve => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
    }

    // Main: given a Spotify URL, return JSON with metadata + image data URL
    SpotifyOS.fetchTrackJSON = async function(spotifyUrl){
        const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(spotifyUrl)}`;

        const meta = await fetch(oembedUrl).then(r => {
            if (!r.ok) throw new Error("Spotify oEmbed failed");
            return r.json();
        });

        const imageUrl = meta.thumbnail_url;

        const imageDataUrl = await toDataURL(imageUrl);

        return {
            type: "spotify-track",
            url: spotifyUrl,
            title: meta.title,
            author: meta.author_name,
            provider: meta.provider_name,
            thumbnail_url: imageUrl,
            thumbnail_data_url: imageDataUrl,
            html: meta.html // Spotify’s official embed HTML
        };
    };

    global.SpotifyOS = SpotifyOS;
})(window);
