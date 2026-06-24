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
    expect(document.body.classList.contains('ui-active')).toBe(false)
    expect(eventBus.emit).toHaveBeenCalledWith('ui.idleStateChanged', { isIdle: true })

    controller.exitIdleState()

    expect(controller.isIdle).toBe(false)
    expect(document.body.classList.contains('ui-idle')).toBe(false)
    expect(document.body.classList.contains('ui-active')).toBe(true)
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
    expect(addEventListenerSpy).toHaveBeenCalledTimes(8)
    expect(addEventListenerSpy).toHaveBeenCalledWith('pointermove', expect.any(Function), {
      passive: true,
    })
    expect(addEventListenerSpy).toHaveBeenCalledWith('touchmove', expect.any(Function), {
      passive: true,
    })
    expect(controller.activityListeners).toHaveLength(8)

    controller.cleanupActivityDetection()
    expect(removeEventListenerSpy).toHaveBeenCalledTimes(8)
    expect(controller.activityListeners).toHaveLength(0)
    expect(controller.idleTimer).toBe(null)
  })

  it('keeps the UI active during touch movement', () => {
    controller.setupActivityDetection()
    controller.enterIdleState()

    document.dispatchEvent(new window.Event('touchmove'))

    expect(controller.isIdle).toBe(false)
    expect(document.body.classList.contains('ui-active')).toBe(true)
    expect(eventBus.emit).toHaveBeenCalledWith('ui.idleStateChanged', { isIdle: false })
  })

  it('can start in idle state when configured', () => {
    controller = new IdleController({
      eventBus,
      documentRef: document,
      timeoutMs: 4000,
      startIdle: true,
    })

    controller.setupActivityDetection()

    expect(controller.isIdle).toBe(true)
    expect(document.body.classList.contains('ui-idle')).toBe(true)
    expect(document.body.classList.contains('ui-active')).toBe(false)
  })
})
