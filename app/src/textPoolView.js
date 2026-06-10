import { eventBus } from './eventBus.js'
import { stateManager } from './stateManager.js'
import { toastManager } from './toastManager.js'
import { STRINGS, t } from './constants/strings.js'

export class TextPoolView {
  constructor({
    textInput,
    addTextBtn,
    textPoolDisplay,
    textPoolEmpty,
    clearTextBtn,
    textPoolFooter,
    textFrequencySlider,
  }) {
    this.textInput = textInput
    this.addTextBtn = addTextBtn
    this.textPoolDisplay = textPoolDisplay
    this.textPoolEmpty = textPoolEmpty
    this.clearTextBtn = clearTextBtn
    this.textPoolFooter = textPoolFooter
    this.textFrequencySlider = textFrequencySlider
    this.textPillElements = new Map()
    this.onFrequencyChanged = (event) => this.updateFrequencyDisplay(event.frequency)
  }

  setupTextPoolListeners() {
    this.addTextBtn.addEventListener('click', () => this.handleAddText())

    this.textInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        this.handleAddText()
      }
    })

    this.clearTextBtn.addEventListener('click', () => this.handleClearAll())
    this.initializeTextPoolDisplay()
  }

  initializeTextPoolDisplay() {
    this.renderTextPoolDisplay(stateManager.getTextPool())
  }

  handleAddText() {
    const text = this.textInput.value.trim()

    if (!text) {
      toastManager.error(STRINGS.USER_MESSAGES.notifications.textPool.emptyInputWarning)
      return
    }

    if (text.length > 200) {
      toastManager.error(STRINGS.USER_MESSAGES.notifications.textPool.tooLongWarning)
      return
    }

    if (stateManager.addText(text)) {
      this.textInput.value = ''
      this.textInput.focus()
      toastManager.success(STRINGS.USER_MESSAGES.notifications.textPool.textAdded)
    }
  }

  handleTextPoolUpdate(event) {
    const { action, text, textPool } = event

    switch (action) {
      case 'added':
        this.addTextPill(text)
        break
      case 'removed':
        this.removeTextPill(text)
        break
      case 'cleared':
        this.clearTextPoolDisplay()
        break
      default:
        this.renderTextPoolDisplay(textPool)
    }
  }

  handleTextPoolSizeChange(event) {
    const { newSize } = event

    this.updateClearAllVisibility(newSize)

    if (newSize === 0) {
      this.showEmptyState()
    } else {
      this.hideEmptyState()
    }
  }

  renderTextPoolDisplay(textPool) {
    this.textPoolDisplay.innerHTML = ''
    this.textPillElements.clear()

    this.updateClearAllVisibility(textPool.length)

    if (textPool.length === 0) {
      this.showEmptyState()
      return
    }

    this.hideEmptyState()

    textPool.forEach((text, index) => {
      const pill = this.createTextPill(text, index)
      this.textPoolDisplay.appendChild(pill)
      this.textPillElements.set(index, pill)
    })
  }

  createTextPill(text, index = null) {
    const pill = document.createElement('div')
    pill.className = 'text-pill entering'
    pill.dataset.text = text
    pill.title = text
    if (index !== null) {
      pill.dataset.index = index
    }

    const content = document.createElement('span')
    content.className = 'text-pill-content'
    content.textContent = text

    const deleteBtn = document.createElement('button')
    deleteBtn.className = 'btn btn--icon-small btn--danger delete-text-btn'
    deleteBtn.innerHTML = '&times;'
    deleteBtn.title = STRINGS.USER_INTERFACE.textPool.deleteButtonTitle
    deleteBtn.setAttribute(
      'aria-label',
      t.get('USER_INTERFACE.textPool.deleteButtonAriaLabel', { text })
    )

    deleteBtn.addEventListener('click', (event) => {
      event.stopPropagation()
      this.handleRemoveText(text)
    })

    deleteBtn.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        deleteBtn.click()
      }
    })

    pill.appendChild(content)
    pill.appendChild(deleteBtn)

    content.addEventListener('click', () => {
      content.classList.toggle('expanded')
    })

    setTimeout(() => {
      pill.classList.remove('entering')
    }, 300)

    return pill
  }

  addTextPill(text) {
    this.hideEmptyState()

    const textPool = stateManager.getTextPool()
    const index = textPool.length - 1
    const pill = this.createTextPill(text, index)
    this.textPoolDisplay.appendChild(pill)
    this.textPillElements.set(index, pill)

    this.textPoolDisplay.parentElement.scrollTop = this.textPoolDisplay.parentElement.scrollHeight
  }

  removeTextPill(text) {
    let pillToRemove = null
    let indexToRemove = null

    for (const [index, pill] of this.textPillElements.entries()) {
      if (pill.dataset.text === text) {
        pillToRemove = pill
        indexToRemove = index
        break
      }
    }

    if (!pillToRemove) {
      const domPills = this.textPoolDisplay.querySelectorAll('.text-pill')
      for (const pill of domPills) {
        if (pill.dataset.text === text) {
          pillToRemove = pill
          break
        }
      }
    }

    if (!pillToRemove) return

    const deleteBtn = pillToRemove.querySelector('.delete-text-btn')
    if (deleteBtn) {
      deleteBtn.classList.add('deleting')
    }

    pillToRemove.classList.add('leaving')

    setTimeout(() => {
      if (pillToRemove.parentElement) {
        pillToRemove.parentElement.removeChild(pillToRemove)
      }

      if (indexToRemove !== null) {
        this.textPillElements.delete(indexToRemove)
      }

      const remainingPills = this.textPoolDisplay.querySelectorAll('.text-pill').length
      if (remainingPills === 0) {
        this.showEmptyState()
        this.updateClearAllVisibility(0)
      }
    }, 200)
  }

  clearTextPoolDisplay() {
    const pills = Array.from(this.textPillElements.values())

    if (pills.length === 0) {
      this.showEmptyState()
      this.updateClearAllVisibility(0)
      return
    }

    pills.forEach((pill, index) => {
      setTimeout(() => {
        pill.classList.add('leaving')
      }, index * 50)
    })

    const totalAnimationTime = pills.length * 50 + 200
    setTimeout(() => {
      this.textPoolDisplay.innerHTML = ''
      this.textPillElements.clear()
      this.showEmptyState()
      this.updateClearAllVisibility(0)
    }, totalAnimationTime)
  }

  handleRemoveText(text) {
    if (stateManager.removeText(text)) {
      const truncatedText = text.substring(0, 30) + (text.length > 30 ? '...' : '')
      toastManager.show(
        t.get('USER_MESSAGES.notifications.textPool.textRemoved', { text: truncatedText }),
        { type: 'info' }
      )
    } else {
      toastManager.error(STRINGS.USER_MESSAGES.notifications.textPool.textRemovalFailed)
    }
  }

  handleClearAll() {
    const textPoolSize = stateManager.getTextPoolSize()

    if (textPoolSize === 0) {
      toastManager.show(STRINGS.USER_MESSAGES.notifications.textPool.poolAlreadyEmpty, {
        type: 'info',
      })
      return
    }

    if (textPoolSize > 5) {
      const confirmed = window.confirm(
        t.get('USER_MESSAGES.notifications.textPool.confirmClearAll', { count: textPoolSize })
      )
      if (!confirmed) {
        return
      }
    }

    if (stateManager.clearTextPool()) {
      toastManager.success(
        t.get('USER_MESSAGES.notifications.textPool.poolCleared', { count: textPoolSize })
      )
    } else {
      toastManager.error(STRINGS.USER_MESSAGES.notifications.textPool.poolClearFailed)
    }
  }

  updateClearAllVisibility(poolSize) {
    if (poolSize > 0) {
      this.clearTextBtn.style.display = 'block'
      this.textPoolFooter.classList.remove('hidden')
    } else {
      this.clearTextBtn.style.display = 'none'
      this.textPoolFooter.classList.add('hidden')
    }
  }

  showEmptyState() {
    this.textPoolEmpty.style.display = 'block'
    this.textPoolDisplay.style.display = 'none'
  }

  hideEmptyState() {
    this.textPoolEmpty.style.display = 'none'
    this.textPoolDisplay.style.display = 'flex'
  }

  setupFrequencyControlListeners() {
    this.textFrequencySlider.addEventListener('input', () => {
      this.handleFrequencyChange()
    })

    this.textFrequencySlider.addEventListener('change', (event) => {
      const frequency = parseFloat(event.target.value)
      this.handleFrequencyChangeComplete(frequency)
    })

    eventBus.on('textPool.frequencyChanged', this.onFrequencyChanged)

    this.textFrequencySlider.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault()
        const currentFrequency = parseFloat(this.textFrequencySlider.value)
        const delta = event.key === 'ArrowRight' ? 0.25 : -0.25
        const newFrequency = Math.max(0, Math.min(1, currentFrequency + delta))

        this.textFrequencySlider.value = newFrequency
        this.handleFrequencyChange()
        this.handleFrequencyChangeComplete(newFrequency)
      }
    })
  }

  initializeFrequencyControl() {
    const currentFrequency = stateManager.getTextFrequency()
    this.textFrequencySlider.value = currentFrequency
    this.updateFrequencyDisplay(currentFrequency)
  }

  handleFrequencyChange() {
    // No immediate visual feedback needed for simplified slider.
  }

  handleFrequencyChangeComplete(frequency) {
    stateManager.setTextFrequency(frequency)
  }

  updateFrequencyDisplay(frequency) {
    this.textFrequencySlider.value = frequency
  }

  cleanup() {
    eventBus.off('textPool.frequencyChanged', this.onFrequencyChanged)
  }
}
