const JOKES = [
    ["Prism", "Why did the fish blush? Because it saw the ocean's bottom."],
    ["Vertex", "What do you call a lazy crab? A couch potato!"]
];

const STORIES = [
    ["Vertex", "I once saw a giant shadow above the water. It was terrifying."],
    ["Solon", "Gather round. I'll tell you about the Great Current."]
];

const FACTS = [
    ["Lumen", "Did you know that 95% of the ocean is unexplored?"],
    ["Prism", "A jellyfish is technically immortal."]
];

const AMBIENT = [
    ["Solon", "It's quiet today."],
    ["Ripple", "The water feels calm."],
    ["Vertex", "I wonder what's up there..."],
    ["Lumen", "Patience is a virtue."]
];

const COUNCIL = [
    ["Solon", "Vertex, stop bouncing."],
    ["Vertex", "But I'm bored!"],
    ["Ripple", "Let him play, Solon."]
];

const VISITOR = [
    ["Vertex", "Food! You brought food!"],
    ["Solon", "How generous."],
    ["Ripple", "Thank you."]
];

const GREETINGS = [
    ["Vertex", "Hello! You're back!"],
    ["Solon", "Took you long enough."],
    ["Lumen", "Welcome."]
];

const TAP_REACTIONS = [
    ["Vertex", "Whoa!"],
    ["Solon", "Watch the glass."],
    ["Prism", "Oh!"]
];

const BANK = {
    jokes: JOKES,
    stories: STORIES,
    facts: FACTS,
    ambient: AMBIENT,
    council: COUNCIL,
    visitor: VISITOR,
    greetings: GREETINGS,
    tap_reactions: TAP_REACTIONS
};

export function getBank(name) {
    return BANK[name] || [];
}