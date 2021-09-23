//Add 4xL192.168.1.162ED on 5V rail button. 2 GPIO need to switch on/off light with MOSFET.


const SOUND_GPIO_PIN = 1;
const MOTOR_GPIO_PIN = 4;
const LED_GPIO_PIN = 17;
const BUTTON_GPIO_PIN_HORN = 27;
const BUTTON_GPIO_PIN_LIGHT = 22;
const BUTTON_GPIO_PIN_WATER = 10;
const BUTTON_GPIO_PIN_RED = 9;
const BUTTON_GPIO_PIN_HORN_LED = 11;
const BUTTON_GPIO_PIN_LIGHT_LED = 5;
const BUTTON_GPIO_PIN_WATER_LED = 6;
const BUTTON_GPIO_PIN_RED_LED = 13;

//Na 99% piny gpio bede musial dopasowac, prawdopodobnie maja na wyjsciach nie tylko 3V a to przy MOSFECIE moze miec znaczenie. 2 GPio na jeden button bo LED jest na 5V ;/ i musze jakos to mu przekazywac zeby robil on off na lini 5v.
//chociaż dzis mi sie sniło ze tam mam przy guziku 2 rozne wyjscia i moze byc tak ze to sie ogarnie bez skryptu ^^
const GPIO_INPUT_DIRECTION = 'in'
const GPIO_EDGE_BOTH = 'both'
const GPIO_EDGE_RISING = 'rising'
const GPIO_OPTS = { activeLow: true }

const PoweredUP = require("node-poweredup");
var Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO

const motorBtn = newInputButton(MOTOR_GPIO_PIN, GPIO_EDGE_BOTH, GPIO_OPTS);
const soundBtn = newInputButton(SOUND_GPIO_PIN, GPIO_EDGE_BOTH, GPIO_OPTS);
const ledBtn = newInputButton(LED_GPIO_PIN, GPIO_EDGE_BOTH, GPIO_OPTS);

const poweredUP = new PoweredUP.PoweredUP();
poweredUP.scan(); // Start scanning for hubs

console.log("Szukam urządzeń lego...");

poweredUP.on("discover", async (hub) => { // Wait to discover hubs

    await hub.connect(); // Connect to hub
    const devices = hub.getDevices();
    console.log(`Podłączony do ${hub.name}!`);

    const motorDevice = await hub.waitForDeviceByType(PoweredUP.Consts.DeviceType.DUPLO_TRAIN_BASE_MOTOR);
    const ledDevice = await hub.waitForDeviceByType(PoweredUP.Consts.DeviceType.HUB_LED);
    const soundDevice = await hub.waitForDeviceByType(PoweredUP.Consts.DeviceType.DUPLO_TRAIN_BASE_SPEAKER);

    soundBtn.watch(newSoundBtnHandler(soundDevice));
    motorBtn.watch(newMotorBtnHandler(motorDevice));
    ledBtn.watch(newLedBtnHandler(ledDevice));
});
process.on('SIGINT', _ => {
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
        motor.setPower(50);
    }
}

function newSoundBtnHandler(soundDevice) {
    return function (err, value) {
        if (err) {
            console.error('There was an error', err);
            return;
        }
        if (!value) {
            return;
        }
        console.log("Trąbie")
        soundDevice.playSound(PoweredUP.Consts.DuploTrainBaseSound.HORN);
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