const SOUND_GPIO_PIN = 4;
const MOTOR_GPIO_PIN = 1;
const LED_GPIO_PIN = 17;

const OUT_LED_GPIO_PIN = 27;

const GPIO_INPUT_DIRECTION = 'in'
const GPIO_EDGE_BOTH = 'both'
const GPIO_EDGE_RISING = 'rising'
const GPIO_OPTS = { activeLow: true };

const PoweredUP = require("node-poweredup");
var Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO

const motorBtn = newInputButton(MOTOR_GPIO_PIN, GPIO_EDGE_BOTH, GPIO_OPTS);
// const soundBtn = newInputButton(SOUND_GPIO_PIN, GPIO_EDGE_RISING, {debounceTimeout: 10});
const soundBtn = newInputButton(SOUND_GPIO_PIN, GPIO_EDGE_BOTH, {activeLow: true, debounceTimeout: 10});
const ledBtn = newInputButton(LED_GPIO_PIN, GPIO_EDGE_BOTH, GPIO_OPTS);
const poweredUP = new PoweredUP.PoweredUP();


const outLed = new Gpio(OUT_LED_GPIO_PIN, 'out');

poweredUP.scan(); // Start scanning for hubs

console.log("Szukam urządzeń lego...");

poweredUP.on("discover", async (hub) => { // Wait to discover hubs

    await hub.connect(); // Connect to hub
    const devices = hub.getDevices();
    console.log(`Podłączony do ${hub.name}!`);

    outLed.watch((err, val) => {
        if (err) {
            console.log(err);
            throw err;
        }

        outLed.writeSync(outLed.readSync() ^ 1);
    })

    const motorDevice = await hub.waitForDeviceByType(PoweredUP.Consts.DeviceType.DUPLO_TRAIN_BASE_MOTOR);
    const ledDevice = await hub.waitForDeviceByType(PoweredUP.Consts.DeviceType.HUB_LED);
    const soundDevice = await hub.waitForDeviceByType(PoweredUP.Consts.DeviceType.DUPLO_TRAIN_BASE_SPEAKER);

    soundBtn.watch(newSoundBtnHandler(soundDevice));
    motorBtn.watch(newMotorBtnHandler(motorDevice));
    ledBtn.watch(newLedBtnHandler(ledDevice));
});
process.on('SIGINT', _ => {
    outLed.unexport();
    ledBtn.unexport();
    motorBtn.unexport();
    soundBtn.unexport();
    console.log("zwalniam zasoby")
});

function newInputButton(pin, edge, opts) {
    return new Gpio(pin, GPIO_INPUT_DIRECTION, edge, opts)
}

function newMotorBtnHandler(motorDevice) {
    return function (err, value) {
        if (err) {
            console.error('There was an error', err); //output error message to console
            return;
        }
        if (!value) {
            console.log("Zatrzymuje sie")
            motorDevice.setPower(0);
            return;
        }
        console.log("Jade")
        motorDevice.setPower(50);
    }
}

function newSoundBtnHandler(soundDevice) {
    return function (err, value) {
        if (err) {
            console.error('There was an error', err);
            return;
        }
        if (!value) {
            console.log("Off");
            return;
        }
        console.log("Trąbie");
        soundDevice.playSound(PoweredUP.Consts.DuploTrainBaseSound.HORN);

        console.log("Świecę");
        outLed.writeSync(outLed.readSync() ^ 1);
    }
}

function newLedBtnHandler(ledDevice) {
    return function (err, value) {
        if (err) {
            console.error('There was an error', err);
            return;
        }
        if (!value) {
            console.log("Gasze swiatlo")
            ledDevice.setColor(PoweredUP.Consts.Color.BLUE);
            return;
        }
        console.log("Zapalam swiatlo")
        ledDevice.setColor(PoweredUP.Consts.Color.PINK);
    }
}