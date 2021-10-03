const Discord = require("discord.js")
const client = new Discord.Client()
const { Permissions } = require('discord.js');
const Database = require("@replit/database")
const db = new Database()

const authToken = process.env['TOKEN']

const specialAdmin = ["209821797200297984"]
const unbrazillable = ["233844862523408385", "209821797200297984", "893785085285924864"]
const notAllowedToBrazil = ["443972982906421250"]

var prefix = '!'
db.get("dPrefix").then(dPrefix => {
  if(!dPrefix){
    db.set("dPrefix", prefix)
  }else{
    prefix = dPrefix
  }
})

var permissionRole = ""
db.get("dPermissionRole").then(dPermissionRole => {
  if(!dPermissionRole){
    db.set("dPermissionRole", permissionRole)
  }else{
    permissionRole = dPermissionRole
  }
})

var brazilled = []

function CheckPermission(msg){
  return !notAllowedToBrazil.includes(msg.author.id.toString()) && (msg.member.hasPermission("ADMINISTRATOR") || specialAdmin.includes(msg.author.id.toString()) || msg.member.roles.cache.some(role => role.name.toLowerCase() === permissionRole) || permissionRole === "")
}

client.on("voiceStateUpdate", function(oldMember, newMember){
  //Check if a user has entered a chat other than Brazil
  if(newMember.channelID !== null){
    if(newMember.channelID !== newMember.guild.channels.cache.find(channel => channel.name === "Brazil").id){

      //Loop Through every brazilled member sending them to brazil if they were the one that movbed channels
      for (let i = 0; i < brazilled.length; i++) {
        //Send the member to the Brazil chat
        if(newMember.id === brazilled[i].id)
          brazilled[i].voice.setChannel(newMember.guild.channels.cache.find(channel => channel.name === "Brazil"))
      } 
    }
  }
})

client.on("message", msg => {
  //!brazil command to send members to the "Brazil" chat
  if(msg.content.toLowerCase().startsWith(prefix + "brazil")){
    //Check if member is allowed to use Brazilbot
    if(CheckPermission(msg)){
      var subject = msg.mentions.members.first()

      try{
        subject.id
      }catch {
        msg.channel.send("You can only send individual users to Brazil.")
        return
      }

      //Check if the subject is allowed to be brazilled
      if(!unbrazillable.includes(subject.id.toString())){
        //Make sure that the subject has not already been sent to brazil
        if(brazilled.indexOf(subject === -1)){
          msg.channel.send(subject.toString() + " has been sent to Brazil.")
          
          brazilled.push(subject)

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
  if(msg.content.toLowerCase().startsWith(prefix + "unbrazil")){
    if(CheckPermission(msg)){
      var subject = msg.mentions.members.first()

      try{
        subject.id
      }catch {
        msg.channel.send("You can only remove individual users to Brazil.")
        return
      }

      if(brazilled.indexOf(subject) > -1){
        msg.channel.send(subject.toString() + " has been removed from Brazil.")
        const index = brazilled.indexOf(subject);
        if (index > -1) {
          brazilled.splice(index, 1);
        }

      }else{
        msg.channel.send(subject.toString() + " is not in Brazil.")
      }
    }else{
      msg.channel.send("You don't have permission to use this command.")
    }
  }

  //Change role to allow users
  if(msg.content.toLowerCase().startsWith(prefix + "permissionrole")){
    if(msg.member.hasPermission("ADMINISTRATOR") || specialAdmin.includes(msg.author.id.toString())){
      if(msg.content.includes(prefix + "permissionrole ")){
        permissionRole = msg.content.replace(prefix + "permissionrole ", "")
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
  if(msg.content.toLowerCase().startsWith(prefix + "prefix")){
    if(msg.member.hasPermission("ADMINISTRATOR") || specialAdmin.includes(msg.author.id.toString())){
      prefix = msg.content.replace(prefix + "prefix ", "")
      db.set("dPrefix", prefix)
      msg.channel.send("Prefix set to \"" + prefix + "\"")
    }else{
      msg.channel.send("You don't have permission to use this command.")
    }
  }

  //Help command
  if(msg.content.toLowerCase().startsWith(prefix + "help")){
    msg.channel.send("Commands:\n" + prefix + "brazil @user : Send user to Brazil\n" + prefix + "unbrazil @user : Remove user from Brazil\n" + prefix + "prefix [prefix] : Sets the bots prefix.\n" + prefix + "permissionrole [role] : Sets the role users need to have to use the bot (leave [role] blank to remove).")
  }
})

client.login(authToken)