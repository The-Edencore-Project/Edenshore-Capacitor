class AudioManager {

    constructor() {

        this.music = null;

        this.volume = 0.30;

        this.playlist = [
            "assets/audio/music/ambient_beats_normal.mp3",
            "assets/audio/music/jonasblakewood_pop_normal.mp3",
            "assets/audio/music/friends_like_us.mp3",
            "assets/audio/music/upbeat_pop_upbeat.mp3",
            "assets/audio/music/latin_jazz_relaxing.mp3",
            "assets/audio/music/wind_chimes_relaxing.mp3"
        ];

        this.index = 0;

        document.addEventListener(
            "click",
            () => this.start(),
            { once:true }
        );
    }

    start() {

        if (this.music) return;

        this.playTrack(
            this.playlist[this.index]
        );
    }

    playTrack(path) {

        this.music = new Audio(path);

        this.music.volume = this.volume;

        this.music.addEventListener(
            "ended",
            () => {

                this.index++;

                if (
                    this.index >=
                    this.playlist.length
                ) {
                    this.index = 0;
                }

                this.playTrack(
                    this.playlist[this.index]
                );
            }
        );

        this.music.play().catch(() => {});
    }

    sting(name) {

        const sting =
            new Audio(
                `assets/audio/stings/${name}_sting.mp3`
            );

        sting.volume = 0.55;

        sting.play().catch(() => {});
    }
}

export const audio =
    new AudioManager();
