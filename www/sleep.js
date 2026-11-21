class SleepEngine {

    constructor() {

        this.state =
            "AWAKE";

        this.idleSeconds = 0;
    }

    registerActivity() {

        this.idleSeconds = 0;

        if(
            this.state !==
            "AWAKE"
        ){
            this.state =
                "AWAKE";
        }
    }

    update(dt) {

        this.idleSeconds += dt;

        if(
            this.idleSeconds >
            180
        ){
            this.state =
                "SLEEPING";
        }
    }
}

export const sleep =
    new SleepEngine();
