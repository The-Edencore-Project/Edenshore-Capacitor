export const CREATURE_DIALOGUE = {

    solon: [
        "Hm.",
        "You're back.",
        "Try not to make a fuss.",
        "It's peaceful today."
    ],

    vertex: [
        "Hello!",
        "You came back!",
        "Want to explore?",
        "I was waiting!"
    ],

    ripple: [
        "It's lovely to see you.",
        "Welcome back.",
        "The water feels calm."
    ],

    prism: [
        "Oh...",
        "Hello there.",
        "Everything seems alright."
    ],

    lumen: [
        "The water is calm today.",
        "Stillness can be comforting.",
        "The current remembers."
    ]
};

export function getDialogue(creature) {

    const lines = CREATURE_DIALOGUE[creature];

    if (!lines) {
        return "...";
    }

    return lines[
        Math.floor(Math.random() * lines.length)
    ];
}
