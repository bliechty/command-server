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
    writeMessageToAllOtherUsers(`${client.name} connected\n`, client);
    writeToChatLog(`${client.name} connected\n`);
    console.log(`${client.name} connected`);

    client.on("data", data => {
        if (data === "/quit\n") {
            client.end();
        } else if (data === "/clientlist\n") {
            printClientListNames(client);
        } else if (/^\/w /.test(data) || data === "/w\n") {
            const whisperCommand = data.split(" ");
            if (whisperCommand.length >= 3) {
                const name = whisperCommand[1];
                const message = whisperCommand.slice(2, whisperCommand.length).join(" ").trim();
                if (!name || !message) {
                    client.write("Command incorrectly entered\nExample: /w Client5 Hello\n");
                } else {
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
                        writeToChatLog(`${client.name} said [${message}] to: ${recipient.name}\n`);
                        recipient.write(`***\nWhisper from ${client.name}: ${message}\n***`);
                        client.write(`Message sent to ${recipient.name}\n`);
                        console.log(`${client.name} said [${message}] to: ${recipient.name}`);
                    }
                }
            } else if (whisperCommand.length < 3) {
                client.write("Command incorrectly entered\nExample: /w Client5 Hello\n");
            }
        } else if (/^\/username /.test(data) || data === "/username\n") {
            const usernameCommand = data.split(" ");
            if (usernameCommand.length === 2) {
                const name = usernameCommand[1].trim();
                if (!name) {
                    client.write("Command incorrectly entered\nExample: /username betty\n");
                } else if (name === client.name) {
                    client.write(`Your name is already ${client.name}`);
                } else {
                    writeToChatLog(`${client.name} successfully changed their name to ${name}\n`);
                    writeMessageToAllOtherUsers(`${client.name} successfully changed their name to ${name}\n`, client);
                    client.write(`You successfully changed your name to ${name}\n`);
                    console.log(`${client.name} successfully changed their name to ${name}`);
                    client.name = name;
                }
            } else if (usernameCommand.length < 2 || usernameCommand.length > 2) {
                client.write("Command incorrectly entered\nExample: /username betty\n");
            }
        } else if (/^\/kick /.test(data) || data === "/kick\n") {
            const kickCommand = data.split(" ");
            if (kickCommand.length === 3) {
                const name = kickCommand[1];
                const password = kickCommand[2].trim();
                if (!name || !password) {
                    client.write("Command incorrectly entered\nExample: /kick Client3 [admin password]\n");
                } else {
                    if (password === adminPassword) {
                        let recipient;
                        for (let user of users) {
                            if (user.name === name) {
                                recipient = user;
                            }
                        }
                        if (recipient === undefined) {
                            client.write(`${name} is not online or name is not spelled correctly\ntry again\n`)
                        } else if (recipient.name === client.name) {
                            client.write("You cannot kick yourself\n");
                        } else {
                            writeToChatLog(`${client.name} kicked ${recipient.name}\n`);
                            writeMessageToAllOtherUsers(`${client.name} kicked ${recipient.name}\n`, client);
                            client.write(`You successfully kicked ${name}\n`);
                            console.log(`${client.name} kicked ${recipient.name}`);
                            recipient.end();
                        }
                    } else {
                        client.write("That is not the admin password");
                    }
                }
            } else if (kickCommand.length < 3 || kickCommand.length > 3) {
                client.write("Command incorrectly entered\nExample: /kick Client3 [admin password]\n");
            }
        } else if (/^\/messageall /.test(data) || data === "/messageall\n") {
            const messageAllCommand = data.split(" ");
            if (messageAllCommand.length >= 2) {
                const message = messageAllCommand.slice(1, messageAllCommand.length).join(" ").trim();
                if (!message) {
                    client.write("Command incorrectly entered\nExample: /messageall Hello\n");
                } else {
                    console.log("message: ", message);
                    writeToChatLog(`${client.name} said [${message}] to all other users\n`);
                    client.write("Message sent to all other users\n");
                    writeMessageToAllOtherUsers(`Message from ${client.name}: ${message}`, client);
                    console.log(`${client.name} said [${message}] to all other users\n`);
                }
            } else if (messageAllCommand.length < 2) {
                client.write("Command incorrectly entered\nExample: /messageall Hello\n");
            }
        } else if (data === "/commandslist\n") {
            displayCommands(client);
        } else if (data === "/name\n") {
            client.write(client.name + "\n");
        } else if (/^\//.test(data)) {
            client.write("That is not a command. Enter /commandslist to see list of commands\n");
        } else {
            client.write("To see a list of commands enter /commandslist\n");
        }
    });

    client.on("end", () => {
        writeMessageToAllOtherUsers(`${client.name} disconnected\n`, client);
        writeToChatLog(`${client.name} disconnected\n`);
        console.log(`${client.name} disconnected`);
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
    let message = "";
    for (let user of users) {
        if (user.name === client.name) {
            message += user.name + " (you)\n";
        } else {
            message += user.name + "\n";
        }
    }
    client.write(message);
}

function displayCommands(client) {
    client.write(`
        Commands:
        Quit: /quit,
        List of clients: /clientlist,
        Message all other clients: /messageall (ex: /messageall Hello),
        Whisper to client: /w (ex: /w Client5 Hello),
        Change username: /username (ex: /username betty),
        Kick client: /kick (ex: /kick Client3 [admin password]),
        Commands list: /commandslist,
        See current name: /name
    `);
}

process.stdin.setEncoding("utf-8");
process.stdin.on("data", data => {
    if (data === "/quit\n") {
        writeToChatLog("Server disconnected\n", () => {
            process.exit();
        });
    }
});