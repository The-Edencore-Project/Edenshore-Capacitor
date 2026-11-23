// =====================================================================
// EDENCORE - audio.js (Mood-Driven Audio Engine)
// =====================================================================

class AudioManager {
    constructor() {
        this.music = null;
        this.volume = 0.30;
        this.currentMood = "NORMAL"; // Default
        this.currentTrackIndex = 0;

        // We map the brain moods to the files based on your naming convention
        this.moodPlaylists = {
            "NORMAL": [
                "assets/audio/music/ambient_beats_normal.mp3",
                "assets/audio/music/jonasblakewood_pop_normal.mp3",
                "assets/audio/music/friends_like_us.mp3"
            ],
            "PLAYFUL": [
                "assets/audio/music/atlasaudio_pop_upbeat.mp3",
                "assets/audio/music/club_beats_upbeat.mp3",
                "assets/audio/music/nastelbom_house_upbeat.mp3",
                "assets/audio/music/upbeat_pop_upbeat.mp3"
            ],
            "SLEEPY": [
                "assets/audio/music/american_flute_relaxing.mp3",
                "assets/audio/music/hare_krishna_relaxing.mp3",
                "assets/audio/music/latin_jazz_relaxing.mp3",
                "assets/audio/music/wind_chimes_relaxing.mp3",
                "assets/audio/music/zen_music_relaxing.mp3"
            ]
        };

        // Android requires a user interaction (tap) to start audio
        document.addEventListener("click", () => this.start(), { once: true });
    }

    start() {
        if (this.music) return;
        this.playTrack();
    }

    // Called by brain.js when the mood changes
    setMood(newMood) {
        if (this.currentMood === newMood) return;
        
        this.currentMood = newMood;
        this.currentTrackIndex = 0; // Reset to first track of the new mood
        
        console.log("Audio switching to mood:", newMood);
        this.playTrack();
    }

    playTrack() {
        // Stop current music
        if (this.music) {
            this.music.pause();
            this.music = null;
        }

        // Get the playlist for the current mood
        const playlist = this.moodPlaylists[this.currentMood];
        if (!playlist || playlist.length === 0) return;

        // Ensure index doesn't go out of bounds
        if (this.currentTrackIndex >= playlist.length) {
            this.currentTrackIndex = 0;
        }

        const path = playlist[this.currentTrackIndex];
        this.music = new Audio(path);
        this.music.volume = this.volume;

        // When the track ends, go to the next one in the same mood
        this.music.addEventListener("ended", () => {
            this.currentTrackIndex++;
            if (this.currentTrackIndex >= playlist.length) {
                this.currentTrackIndex = 0;
            }
            this.playTrack();
        });

        this.music.play().catch(() => {});
    }

    sting(name) {
        const sting = new Audio(`assets/audio/stings/${name}_sting.mp3`);
        sting.volume = 0.55;
        sting.play().catch(() => {});
    }
}

// Attach to window so other files (like brain.js or app.js) can access it
window.audio = new AudioManager();