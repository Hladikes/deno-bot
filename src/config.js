const { ADMIN_USER_ID } = require('../config.json');

const config = new Map()

const configHandler = (msg) => {
  const msgLowerCase = msg.content.toLowerCase().trim()
  let group = null
  
  if (group = msgLowerCase.match(/deno\s+set\s+(\w{1,})\s+([0-9]{1,})/)) {
    // Find a better way to check for a permission
    if (msg.author.id !== ADMIN_USER_ID) {
      msg.react('🖕')
      return
    }

    const [, key, value] = group
    
    config.set(key, Number(value))
    msg.reply({ content: `\`${key}\` was set to \`${value}\`` })

    return true
  }

  if (group = msgLowerCase.match(/deno\s+get\s+(\w{1,})/)) {
    // Find a better way to check for a permission
    if (msg.author.id !== ADMIN_USER_ID) {
      msg.react('🖕')
      return
    }

    const [, key] = group
    msg.reply({ content: `\`${key}\` is set to \`${config.get(key)}\`` })

    return true
  }  
}

module.exports.config = config
module.exports.configHandler = configHandler