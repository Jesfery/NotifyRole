/*jshint esversion: 6 */

// discord.js module
const Discord = require('discord.js');

// Discord Token, located in the Discord application console - https://discordapp.com/developers/applications/me/
const { token, prefix } = require('./config.json');

//Maximum users to tag
const maxUsers = 50;

// Instance of Discord to control the bot
const bot = new Discord.Client();

// Gets called when the bot is successfully logged in and connected
bot.on('ready', function() {
    var promises = [];

    //Cache users at startup.
    bot.guilds.forEach(guild => {
        promises.push(guild.fetchMembers());
    });
    Promise.all(promises).then(() => {
        bot.on('message', handleMessage);
    });
});

function handleMessage(message) {
    var author = message.author,
        textChannel, voiceChannel, max;

    // So the bot doesn't reply to iteself
    if (message.author.bot) return;

    // Check if the message starts with the prefix trigger
    if (message.content.indexOf(prefix) === 0) {

        // Get the user's message excluding the prefix
        var args = message.content.substring(1);

        args = args.split(' ');

        if (args[0] === 'notifyrole') {
            notifyRole(message, args).then(resp => {
                if (typeof resp === 'string') {
                    message.channel.send(resp);
                }
            }).catch(err => {
                console.log(err);
            });
        }

    }
}

function notifyRole(message, args) {
    return new Promise((resolve, reject) => {
        let guild, 
            user, 
            role, 
            onlineUsers,
            mentions = [],
            subject;

        if (!args.length) {
            resolve('No role supplied');
            return;
        }

        user = message.author;

        //Check to see if the user is allowed to use

        guild = message.channel.guild;
    
        role = guild.roles.find(role => {
            return role.name === args[1];
        });

        if (!role) {
            resolve('Role does not exist');
            return;
        }

        //Perhaps do some checks to see if its one of your self/bot assignable roles.

        onlineUsers = role.members.filter(member => {
            return member.presence.status === 'online';
        });

        //So its not pinging huge amounts of people... I dunno #lied2Agen
        if (onlineUsers.size > maxUsers) {
            resolve('Too many users');
            return;
        }
        
        if (onlineUsers.size === 0) {
            resolve('No users are online');
            return;
        }

        onlineUsers.forEach(user => {
            mentions.push(user.toString());
        });

        subject = 'Hey, online \'' + role.name + '\' members ^ ';
        subject = subject + '\n\n' + mentions.join(' ');

        resolve(subject);
    });

}

bot.login(token);