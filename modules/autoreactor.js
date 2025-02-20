const API = require("../api");
const FS = require("fs");
const { ThreadChannel, ForumChannel } = require("discord.js")

let reactionList = [];
const file = "./config/autoreactor.json";

async function loadReactions() {
    reactionList = JSON.parse(FS.readFileSync(file, 'utf8'));

    for (object of reactionList) {
        if (!object.channel) console.log("Reaction \"" + object + "\" has no channel!");
        if (!object.reaction && !object.reactions) console.log("Reaction \"" + object + "\" has no reactions!");
    }
}

async function onTextMessage(message) {
    var channel = message.channel;

    //If its a thread, don't bother doing anything
    if (message.channel instanceof ThreadChannel) {
        //If its a forum, check the parent channel (posts are "threads"). Else, return
        if (message.channel.parent && message.channel.parent instanceof ForumChannel) {
            channel = message.channel.parent;
        } else return; 
    }

    //Loop through all reactions we have in the reaction config
    for (reactionObj of reactionList) {
        
         //If the channel ID or channel name is equal to the channel specified
        if (channel.id === reactionObj.channel || channel.name === reactionObj.channel) {
            //If they have multiple reactions to give
            if (reactionObj.reactions) { 
                for (emoji of reactionObj.reactions) {
                    message.react(emoji);
                }
            } else if (reactionObj.reaction) { //Single reaction
                message.react(reactionObj.reaction);
            }

            //If there is a create-thread property and it is true
            if (reactionObj["create-thread"] && reactionObj["create-thread"] == true) {
                let title = message.content
                    .replaceAll(/\|\|.+\|\|/g, "") //Replace all spoilers with nothing
                    .replaceAll(/```(\S+)(?:.|\n|\r)*```/gm, "$1 Code") //Replace code with "x Code"
                    .split(/[\n.,?!-]/g)[0]; //Split by sentence enders or a new line

                if (message.attachments.size > 0) title = message.attachments.get(0).name; //Use the attachment name instead
                else if (title.length > 50) title = title.substring(0, 50) + "..."; //Cut off long names
                else if (title.length < 8 && message.content >= 8) title = message.content.substring(0, 50); //So things like v1.10.0 don't become a title of "v1"

                //Filter out any discord markup. Then change escaped marked up characters to the proper characters so it isn't escaped
                title = title.replaceAll(/(?<!\\)[*_]/g, "").replaceAll(/\\\*/g, "*").replaceAll(/\\_/g, "_");

                message.startThread({name: title, autoArchiveDuration: 60});
            }
        }
    }
}

/*async function onThreadCreate(thread) {
    
}*/

API.subscribe("reload", loadReactions); //Register the reload of reactions on reload
API.subscribe("messageCreate", onTextMessage); //Register the handler for when text messages are sent

loadReactions(); //Load the reactions