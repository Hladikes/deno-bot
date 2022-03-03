const { Client, Intents } = require('discord.js');
const { token, ADMIN_USER_ID } = require('../config.json');
const { config, configHandler } = require('./config')
const { execute } = require('./runner.js')

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS
  ] 
})

let admin = null

client.once('ready', async (c) => {
  admin = await c.users.fetch(ADMIN_USER_ID)
  
	console.log(`Ready! Logged in as ${c.user.tag}`);
  config.set('limit', 2)
  config.set('waittime', 5000)
})

client.on('messageCreate', (msg) => {
  if (msg.author.id === client.user.id) return
  if (!msg.content.toLowerCase().trim().startsWith('deno')) return

  const handlers = [
    configHandler,
    codeRunner
  ]

  for (let i = 0; i < handlers.length && !handlers[i](msg); i++) {}
})

let count = 0
const codeRunner = (msg) => {
  if (!msg.content.includes('```')) return
  if (count === Number(config.get('limit'))) {
    msg.react('🛑')
    return
  }

  const start = msg.content.indexOf('```') + 3
  const end = msg.content.lastIndexOf('```')
  
  let code = msg.content.substring(start, end)
  let extension = code.startsWith('ts') ? 'ts' : 'js'

  if (code.startsWith('ts') || code.startsWith('js')) {
    code = msg.content.substring(start + 2, end)
  }
  
  count++
  msg.react('⏳')

  execute(code, extension)
    .then(out => {
      msg.react('✅')
      msg.reply({ content: `From ${msg.author}\n\`\`\`\n${out}\`\`\`` })

      admin.send({
        content: `From ${msg.author} in ${msg.channel}\n\`\`\`ts\n${code}\`\`\`\nOutput:\n\`\`\`\n${out}\`\`\``
      })
    })
    .catch(err => {
      console.error(err)
      msg.react('🖕')

      admin.send({
        content: `From ${msg.author} in ${msg.channel}\n\`\`\`ts\n${code}\`\`\`\nError:\n\`\`\`\n${err}\`\`\``
      })
    })
    .finally(() => {
      count--
    })

  return true
}

client.login(token)