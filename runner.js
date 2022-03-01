const { spawn } = require('child_process')
const { writeFileSync, rmSync } = require('fs')

const generateRandomFilename = (e) => Math.random().toString(36).substring(2)

const execute = (code, extension) => new Promise((res) => {
  const filename = `${generateRandomFilename(extension)}.${extension}`
  const filepath = `./temp/${filename}`

  writeFileSync(filepath, code, { encoding: 'utf-8' })

  // For logging and debugging purposes
  // const info = (...msg) => console.log(`[i](${filename}) ${msg.join(' ')}`)
  const info = () => {}

  let timeoutId = -1
  let output = ''
  let terminated = false

  const cleanup = () => {
    rmSync(filepath)
    clearTimeout(timeoutId)
  }
  
  const resolve = () => {
    // Basic string sanitization
    output = 
      output
        .substring(0, 1500)
        .replaceAll('@', String.fromCharCode(92) + '@')
        .replaceAll('`', '')

    // Remove ASCII colors
    output = output.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '')

    if (terminated) {
      output += '\n[i] Automatically terminated after 5 seconds'
    }

    cleanup()
    res(output)
  }
  
  const denoBinary = process.platform.includes('win') ? 'deno.exe' : 'deno'
  const child = spawn(`./bin/${denoBinary}`, ['-q', 'run', '--config', './bin/tsconfig.json', filepath])
  
  child.stdout.setEncoding('utf-8')
  child.stdout.on('data', (data) => output += data)

  child.stderr.setEncoding('utf-8')
  child.stderr.on('data', (data) => output += data)

  child.on('exit', resolve)

  timeoutId = setTimeout(() => {
    child.kill('SIGKILL')
    terminated = true
  }, 5000)
})

module.exports.execute = execute