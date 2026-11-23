import { AMBIENT } from './ambient.js';
import { BEDTIME_RESISTANCE, WAKING_NUDGE, WAKING_OTHERS } from './bedtime.js';
import { COUNCIL } from './council.js';
import { MORNING, EVENING, LATE_NIGHT, ABSENCE, STRESS, BUSY, WEATHER } from './daily.js';
import { DREAMS_NIGHTMARE, DREAMS_PEACEFUL, DREAMS_PLAYFUL, DREAMS_ABSENCE } from './dreams.js';
import { FACTS } from './facts.js';
import { HUDDLE } from './huddle.js';
import { JOKES } from './jokes.js';
import { LYRICS } from './lyrics.js';
import { POETRY } from './poetry.js';
import { TAP_REACTIONS, FEED_REACTIONS, TAP_GRUNTS, FEED_GRUNTS, INTERJECTIONS } from './reactions.js';
import { REQUESTS } from './requests.js';
import { RIDDLES } from './riddles.js';
import { STORIES } from './stories.js';
import { VISITOR, GREETINGS, PEERING_EYES } from './visitor.js';
import { WISDOM } from './wisdom.js';
import { BIOME_REACTIONS } from './biome.js';

export const DIALOGUE = {
    ambient: AMBIENT,
    council: COUNCIL,
    facts: FACTS,
    huddle: HUDDLE,
    jokes: JOKES,
    lyrics: LYRICS,
    poetry: POETRY,
    requests: REQUESTS,
    riddles: RIDDLES,
    stories: STORIES,
    wisdom: WISDOM,
    visitor: VISITOR,
    greetings: GREETINGS,
    peering_eyes: PEERING_EYES,
    tap_reactions: TAP_REACTIONS,
    feed_reactions: FEED_REACTIONS,
    tap_grunts: TAP_GRUNTS,
    feed_grunts: FEED_GRUNTS,
    interjections: INTERJECTIONS,
    daily_morning: MORNING,
    daily_evening: EVENING,
    daily_night: LATE_NIGHT,
    daily_absence: ABSENCE,
    daily_stress: STRESS,
    daily_busy: BUSY,
    daily_weather: WEATHER,
    dream_nightmare: DREAMS_NIGHTMARE,
    dream_peaceful: DREAMS_PEACEFUL,
    dream_playful: DREAMS_PLAYFUL,
    dream_absence: DREAMS_ABSENCE,
    bedtime_resistance: BEDTIME_RESISTANCE,
    waking_nudge: WAKING_NUDGE,
    waking_others: WAKING_OTHERS,
    biome_LAGOON: BIOME_REACTIONS["LAGOON"],
    biome_SHORE: BIOME_REACTIONS["SHORE"],
    biome_TWILIGHT: BIOME_REACTIONS["TWILIGHT"],
    biome_DEEP: BIOME_REACTIONS["DEEP"]
};