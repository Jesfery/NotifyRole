/*jshint esversion: 6 */

// discord.js module
const Discord = require('discord.js');

// Discord Token, located in the Discord application console - https://discordapp.com/developers/applications/me/
const { token, prefix } = require('./config.json');

//Lifetime of channel (in ms)
const timeout = 30 * 60000;

//Game specific roles category name.
const categoryName = 'game specific text chat';

//Postfix for the temporary channel
const postfix = '-temp-channel';

//Channel timeouts
const timeouts = new Discord.Collection();

// Instance of Discord to control the bot
const bot = new Discord.Client();

// Gets called when the bot is successfully logged in and connected
bot.on('ready', function() {
    
    bot.guilds.forEach(guild => {
        guild.channels.forEach(channel => {
            if (channel.name.endsWith(postfix)) {
                //Incase of unexpected shutdown, give existing channels another timeout at startup.
                timeouts.set(channel.id, setTimeout(channel.delete.bind(channel), timeout));
            }
        });
    });

    bot.on('message', handleMessage);
});

function handleMessage(message) {
    if (message.author.bot) return;

    // Check if the message starts with the prefix trigger
    if (message.content.indexOf(prefix) === 0) {

        // Get the user's message excluding the prefix
        let args = message.content.substring(1).split(' '),
            commandName = args.shift().toLowerCase();

        if (commandName === 'notifyrole') {
            notifyRole(message, args).then(resp => {
                if (typeof resp === 'string') {
                    message.channel.send(resp);
                }
            }).catch(err => {
                console.log(err);
            });
        }

    }

    if (message.channel && timeouts.has(channel.id)) {
        //temp channel activity detected, give it another timeout.
        let textChannel = message.channel;
        clearTimeout(timeouts.get(textChannel.id));
        timeouts.set(textChannel.id, setTimeout(textChannel.delete.bind(textChannel), timeout));
    }

}

/**
 * Will create a temporary channel for a given role, then perform a @here in it.
 * 
 * @param {Message} message 
 * @param {Array} args 
 */
function notifyRole(message, args) {
    return new Promise((resolve, reject) => {
        let guild, 
            user, 
            role, 
            channelName,
            textChannel,
            everyone,
            category,
            promise = Promise.resolve(); 

        if (!args.length) {
            resolve('No role supplied');
            return;
        }

        user = message.author;
        //Optional - check to see if the user is allowed to use

        guild = message.channel.guild;

        role = args.shift();
        role = guild.roles.find(r => {
            return r.name === role;
        });

        if (!role) {
            resolve('Role does not exist');
            return;
        }

        //Perhaps do some checks to see if its one of your self/bot assignable roles.
        
        everyone = guild.roles.find(role => {
            return role.name === '@everyone';
        });

        category = guild.channels.find(function(channel) {
            return channel.name === categoryName;
        });

        channelName = role.name + postfix;

        textChannel = guild.channels.find(function(channel) {
            return channel.name === channelName;
        });

        if (!textChannel) {
            promise = guild.createChannel(channelName, 'text', [{
                id: role,
                allow: ['SEND_MESSAGES', 'VIEW_CHANNEL']
            }, {
                id: guild.client.user,
                allow: ['SEND_MESSAGES', 'VIEW_CHANNEL', 'MENTION_EVERYONE']
            }, {
                id: everyone,
                deny: ['SEND_MESSAGES', 'VIEW_CHANNEL']
            }]);

            promise = promise.then(channel => {
                textChannel = channel;

                if (!category) {
                    return Promise.resolve();
                }

                return textChannel.setParent(category);
            });
        }

        promise.then(channel => {
            textChannel.send('@here\n\n' + args.join(' '));

            if (timeouts.has(textChannel.id)) {
                clearTimeout(timeouts.get(textChannel.id));
            }

            //Remove the channel after the configured timeout
            timeouts.set(textChannel.id, setTimeout(textChannel.delete.bind(textChannel), timeout));

            resolve();
        });

    });
}

bot.login(token);