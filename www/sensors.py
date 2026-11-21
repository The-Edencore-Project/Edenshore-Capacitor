export class SensorArray {
    constructor() {
        this.light_level = 0.5;
        this.motion_mag = 0.0;
        this.orientation_tilt = 0.0;
        this.audio_amplitude = 0.1; 
        this.battery_level = 1.0;
        this.is_charging = 0.0;
        this.thermal_baseline = 0.5;
        this.shakiness = 0.0;

        this.session_start_time = Date.now();
        this.last_tap_time = Date.now();
        this.last_tap_interval = 1.0;
        this.tap_count_10s = 0;
        this.swipe_count_10s = 0;
        this.biome_switch_count = 0;
        this.feed_count = 0;
        this.riddle_wins = 0;
        this.riddle_losses = 0;

        this.walking_factor = 0.0;
        this.prev_mag = 9.8;

        this.initHardware();
    }

    initHardware() {
        // In the future, we will add @capacitor/motion here.
        // For now, we use the web devicemotion API as a fallback.
        if (window.DeviceMotionEvent) {
            window.addEventListener('devicemotion', (event) => {
                let acc = event.accelerationIncludingGravity;
                if (acc) {
                    let mag = Math.sqrt(acc.x**2 + acc.y**2 + acc.z**2);
                    let movement = Math.abs(mag - 9.8);
                    if (movement < 1.5) movement = 0.0; // Deadzone fix
                    
                    let variance = Math.abs(movement - this.prev_mag);
                    if (variance < 1.5) variance = 0.0;

                    this.shakiness = this._norm(variance, 0.0, 5.0);
                    this.prev_mag = movement;
                    this.motion_mag = this._norm(movement, 0.0, 15.0);
                    this.orientation_tilt = this._norm(Math.abs(acc.z), 0.0, 9.8);

                    if (movement > 1.0 && movement < 5.0) {
                        this.walking_factor = Math.min(1.0, this.walking_factor + 0.05);
                    } else {
                        this.walking_factor = Math.max(0.0, this.walking_factor - 0.02);
                    }
                }
            });
        }
    }

    _norm(val, min, max) {
        if (val <= min) return 0.0;
        if (val >= max) return 1.0;
        return (val - min) / (max - min);
    }

    registerTap() {
        let now = Date.now();
        let interval = (now - this.last_tap_time) / 1000.0;
        this.last_tap_interval = interval;
        this.last_tap_time = now;
        this.tap_count_10s += 1;
    }

    decayCounters(dt) {
        let idle_time = (Date.now() - this.last_tap_time) / 1000.0;
        if (idle_time > 10.0) {
            this.tap_count_10s = Math.max(0, this.tap_count_10s - Math.floor(dt * 2));
            this.swipe_count_10s = Math.max(0, this.swipe_count_10s - Math.floor(dt * 2));
        }
        if (idle_time > 3.0) this.last_tap_interval = 1.0;
    }

    get32Params(brainState) {
        let now = new Date();
        let v1 = [
            this.light_level, this.motion_mag, this.orientation_tilt, this.audio_amplitude,
            this.battery_level, this.is_charging, this.thermal_baseline, this.shakiness
        ];

        let absenceSec = (Date.now() - (brainState.last_visit_time || Date.now())) / 1000.0;
        let sessionSec = (Date.now() - this.session_start_time) / 1000.0;
        let feedSec = (Date.now() - (brainState.last_feed_time || Date.now())) / 1000.0;
        let riddleSec = (Date.now() - (brainState.last_riddle_time || Date.now())) / 1000.0;

        let v2 = [
            this._norm(now.getHours(), 0, 23), this._norm(now.getDay(), 0, 6),
            now.getDay() === 0 || now.getDay() === 6 ? 1.0 : 0.0,
            this._norm(absenceSec, 0, 86400), this._norm(sessionSec, 0, 3600),
            this._norm(feedSec, 0, 3600), this._norm(riddleSec, 0, 1800),
            this._norm(now.getMonth() + 1, 1, 12)
        ];

        let idleSec = (Date.now() - this.last_tap_time) / 1000.0;
        let rhythmScore = this.tap_count_10s > 0 ? 1.0 - this._norm(this.last_tap_interval, 0.1, 2.0) : 0.0;

        let v3 = [
            this._norm(this.tap_count_10s, 0, 20), this._norm(this.swipe_count_10s, 0, 10),
            this._norm(idleSec, 0, 300), this._norm(brainState.bond_score || 0, 0, 1000),
            this._norm(brainState.heat || 0, 0, 10), rhythmScore, this.walking_factor,
            this._norm(this.riddle_wins, 0, Math.max(1, this.riddle_wins + this.riddle_losses))
        ];

        let moodMap = { "NORMAL": 0.25, "SLEEPY": 0.5, "PLAYFUL": 0.75, "CRISIS": 1.0 };
        let biomeMap = { "LAGOON": 0.0, "SHORE": 0.3, "TWILIGHT": 0.6, "DEEP": 1.0 };

        let v4 = [
            moodMap[brainState.current_mood] || 0.25, this._norm(brainState.cinematic_cooldown || 0, 0, 3600),
            biomeMap[brainState.current_biome] || 0.0, this._norm(brainState.weather_intensity || 0, 0, 10),
            this._norm(brainState.bag_exhaustion || 0, 0, 100), brainState.active_focus || 0.0,
            brainState.choreo_state || 0.0, this._norm(brainState.dialogue_queue_len || 0, 0, 10)
        ];

        return v1.concat(v2, v3, v4);
    }
}