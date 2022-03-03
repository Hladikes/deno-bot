const { spawn } = require('child_process')
const { writeFileSync, rmSync } = require('fs')
const { config } = require('./config')

const generateRandomString = () => Math.random().toString(36).substring(2)

const createScriptFile = (code, extension) => {
  const filename = `${generateRandomString(extension)}.${extension}`
  const filepath = `./src/temp/${filename}`

  writeFileSync(filepath, code, { encoding: 'utf-8' })
  return filepath
}

const sanitizeOutput = (text) => {
  return text
    .substring(0, 1500)
    .replaceAll('@', String.fromCharCode(92) + '@')
    .replaceAll('`', '')
    .replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '')
}

const execute = (code, extension) => new Promise((res) => {
  const filepath = createScriptFile(code, extension)

  let timeoutId = -1
  let output = ''
  let terminated = false

  const cleanup = () => {
    rmSync(filepath)
    clearTimeout(timeoutId)
  }
  
  const resolve = () => {
    output = sanitizeOutput(output)

    if (terminated) {
      const seconds = Math.round((config.get('waittime') || 5000) / 1000)
      output += `\n[i] Automatically terminated after ${seconds} second${seconds > 1 ? 's' : ''}`
    }

    cleanup()
    res(output)
  }
  
  const denoBinary = process.platform.includes('win') ? 'deno.exe' : 'deno'
  const child = spawn(`./src/bin/${denoBinary}`, ['-q', 'run', '--config', './src/bin/tsconfig.json', filepath])
  
  child.stdout.setEncoding('utf-8')
  child.stdout.on('data', (data) => output += data)

  child.stderr.setEncoding('utf-8')
  child.stderr.on('data', (data) => output += data)

  child.on('exit', resolve)

  timeoutId = setTimeout(() => {
    child.kill('SIGKILL')
    terminated = true
  }, config.get('waittime') || 5000)
})

module.exports.execute = execute