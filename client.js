const net = require("net");

let client = net.createConnection({port: 3000}, () => {
    console.log("Welcome!");
    console.log("Commands: quit");
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