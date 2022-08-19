const { spawn } = require('child_process')
const { writeFileSync, rmSync } = require('fs')
const { generateRandomString } = require('./util.js')

const denoBinary = process.platform.includes('win') ? 'deno.exe' : 'deno'

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

const prepareCode = (text) => {
  const start = text.indexOf('```') + 3
  const end = text.lastIndexOf('```')
  
  let code = text.substring(start, end)
  let extension = code.startsWith('ts') ? 'ts' : 'js'

  if (code.startsWith('ts') || code.startsWith('js')) {
    code = text.substring(start + 2, end)
  }

  return { 
    code, 
    extension,
  }
}

const execute = (code, extension) => new Promise((resolve) => {
  const filepath = createScriptFile(code, extension)

  let timeoutId = -1
  let output = ''
  let terminated = false

  const child = spawn(`./src/bin/${denoBinary}`, [ '-q', 'run', '--config', './src/bin/tsconfig.json', filepath ])
  
  child.stdout.setEncoding('utf-8')
  child.stdout.on('data', (data) => output += data)

  child.stderr.setEncoding('utf-8')
  child.stderr.on('data', (data) => output += data)

  child.on('exit', () => {
    output = sanitizeOutput(output)

    if (terminated) {
      const seconds = Math.round(Number(process.env.WAIT_TIME) / 1000)
      output += `\n[i] Automatically terminated after ${seconds} second${seconds > 1 ? 's' : ''}`
    }

    if (!output) {
      output = '[i] No output'
    }

    rmSync(filepath)
    clearTimeout(timeoutId)

    resolve(output)
  })

  timeoutId = setTimeout(() => {
    child.kill('SIGKILL')
    terminated = true
  }, Number(process.env.WAIT_TIME))
})

module.exports.prepareCode = prepareCode
module.exports.execute = execute