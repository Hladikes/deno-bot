class Limiter {
  constructor(limit) {
    this.limit = limit
    this.currentCount = 0
  }

  run(cb) {
    if (this.limit === this.currentCount) {
      return false
    }

    this.currentCount++

    cb(() => {
      this.currentCount--
    })

    return true
  }
}

module.exports.Limiter = Limiter