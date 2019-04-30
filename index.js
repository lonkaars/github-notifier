// startup vars
var Discord = require('discord.js');
var bot = new Discord.Client();
var token = require('./token.json');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var fs = require('fs');
const cheerio = require('cheerio');
var package = require('./package.json');

// invite link
// https://discordapp.com/oauth2/authorize?client_id=566578540695388171&scope=bot

// serverconfig loading
var serverconfig = fs.readFileSync("./serverconfig.json");
serverconfig = JSON.parse(serverconfig);

// serverconfig default object
class DSServer {
    constructor(guild, defaultChannelID) {
        this.serverobj = {
            "id": guild.id,
            "defaultChannel": defaultChannelID,
            "subscribedURLs": [],
            "subscribedUsers": []
        }
    }
}

// def error messages
var errorMessage = 'Sorry, something went wrong.'
var wrongOptions = 'Sorry, that isn\'t a valid option.'
var submsg = 'Succsessfully subscribed.';
var unsubmsg = 'Successfully unsubscribed.';
var alreadysubmsg = 'You\'re already subscribed.';
var alredyunsubmsg = 'You\'re already unsubscribed.';
var addmsg = 'Successfully added "$1"';
var remmsg = 'Successfully removed "$1"';
var alreadyaddmsg = 'You\'re already subscribed to "$1"';
var alreadyremmsg = 'You\'re already unsubscribed to "$1"';
var tryhelp = 'Try `git -h` for help'
var invalidURL = 'Invalid GitHub URL'
var noSubUsr = 'No subscribed users'
var noSubUrl = 'Not subscribed to any URL\'s'
var subUsr = 'Subscribed users:'
var subUrl = 'Subscribed to URL\'s'
var succChannelChg = 'Successfully changed the default channel.'
var invalidPerms = 'Uh oh, you don\'t have the permission to do that.'
var subeveryone = 'Now mentioning everyone on new releas(es).'
var clearsubs = 'Subscribers cleared.'

// manual
var manual = [
    "Usage:",
    "git [options]",
    "",
    "Options:",
    "  -h, --help, help",
    "    sends this manual",
    "",
    "  -s, sub, --sub, subscribe, --subscribe",
    "    adds you to the notification list for new releases of all repos",
    "     usage: `git -s`",
    "",
    "  -se, --subscribe-everyone",
    "    subscribes everyone to the bot",
    "    WARNING: REQUIRES ADMINISTRATOR RIGHTS",
    "    WARNING: OVERWRITES EVERY SUBSCRIBED USER",
    "     usage: `git -se`",
    "",
    "  -u, unsub, --unsub, unsubscribe, --unsubscribe",
    "    removes you from the notification list for new releases of all repos",
    "     usage: `git -u`",
    "",
    "  -ue, --unsubscribe-everyone",
    "    unsubscribes everyone from the bot",
    "    WARNING: REQUIRES ADMINISTRATOR RIGHTS",
    "    WARNING: OVERWRITES EVERY SUBSCRIBED USER",
    "     usage: `git -ue`",
    "",
    "  -a, --add, add",
    "    adds a repo to check for updates",
    "     example usage: `git -a https://github.com/username/repository-name`",
    "",
    "  -r, --remove, --rem, remove",
    "    removes a repo to check for updates",
    "     example usage: `git -r https://github.com/username/repository-name`",
    "",
    "  -sl, --subscriber-list, --sublist, subscriberlist",
    "    lists subscribed users",
    "     usage: `git -sl`",
    "",
    "  -ul, --url-list, --urllist, urllist",
    "    lists subscribed to url's",
    "     usage: `git -ul`",
    "",
    "  -sc, --set-channel, --setchannel, setchannel",
    "    sets the default channel for announcements",
    "     usage: `git -sc`",
    "",
    "  -v, --version, version",
    "    returns the current git version",
    "     usage: `git -v`"
]


// functions
function httpGet(url) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", url.replace(/http(?!s)(?=\:)/, '$&s'), false);
    xmlHttp.send(null)
    return xmlHttp.responseText
}

function status(url) {
    var request = new XMLHttpRequest();
    request.open('GET', url.replace(/http(?!s)(?=\:)/, '$&s'), false);
    request.send(null);
    return request.status
}

function getReleasesCount(repoURL) {
    try {
        var html = httpGet(repoURL)
        var $ = cheerio.load(html)
        var topGitLinks = $('li a span.num.text-emphasized')
        for(let i = 0; i < topGitLinks.length; i++){
            if(topGitLinks[i].next.data.match(/releases?/)){
                return (topGitLinks[i].children[0].data.match(/\d+/)[0])
            }
        }
    } catch (error) {
        console.log(error)
        return errorMessage
    }
}

function updateServerconfig() {
    serverconfig = JSON.stringify(serverconfig, null, 4);
    fs.writeFileSync('./serverconfig.json', serverconfig);
    serverconfig = JSON.parse(serverconfig);
}

function oldServerIDs() {
    var tempvar = []
    for (let i = 0; i < serverconfig.length; i++) {
        tempvar.push(serverconfig[i].id)
    }
    return tempvar
}

function curServerIDs(bot) {
    var tempvar = []
    for (let i = 0; i < bot.guilds.array().length; i++) {
        tempvar.push(bot.guilds.array()[i].id)
    }
    return tempvar
}

function whenJoined(bot) {
    if (serverconfig.length <= (bot.guilds.array().length - 1)) { // added server
        for (let i = 0; i < curServerIDs(bot).length; i++) {
            if (!oldServerIDs().includes(curServerIDs(bot)[i])) {
                var defChannelID
                for (o in bot.guilds.array()[i].channels.array()) {
                    var channelArr = bot.guilds.array()[i].channels.array()
                    try {
                        if(channelArr[o].deleted != true && channelArr[o].type == 'text'){
                            defChannelID = channelArr[o].id
                        }
                    } catch (error) {
                        defChannelID = null
                    }
                }
                tempServ = new DSServer(bot.guilds.array()[i], defChannelID)
                serverconfig.push(tempServ.serverobj);
            }
        }
        updateServerconfig()
    }
}

function whenKicked(bot) {
    if (serverconfig.length >= bot.guilds.array().length + 1) { // removed from server
        for (let i = 0; i < oldServerIDs().length; i++) {
            if (!curServerIDs(bot).includes(oldServerIDs()[i])) {
                serverconfig.splice(i, 1);
            }
        }
        updateServerconfig()
    }
}

function grabGuildIndex(message) {
    var id = message.guild.id
    for (let i = 0; i < serverconfig.length; i++) {
        if (serverconfig[i].id == id) {
            return i;
        }
    }
}

function grabGuildsObjIndex(id) {
    var id = id.toString()
    for (let i = 0; i < bot.guilds.array().length; i++) {
        if (bot.guilds.array()[i].id = id) {
            return i;
        }
    }
}

function removeSubbed(thing, type, index) {
    for (let i = 0; i < serverconfig[index][type == true ? `subscribedURLs` : `subscribedUsers`].length; i++) {
        if (serverconfig[index][type == true ? `subscribedURLs` : `subscribedUsers`][i][type == true ? `url` : `username`] == thing) {
            serverconfig[index][type == true ? `subscribedURLs` : `subscribedUsers`].splice(i, 1);
        }
    }
}

function checkIfSubbed(thing, type, index) {
    var toret = false;
    for (let i = 0; i < serverconfig[index][type == true ? `subscribedURLs` : `subscribedUsers`].length; i++) {
        if (serverconfig[index][type == true ? `subscribedURLs` : `subscribedUsers`][i][type == true ? `url` : `username`] == thing) {
            toret = true;
        }
    }
    return toret
}

function verifyGitHubURL(url) {
    if (status(url) != 404 && url.match(/http(s?)\:\/\/github\.com\/.+\/.+/) ? true : false) {
        return true
    } else {
        return false
    }
}

function generateEmbed(s1, s2) {
    return {
        "embed": {
            "color": 14342874,
            "fields": [{
                "name": s1,
                "value": s2
            }]
        }
    }
}

function makeURLObj(url, relscnt) {
    return { "url": url, "releaseCount": relscnt }
}

function sendMsgByChID(id, message) {
    var channel = bot.channels.find('id', id)
    channel.send(message)
}

function userlist(index) {
    var temp = [];
    for(let i = 0; i < serverconfig[index].subscribedUsers.length; i++){
        temp.push(serverconfig[index].subscribedUsers[i].username)
    }
    return temp
}

function urllist(index) {
    var temp = [];
    for(let i = 0; i < serverconfig[index].subscribedURLs.length; i++){
        temp.push(serverconfig[index].subscribedURLs[i].url)
    }
    return temp
}

//listeners
bot.on('guildCreate', function (guild) {
    whenJoined(bot);
});

bot.on('guildDelete', function (guild) {
    whenKicked(bot);
});

bot.on('message', (message) => {
    if (message.guild !== null) {
        // check if invited to server or kicked from one
        whenJoined(bot);
        whenKicked(bot);

        // split message to array
        var messagearr = message.content.split(' ');

        // git command
        if (messagearr.length >= 2) {
            if (messagearr[0] == 'git') {
                if (messagearr[1].match(/(?<!.)help(?!.)|(?<!.)--help(?!.)|(?<!.)-h(?!.)/)) {
                    message.channel.send(manual)
                } else if (messagearr[1].match(/(?<!.)subscribe(?!.)|(?<!.)sub(?!.)|(?<!.)--sub(?!.)|(?<!.)--subscribe(?!.)|(?<!.)-s(?!.)/)) {
                    if (checkIfSubbed(`${message.author.username}#${message.author.discriminator}`, false, grabGuildIndex(message)) == false) {
                        serverconfig[grabGuildIndex(message)].subscribedUsers.push({"username":`${message.author.username}#${message.author.discriminator}`, "id": `${message.author.id}`});
                        updateServerconfig();
                        message.channel.send(submsg)
                    } else {
                        message.channel.send(alreadysubmsg);
                    }
                } else if (messagearr[1].match(/(?<!.)-se(?!.)|(?<!.)--subscribe-everyone(?!.)/)) {
                    if (message.member.hasPermission("ADMINISTRATOR")) {
                        serverconfig[grabGuildIndex(message)].subscribedUsers = [{"username":`@everyone`, "id": `everyone`}];
                        updateServerconfig();
                        message.channel.send(subeveryone);
                    } else {
                        message.channel.send(invalidPerms);
                    }
                } else if (messagearr[1].match(/(?<!.)unsubscribe(?!.)|(?<!.)unsub(?!.)|(?<!.)--unsub(?!.)|(?<!.)--unsubscribe(?!.)|(?<!.)-u(?!.)/)) {
                    if (checkIfSubbed(`${message.author.username}#${message.author.discriminator}`, false, grabGuildIndex(message)) == true) {
                        removeSubbed(`${message.author.username}#${message.author.discriminator}`, false, grabGuildIndex(message));
                        updateServerconfig();
                        message.channel.send(unsubmsg);
                    } else {
                        message.channel.send(alredyunsubmsg);
                    }
                } else if (messagearr[1].match(/(?<!.)-ue(?!.)|(?<!.)--unsubscribe-everyone(?!.)/)) {
                    if (message.member.hasPermission("ADMINISTRATOR")) {
                        serverconfig[grabGuildIndex(message)].subscribedUsers = [];
                        updateServerconfig();
                        message.channel.send(clearsubs);
                    } else {
                        message.channel.send(invalidPerms);
                    }
                } else if (messagearr[1].match(/(?<!.)add(?!.)|(?<!.)--add(?!.)|(?<!.)-a(?!.)/)) {
                    if (messagearr.length == 3) {
                        if (checkIfSubbed(messagearr[2], true, grabGuildIndex(message)) == false) {
                            if (verifyGitHubURL(messagearr[2]) == true) {
                                serverconfig[grabGuildIndex(message)].subscribedURLs.push(makeURLObj(messagearr[2].replace(/http(?!s)(?=\:)/, '$&s'), getReleasesCount(messagearr[2].replace(/http(?!s)(?=\:)/, '$&s'))));
                                updateServerconfig();
                                message.channel.send(addmsg.replace("$1", messagearr[2]))
                            } else {
                                message.channel.send(invalidURL)
                            }
                        } else {
                            message.channel.send(alreadyaddmsg.replace("$1", messagearr[2]));
                        }
                    } else {
                        message.channel.send(wrongOptions)
                    }
                } else if (messagearr[1].match(/(?<!.)remove(?!.)|(?<!.)--remove(?!.)|(?<!.)--rem(?!.)|(?<!.)-r(?!.)/)) {
                    if (messagearr.length == 3) {
                        if (checkIfSubbed(messagearr[2].replace(/http(?!s)(?=\:)/, '$&s'), true, grabGuildIndex(message)) == true) {
                            removeSubbed(messagearr[2].replace(/http(?!s)(?=\:)/, '$&s'), true, grabGuildIndex(message));
                            updateServerconfig();
                            message.channel.send(remmsg.replace("$1", messagearr[2]));
                        } else {
                            message.channel.send(alreadyremmsg.replace("$1", messagearr[2]));
                        }
                    } else {
                        message.channel.send(wrongOptions)
                    }
                } else if (messagearr[1].match(/(?<!.)-sl(?!.)|(?<!.)--subscriber-list(?!.)|(?<!.)--sublist(?!.)|(?<!.)subscriberlist(?!.)/)) {
                    if (serverconfig[grabGuildIndex(message)].subscribedURLs.length >= 1) {
                        message.channel.send(generateEmbed(subUrl, urllist(grabGuildIndex(message)).join('\n').replace(/.*[^\n]/g, '\`$&\`')))
                    } else {
                        message.channel.send(noSubUrl)
                    }
                } else if (messagearr[1].match(/(?<!.)-ul(?!.)|(?<!.)--url-list(?!.)|(?<!.)--urllist(?!.)|(?<!.)urllist(?!.)/)) {
                    if (serverconfig[grabGuildIndex(message)].subscribedUsers.length >= 1) {
                        message.channel.send(generateEmbed(subUsr, userlist(grabGuildIndex(message)).join('\n').replace(/.*[^\n]/g, '\`$&\`')))
                    } else {
                        message.channel.send(noSubUsr)
                    }
                } else if (messagearr[1].match(/(?<!.)-sc(?!.)|(?<!.)--set-channel(?!.)|(?<!.)--setchannel(?!.)|(?<!.)setchannel(?!.)/)) {
                    serverconfig[grabGuildIndex(message)].defaultChannel = message.channel.id;
                    updateServerconfig();
                    message.channel.send(succChannelChg);
                } else if (messagearr[1].match(/(?<!.)-v(?!.)|(?<!.)--version(?!.)|(?<!.)version(?!.)/)) {
                    message.channel.send(`Git v${package.version}`);
                } else {
                    message.channel.send(wrongOptions)
                }
            }
        } else if (messagearr.length == 1 && messagearr[0] == 'git') {
            message.channel.send(tryhelp);
        }
    }
})


//watch for new releases
setInterval(() => {
    for(let a = 0; a < serverconfig.length; a++){
        for(let b = 0; b < serverconfig[a].subscribedURLs.length; b++){
            if(serverconfig[a].subscribedURLs[b].releaseCount != getReleasesCount(serverconfig[a].subscribedURLs[b].url)){
                var message = generateEmbed(`New release from: ${serverconfig[a].subscribedURLs[b].url}`, `_ _\n`)
                var toNotif = [];
                for(let c = 0; c < serverconfig[a].subscribedUsers.length; c++){
                    toNotif.push(`<@${serverconfig[a].subscribedUsers[c].id}>`)
                    if(serverconfig[a].subscribedUsers[c].id == 'everyone' && c + 1 == serverconfig[a].subscribedUsers.length){
                        toNotif = ['@everyone'];
                    }
                }
                if(serverconfig[a].subscribedUsers.length != 0){
                    sendMsgByChID(serverconfig[a].defaultChannel, toNotif.join(' , '))
                }
                sendMsgByChID(serverconfig[a].defaultChannel, message)
                serverconfig[a].subscribedURLs[b].releaseCount = getReleasesCount(serverconfig[a].subscribedURLs[b].url)
                updateServerconfig()
            }
        }
    }
}, 5000);


// bot ready message
bot.on('ready', () => {
    console.log("klaar")
})

// bot login
bot.login(token.token);