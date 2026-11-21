const DEFAULT_SAVE = {
    bond: 0,
    title: "Stranger",
    visits: 0,
    feedCount: 0,
    lastCreature: ""
};

export function loadSave() {
    const saved = localStorage.getItem("edenshore_save");

    if (!saved) {
        localStorage.setItem(
            "edenshore_save",
            JSON.stringify(DEFAULT_SAVE)
        );

        return { ...DEFAULT_SAVE };
    }

    return JSON.parse(saved);
}

export function saveData(data) {
    localStorage.setItem(
        "edenshore_save",
        JSON.stringify(data)
    );
}
