const uuid = require("uuid");
const fs = require("fs");
const net = require("net");
const adminPassword = "1234adminpass";
let users = [];
let numberOfTotalUsers = 0;
let server = net.createServer(client => {
    client.setEncoding("utf-8");
    client.id = uuid.v4();
    client.name = `Client${numberOfTotalUsers + 1}`;
    users.push(client);
    numberOfTotalUsers++;
    client.write(`
        Hello ${client.name}!
    `);
    writeMessageToAllOtherUsers(`${client.name} (${client.id}) connected`, client);
    writeToChatLog(`${client.name} (${client.id}) connected\n`);
    console.log(`${client.name} (${client.id}) connected`);

    client.on("data", data => {
        if (data === "/quit\n") {
            client.end();
        } else if (data === "/clientlist\n") {
            printClientListNames(client);
        } else if (/^\/w/.test(data)) {
            const whisperCommand = data.split(" ");
            const name = whisperCommand[1];
            const message = whisperCommand.slice(2, whisperCommand.length).join(" ").trim();
            if (whisperCommand.length >= 3) {
                let recipient;
                for (let user of users) {
                    if (user.name === name) {
                        recipient = user;
                    }
                }
                if(recipient === undefined) {
                    client.write(`${name} is not online or name is not spelled correctly\ntry again\n`)
                } else if (recipient.name === client.name) {
                    client.write("You cannot use the /w command on yourself\n");
                } else {
                    writeToChatLog(`${client.name} (${client.id}) said [${message}] to: ${recipient.name} (${recipient.id})\n`);
                    recipient.write(`***\nWhisper from ${client.name} (${client.id}): ${message}\n***\n`);
                    client.write(`Message sent to ${recipient.name}\n`);
                }
            } else if (whisperCommand.length < 3) {
                client.write("Missing argument(s) in command\n");
            }
        } else if (/^\/username/.test(data)) {
            const usernameCommand = data.split(" ");
            const name = usernameCommand[1].trim();
            if (usernameCommand.length === 2) {
                if (name === client.name) {
                    client.write(`Your name is already ${client.name}`);
                } else {
                    writeToChatLog(`${client.name} successfully changed their name to ${name}\n`);
                    writeMessageToAllOtherUsers(`${client.name} successfully changed their name to ${name}`, client);
                    client.write(`You successfully changed your name to ${name}`);
                    console.log(`${client.name} successfully changed their name to ${name}`);
                    client.name = name;
                }
            } else if (usernameCommand.length < 2) {
                client.write("Not enough arguments for this command");
            } else if (usernameCommand.length > 2) {
                client.write("Too many arguments for this command");
            }
        } else if (/^\/kick/.test(data)) {
            const kickCommand = data.split(" ");
            const name = kickCommand[1];
            const password = kickCommand[2].trim();
            if (kickCommand.length === 3) {
                if (password === adminPassword) {
                    let recipient;
                    for (let user of users) {
                        if (user.name === name) {
                            recipient = user;
                        }
                    }
                    if (recipient === undefined) {
                        client.write(`${name} is not online or name is not spelled correctly\ntry again`)
                    } else {
                        writeToChatLog(`${client.name} kicked ${recipient.name}\n`);
                        writeMessageToAllOtherUsers(`${client.name} kicked ${recipient.name}`, client);
                        client.write(`You successfully kicked ${name}`);
                        console.log(`${client.name} kicked ${recipient.name}\n`);
                        recipient.end();
                    }
                } else {
                    client.write("That is not the admin password");
                }
            } else if (kickCommand.length < 3) {
                client.write("Not enough arguments for this command");
            } else if (kickCommand.length > 3) {
                client.write("Too many arguments for this command");
            }
        } else if (/^\/messageall/.test(data)) {
            const messageAllCommand = data.split(" ");
            const message = messageAllCommand.slice(1, messageAllCommand.length).join(" ").trim();
            if (messageAllCommand.length >= 2) {
                writeToChatLog(`${client.name} (${client.id}) said [${message}] to all other users\n`);
                client.write("Message sent to all other users");
                writeMessageToAllOtherUsers(`Message from ${client.name} (${client.id}): ${message}`, client);
                console.log(`${client.name} (${client.id}) said [${message}] to all other users\n`);
            } else if (messageAllCommand.length < 2) {
                client.write("Not enough arguments for this command");
            }
        }
    });

    client.on("end", () => {
        writeMessageToAllOtherUsers(`${client.name} (${client.id}) disconnected`, client);
        writeToChatLog(`${client.name} (${client.id}) disconnected\n`);
        console.log(`${client.name} (${client.id}) disconnected`);
        users = users.filter(user => user.id !== client.id);
    });
});

server.listen(3000, () => {
    writeToChatLog("Server connected\n");
    console.log("Server is running");
});

server.on("end", () => {
    console.log("Server ended");
});

server.on("error", (err) => {
    console.log(`Error occurred: ${err}`);
});

function writeMessageToAllOtherUsers(message, client) {
    for (let user of users) {
        if (user.id !== client.id) {
            user.write(`${message}`);
        }
    }
}

function writeToChatLog(message, funct = () => {}) {
    fs.appendFile("chat.log", message, (err) => {
        if (err) {
            console.log(`Error occurred: ${err}`);
        } else {
            console.log("Chat logged to 'chat.log'");
            funct();
        }
    });
}

function printClientListNames(client) {
    for (let user of users) {
        if (user.name === client.name) {
            client.write(`${user.name} (you)\n`);
        } else {
            client.write(`${user.name}\n`);
        }
    }
}

process.stdin.setEncoding("utf-8");
process.stdin.on("data", data => {
    if (data === "/quit\n") {
        writeToChatLog("Server disconnected\n", () => {
            process.exit();
        });
    }
});