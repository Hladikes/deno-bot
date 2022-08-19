require('dotenv').config()

const { Client, Intents } = require('discord.js')
const { prepareCode, execute } = require('./runner.js')
const { log } = require('./logger.js')
const { Limiter } = require('./limiter.js')

const limiter = new Limiter(Number(process.env.INSTANCES_LIMIT))

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS
  ] 
})

client.once('ready', async (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`)
})

client.on('messageCreate', (msg) => {
  if (msg.author.id === client.user.id || !msg.content.toLowerCase().trim().startsWith('deno')) {
    return
  }

  codeRunner(msg)
})

const codeRunner = (msg) => {
  if (!msg.content.includes('```')) {
    return
  }

  const { code, extension } = prepareCode(msg.content)

  const isRunning = limiter.run(async (done) => {
    msg.react('⏳')
    
    try {
      const out = await execute(code, extension)

      msg.react('✅')
      msg.reply({ content: `From ${msg.author}\n\`\`\`\n${out}\`\`\`` })

      log(String(msg.author), String(msg.channel), code, out)
    } catch (err) {
      console.error(err)
      msg.react('❌')
      
      log(String(msg.channel), String(msg.channel), code, out)
    }
    
    done()
  })

  if (!isRunning) {
    msg.react('🛑')
    return
  }
}

client.login(process.env.DISCORD_TOKEN)