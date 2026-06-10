import { beforeEach, describe, expect, it, vi } from 'vitest'
import { IdleController } from './idleController.js'

describe('IdleController', () => {
  let eventBus
  let controller

  beforeEach(() => {
    vi.useFakeTimers()
    document.body.innerHTML = ''
    eventBus = { emit: vi.fn() }
    controller = new IdleController({ eventBus, documentRef: document, timeoutMs: 4000 })
  })

  it('enters and exits idle state', () => {
    controller.enterIdleState()

    expect(controller.isIdle).toBe(true)
    expect(document.body.classList.contains('ui-idle')).toBe(true)
    expect(eventBus.emit).toHaveBeenCalledWith('ui.idleStateChanged', { isIdle: true })

    controller.exitIdleState()

    expect(controller.isIdle).toBe(false)
    expect(document.body.classList.contains('ui-idle')).toBe(false)
    expect(eventBus.emit).toHaveBeenCalledWith('ui.idleStateChanged', { isIdle: false })
  })

  it('enters idle after the timeout', () => {
    controller.resetIdleTimer()
    vi.advanceTimersByTime(4000)

    expect(controller.isIdle).toBe(true)
  })

  it('tracks document activity listeners and removes them', () => {
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener')
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener')

    controller.setupActivityDetection()
    expect(addEventListenerSpy).toHaveBeenCalledTimes(4)
    expect(controller.activityListeners).toHaveLength(4)

    controller.cleanupActivityDetection()
    expect(removeEventListenerSpy).toHaveBeenCalledTimes(4)
    expect(controller.activityListeners).toHaveLength(0)
    expect(controller.idleTimer).toBe(null)
  })
})
