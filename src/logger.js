const fs = require('fs')
const { generateRandomString } = require('./util.js')

const getTodaysDate = () => {
  const d = new Date()

  let dd = d.getDate()
  dd = dd > 9 ? dd : `0${dd}`
  
  let mm = d.getMonth() + 1
  mm = mm > 9 ? mm : `0${mm}`

  let yyyy = d.getFullYear()

  return `${dd}-${mm}-${yyyy}`
}

const log = (author, channel, input, output) => {
  const out = {
    author,
    channel,
    input,
    output,
    date: getTodaysDate(),
  }

  console.log(out)
}

module.exports.log = log