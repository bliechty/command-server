const net = require("net");

let client = net.createConnection({port: 3000}, () => {
    console.log(`
        Commands:
        Quit: /quit,
        List of clients: /clientlist,
        Message all other clients: /messageall (ex: /messageall Hello),
        Whisper to client: /w (ex: /w Client5 Hello),
        Change username: /username (ex: /username betty),
        Kick client: /kick (ex: /kick Client3 [admin password]),
        Commands list: /commandslist,
        See current name: /name`);
});

client.on("data", data => {
    console.log(data.toString());
});

client.on("end", () => {
    console.log("You were quit off");
    process.exit();
});

client.on("error", (err) => {
    console.log(`Error occurred: ${err}`)
});

process.stdin.pipe(client);