export class IdleController {
  constructor({ eventBus, documentRef = document, timeoutMs = 4000, startIdle = false } = {}) {
    this.eventBus = eventBus
    this.document = documentRef
    this.timeoutMs = timeoutMs
    this.startIdle = startIdle
    this.isIdle = false
    this.idleTimer = null
    this.activityListeners = []
    this.lastActivityTime = Date.now()
  }

  enterIdleState() {
    this.isIdle = true
    this.document.body.classList.add('ui-idle')
    this.document.body.classList.remove('ui-active')
    this.eventBus?.emit('ui.idleStateChanged', { isIdle: true })
  }

  exitIdleState() {
    if (this.isIdle) {
      this.isIdle = false
      this.eventBus?.emit('ui.idleStateChanged', { isIdle: false })
    }

    this.document.body.classList.remove('ui-idle')
    this.document.body.classList.add('ui-active')
    this.resetIdleTimer()
  }

  resetIdleTimer() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer)
    }

    this.idleTimer = setTimeout(() => {
      this.enterIdleState()
    }, this.timeoutMs)
  }

  handleActivity() {
    if (this.isIdle) {
      this.exitIdleState()
    } else {
      this.resetIdleTimer()
    }

    this.lastActivityTime = Date.now()
  }

  setupActivityDetection() {
    const events = [
      'mousemove',
      'mousedown',
      'pointermove',
      'pointerdown',
      'touchstart',
      'touchmove',
      'keydown',
      'click',
    ]
    events.forEach((eventName) => {
      const listener = (event) => this.handleActivity(event)
      this.document.addEventListener(eventName, listener, { passive: true })
      this.activityListeners.push({ eventName, listener })
    })

    if (this.startIdle) {
      this.enterIdleState()
    } else {
      this.resetIdleTimer()
    }
  }

  cleanupActivityDetection() {
    this.activityListeners.forEach(({ eventName, listener }) => {
      this.document.removeEventListener(eventName, listener)
    })
    this.activityListeners = []

    if (this.idleTimer) {
      clearTimeout(this.idleTimer)
      this.idleTimer = null
    }
  }
}
