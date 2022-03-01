const { Client, Intents } = require('discord.js');
const { token, ADMIN_USER_ID } = require('./config.json');
const { execute } = require('./runner.js')

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS
  ] 
})

const config = new Map()

client.once('ready', c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
  config.set('limit', 2)
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

const configHandler = (msg) => {
  if (msg.author.id !== ADMIN_USER_ID) {
    msg.react('🖕')
    return
  }

  const msgLowerCase = msg.content.toLowerCase().trim()
  let group = null
  
  if (group = msgLowerCase.match(/deno\s{1,}set\s{1,}(\w{1,})\s{1,}([0-9]{1,})/)) {
    const [, key, value] = group
    
    config.set(key, Number(value))
    msg.reply({ content: `\`${key}\` was set to \`${value}\`` })

    return true
  }

  if (group = msgLowerCase.match(/deno\s{1,}get\s{1,}(\w{1,})/)) {
    const [, key] = group
    msg.reply({ content: `\`${key}\` is set to \`${config.get(key)}\`` })

    return true
  }  
}

let count = 0
const codeRunner = (msg) => {
  if (!msg.content.includes('```ts')) return
  if (count === Number(config.get('limit'))) {
    msg.react('🛑')
    return
  }

  const start = msg.content.indexOf('```ts') + 5
  const end = msg.content.lastIndexOf('```')
  const code = msg.content.substring(start, end)
  
  count++
  msg.react('⏳')

  execute(code)
    .then(out => {
      msg.react('✅')
      msg.reply({ content: `\`\`\`\n${out}\`\`\`` })
    })
    .catch(err => {
      console.error(err)
      msg.react('🖕')
    })
    .finally(() => {
      count--
    })

  return true
}

client.login(token)