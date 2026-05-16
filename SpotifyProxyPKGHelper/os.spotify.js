
// Multi-source resolver for ANY Spotify track URL.

// Returns: { audioDataLink, albumImage, source }



async function GetTrackMultiSource(spotifyUrl) {



    // 1. Extract track ID

    const trackId = spotifyUrl.split("/track/")[1].split("?")[0];



    // 2. Get metadata from Spotify oEmbed

    const meta = await fetch(

        `https://open.spotify.com/oembed?url=${encodeURIComponent(spotifyUrl)}`

    ).then(r => r.json());



    const title = meta.title;        // "Song Name — Artist"

    const albumImageUrl = meta.thumbnail_url;



    // Helper: fetch → blob → dataURL

    async function toDataURL(url) {

        const res = await fetch(url);

        if (!res.ok) return null;

        const blob = await res.blob();

        if (blob.size < 5000) return null; // reject tiny invalid blobs

        return new Promise(resolve => {

            const reader = new FileReader();

            reader.onloadend = () => resolve(reader.result);

            reader.readAsDataURL(blob);

        });

    }



    // -----------------------------

    // TRY 1: Spotify Preview

    // -----------------------------

    const spotifyPreview = await toDataURL(

        `https://p.scdn.co/mp3-preview/${trackId}`

    );



    if (spotifyPreview) {

        return {

            audioDataLink: spotifyPreview,

            albumImage: await toDataURL(albumImageUrl),

            source: "spotify-preview"

        };

    }



    // -----------------------------

    // TRY 2: iTunes Preview

    // -----------------------------

    const [songName, artistName] = title.split(" — ");



    const itunes = await fetch(

        `https://itunes.apple.com/search?term=${encodeURIComponent(songName + " " + artistName)}&limit=1`

    ).then(r => r.json());



    if (itunes.results && itunes.results.length > 0) {

        const previewUrl = itunes.results[0].previewUrl;

        const itunesPreview = await toDataURL(previewUrl);



        if (itunesPreview) {

            return {

                audioDataLink: itunesPreview,

                albumImage: await toDataURL(albumImageUrl),

                source: "itunes-preview"

            };

        }

    }



    // -----------------------------

    // TRY 3: Deezer Preview

    // -----------------------------

    const deezer = await fetch(

        `https://api.deezer.com/search?q=${encodeURIComponent(songName + " " + artistName)}`

    ).then(r => r.json()).catch(() => null);



    if (deezer && deezer.data && deezer.data.length > 0) {

        const previewUrl = deezer.data[0].preview;

        const deezerPreview = await toDataURL(previewUrl);



        if (deezerPreview) {

            return {

                audioDataLink: deezerPreview,

                albumImage: await toDataURL(albumImageUrl),

                source: "deezer-preview"

            };

        }

    }



    // -----------------------------

    // NO AUDIO FOUND

    // -----------------------------

    return {

        audioDataLink: null,

        albumImage: await toDataURL(albumImageUrl),

        source: "none"

    };

}



window.GetTrackMultiSource = GetTrackMultiSource;
