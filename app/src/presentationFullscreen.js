/**
 * Minimal presentation fullscreen helper.
 *
 * This intentionally does not track fullscreen state. Browser-native escape,
 * menus, and platform controls own exit behavior; the app only requests the
 * deepest fullscreen available for projection/presentation use.
 */
export async function requestPresentationFullscreen(target = document.documentElement) {
  if (!target || typeof target.requestFullscreen !== 'function') {
    throw new Error('Presentation fullscreen is not supported in this browser')
  }

  try {
    await target.requestFullscreen({ navigationUI: 'hide' })
  } catch (error) {
    if (error instanceof TypeError) {
      await target.requestFullscreen()
      return
    }

    throw error
  }
}
