class Arbiter {
    constructor() { this.net = new SeatNet(); }
    getMood(brain) {
        let hour = new Date().getHours();
        let inputs = [
            hour / 24.0, 1.0, 0.0, 0.1,
            Math.min((brain.heat || 0) / 3.0, 1.0),
            Math.min((brain.save && brain.save.bond_score || 0) / 1000.0, 1.0),
            0.0, 0.5, 0.0, 0.0, 0.2, 0.0
        ];
        let probs = this.net.forward(inputs);
        return ["CRISIS", "SLEEPY", "PLAYFUL", "NORMAL"][probs.indexOf(Math.max(...probs))];
    }
}

class SeatNet {
    constructor() {
        this.w1 = Array(12).fill(0).map(() => Array(8).fill(0));
        this.w2 = Array(8).fill(0).map(() => Array(4).fill(0));
        this.b1 = Array(8).fill(0.1);
        this.b2 = Array(4).fill(0.0);
        this.b2[3] = 2.0;
        this.w1[0][0] = 2.0; this.w1[0][1] = 3.0;
        this.w1[1][0] = -5.0; this.w1[1][1] = 2.0;
        this.w1[2][2] = 4.0; this.w1[5][2] = 3.0;
        this.w1[6][2] = 2.0; this.w1[4][0] = 1.5;
        this.w2[0][0] = 5.0; this.w2[0][1] = 3.0;
        this.w2[1][1] = 5.0; this.w2[2][2] = 5.0; this.w2[3][3] = 5.0;
    }
    sigmoid(x) { return 1.0 / (1.0 + Math.exp(-x)); }
    forward(inputs) {
        let hidden = Array(8).fill(0);
        for (let h = 0; h < 8; h++) {
            let act = this.b1[h];
            for (let i = 0; i < 12; i++) act += inputs[i] * this.w1[i][h];
            hidden[h] = this.sigmoid(act);
        }
        let outputs = Array(4).fill(0);
        for (let o = 0; o < 4; o++) {
            let act = this.b2[o];
            for (let h = 0; h < 8; h++) act += hidden[h] * this.w2[h][o];
            outputs[o] = this.sigmoid(act);
        }
        return outputs;
    }
}

window.arbiter = new Arbiter();