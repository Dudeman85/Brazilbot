//This is just to make everything work with replit and keep the bot running on a server
const keepAlive = require("./server")
const Database = require("@replit/database")
const db = new Database()

//Requires for Discord.js
const Discord = require("discord.js")
const client = new Discord.Client()
const { Permissions } = require('discord.js');
const authToken = process.env['TOKEN']

//Special permissions for members
const specialAdmin = ["209821797200297984"]
const unbrazillable = ["893785085285924864"]
const notAllowedToBrazil = ["443972982906421250"]

//Initialise variables getting them from the database if appropriate
var prefix = {}
db.get("dPrefix").then(dPrefix => {
  if(!dPrefix){
    db.set("dPrefix", prefix)
  }else{
    prefix = dPrefix
  }
})

var permissionRole = {}
db.get("dPermissionRole").then(dPermissionRole => {
  if(!dPermissionRole){
    db.set("dPermissionRole", permissionRole)
  }else{
    permissionRole = dPermissionRole
  }
})
var brazilled = {}

//Goddamn mess of permisson checks.
//Basically if the author is and admin or special admin or has the use role or the use role permits everyone (no role) and the user is not blacklisted from using Brazilbot this will return true.
function CheckPermission(msg){
  return !notAllowedToBrazil.includes(msg.author.id.toString()) && (msg.member.hasPermission("ADMINISTRATOR") || specialAdmin.includes(msg.author.id.toString()) || msg.member.roles.cache.some(role => role.name.toLowerCase() === permissionRole) || permissionRole === "")
}

client.on("voiceStateUpdate", function(oldMember, newMember){
  let guild = newMember.guild.id.toString()
  if(!(guild in brazilled)){
    brazilled[guild] = []
  }
  //Check if a user has entered a chat other than Brazil
  if(newMember.channelID !== null){
    if(newMember.channelID !== newMember.guild.channels.cache.find(channel => channel.name === "Brazil").id){
      //Loop Through every brazilled member sending them to brazil if they were the one that movbed channels
      for (let i = 0; i < brazilled[guild].length; i++) {
        //Send the member to the Brazil chat
        if(newMember.id === brazilled[guild][i].id)
          brazilled[guild][i].voice.setChannel(newMember.guild.channels.cache.find(channel => channel.name === "Brazil"))
      } 
    }
  }
})

client.on("message", msg => {
  //Initialize variables for servers
  let guild = msg.guild.id.toString()
  if(!(guild in prefix)){
    prefix[guild] = "*"
  }
  if(!(guild in brazilled)){
    brazilled[guild] = []
  }
  if(!(guild in permissionRole)){
    permissionRole[guild] = ""
  }

  //!brazil command to send members to the "Brazil" chat
  if(msg.content.toLowerCase().startsWith(prefix[guild] + "brazil")){
    //Check if member is allowed to use Brazilbot
    if(CheckPermission(msg)){
      var subject = msg.mentions.members.first()

      //Ungly fix for making sure the @subject of the message is an individual
      try{
        subject.id
      }catch {
        msg.channel.send("You can only send individual users to Brazil.")
        return
      }

      //Check if the subject is allowed to be brazilled
      if(!unbrazillable.includes(subject.id.toString())){
        //Make sure that the subject has not already been sent to brazil
        if(brazilled[guild].indexOf(subject === -1)){
          msg.channel.send(subject.toString() + " has been sent to Brazil.")
          
          brazilled[guild].push(subject)

          //Move subject to brazil channel if they are in a voice channel
          if(subject.voice.channel){
            subject.voice.setChannel(msg.guild.channels.cache.find(channel => channel.name === "Brazil"))
          }
        }else{
          msg.channel.send(subject.toString() + " is already in Brazil.")
        }
      }else{
        msg.channel.send(subject.toString() + " is Unbrazillable.")
      }
    }else{
      msg.channel.send("You don't have permission to use this command.")
    }
  }
  
  //!unbrazil command to remove members from the "Brazil" chat
  if(msg.content.toLowerCase().startsWith(prefix[guild] + "unbrazil")){
    if(CheckPermission(msg)){
      var subject = msg.mentions.members.first()

      try{
        subject.id
      }catch {
        msg.channel.send("You can only remove individual users from Brazil.")
        return
      }

      if(brazilled[guild].indexOf(subject) > -1){
        msg.channel.send(subject.toString() + " has been removed from Brazil.")
        const index = brazilled[guild].indexOf(subject);
        if (index > -1) {
          brazilled[guild].splice(index, 1);
        }

      }else{
        msg.channel.send(subject.toString() + " is not in Brazil.")
      }
    }else{
      msg.channel.send("You don't have permission to use this command.")
    }
  }

  //Change role to allow users
  if(msg.content.toLowerCase().startsWith(prefix[guild] + "permissionrole")){
    //Skip standard permission check and only allow admins access
    if(msg.member.hasPermission("ADMINISTRATOR") || specialAdmin.includes(msg.author.id.toString())){
      if(msg.content.includes(prefix[guild] + "permissionrole ")){
        permissionRole = msg.content.replace(prefix[guild] + "permissionrole ", "").toLowerCase()
        db.set("dPermissionRole", permissionRole)
        msg.channel.send("Usage permission role set to \"" + permissionRole + "\"")
      }else{
        permissionRole = ""
        db.set("dPermissionRole", permissionRole)
        msg.channel.send("Usage permission role removed")
      }
    }else{
      msg.channel.send("You don't have permission to use this command.")
    }
  }

  //Change bot prefix
  if(msg.content.toLowerCase().startsWith(prefix[guild] + "prefix")){
    //Skip standard permission check and only allow admins access
    if(msg.member.hasPermission("ADMINISTRATOR") || specialAdmin.includes(msg.author.id.toString())){
      prefix[guild] = msg.content.replace(prefix[guild] + "prefix ", "")
      db.set("dPrefix", prefix)
      msg.channel.send("Prefix set to \"" + prefix[guild] + "\"")
    }else{
      msg.channel.send("You don't have permission to use this command.")
    }
  }

  //Help command
  if(msg.content.toLowerCase().startsWith(prefix[guild] + "help")){
    msg.channel.send("Commands:\n" + prefix[guild] + "brazil @user : Send user to Brazil\n" + prefix[guild] + "unbrazil @user : Remove user from Brazil\n" + prefix[guild] + "prefix [prefix] : Sets the bots prefix.\n" + prefix[guild] + "permissionrole [role] : Sets the role users need to have to use the bot (leave [role] blank to remove).")
  }
})

keepAlive()
client.login(authToken)