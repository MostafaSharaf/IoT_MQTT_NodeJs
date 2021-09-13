const mqtt = require('mqtt')
const fs = require("fs");

const HOST_ADDRESS = "821d0036-fff3-4ad3-976b-7fc0cf239a24.eu10.cp.iot.sap"; // Replace with your IoT Service instance
const DEVICE_ALTERNATE_ID = "device1";
const SENSOR_ALTERNATE_ID = "sensor1";
const CAPABILITY_ALTERNATE_ID = "envData";
const CERTIFICATE_FILE = "./certificates/device1_certificate.pem";
const PASSPHRASE_FILE = "./certificates/device1_passphrase.txt";

var lastData = {
    temperature: 25,
    humidity: 70,
    light: 800
}

var mqttClient = connectToMQTT()

setInterval(() => {
    generateData()
    sendDataViaMQTT()
}, 1000);

function generateData() {
    lastData = {
        temperature: lastData.temperature + randomInteger(-1, 1),
        humidity: lastData.humidity + randomInteger(-10, 10),
        light: lastData.light + randomInteger(-100, 100)
    }
}

function sendDataViaMQTT() {
    var payload = {
        sensorAlternateId: SENSOR_ALTERNATE_ID,
        capabilityAlternateId: CAPABILITY_ALTERNATE_ID,
        measures: [
            lastData.temperature, lastData.humidity, lastData.light
        ]
    }

    var topicName = 'measures/' + DEVICE_ALTERNATE_ID;

    mqttClient.publish(topicName, JSON.stringify(payload), [], error => {
        if(!error) {
            console.log("Data successfully sent!");
        } else {
            console.log("An unecpected error occurred:", error);
        }
    });
}

function connectToMQTT() {
    var options = {
        keepalive: 10,
        clientId: DEVICE_ALTERNATE_ID,
        clean: true,
        reconnectPeriod: 2000,
        connectTimeout: 2000,
        cert: fs.readFileSync(CERTIFICATE_FILE),
        key: fs.readFileSync(CERTIFICATE_FILE),
        passphrase: fs.readFileSync(PASSPHRASE_FILE).toString(),
        rejectUnauthorized: false
    };

    var mqttClient = mqtt.connect(`mqtts://${HOST_ADDRESS}:8883`, options);

    mqttClient.subscribe('ack/' + DEVICE_ALTERNATE_ID);
    mqttClient.on('connect', () => console.log("Connection established!"));
    mqttClient.on("error", err => console.log("Unexpected error occurred:", err));
    mqttClient.on('reconnect', () => console.log("Reconnected!"));
    mqttClient.on('close', () => console.log("Disconnected!"));
    mqttClient.on('message', (topic, msg) => console.log("Received acknowledgement for message:", msg.toString()));

    return mqttClient
}

function randomInteger(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}