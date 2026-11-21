import { saveData } from "./save.js";

export function getBondTitle(bond) {

    if (bond >= 1000) return "Family";
    if (bond >= 500) return "Confidant";
    if (bond >= 200) return "Trusted";
    if (bond >= 100) return "Companion";
    if (bond >= 50) return "Friend";
    if (bond >= 20) return "Acquaintance";

    return "Stranger";
}

export function addBond(save, amount) {

    save.bond += amount;

    save.title = getBondTitle(save.bond);

    saveData(save);

    return save;
}
