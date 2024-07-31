// preload.js

import { BrandingMap, Config, IPCMainExposed, NotificationParams } from './types'

import { contextBridge, ipcRenderer } from 'electron'

/**
 * @public
 */
export function concatLink (host: string, path: string): string {
  if (!host.endsWith('/') && !path.startsWith('/')) {
    return `${host}/${path}`
  } else if (host.endsWith('/') && path.startsWith('/')) {
    const newPath = path.slice(1)
    return `${host}${newPath}`
  } else {
    return `${host}${path}`
  }
}

const openArg = (process.argv.find((it) => it.startsWith('--open=')) ?? '').split('--open=')[1]
console.log('Open passed', openArg)
let configPromise: Promise<Config> | undefined

const expose: IPCMainExposed = {
  setBadge: (badge: number) => {
    ipcRenderer.send('set-badge', badge)
  },
  setTitle: (title: string) => {
    ipcRenderer.send('set-title', title)
  },
  dockBounce: () => {
    ipcRenderer.send('dock-bounce')
  },
  sendNotification: (notificationParams: NotificationParams) => {
    ipcRenderer.send('send-notification', notificationParams)
  },

  config: async () => {
    if (configPromise === undefined) {
      configPromise = new Promise((resolve, reject) => {
        ipcRenderer.invoke('get-main-config').then(
          async (mainConfig) => {
            const serverConfig = await (await fetch(concatLink(mainConfig.FRONT_URL, mainConfig.CONFIG_URL))).json()
            const combinedConfig = {
              ...serverConfig,
              ...mainConfig,
              INITIAL_URL: openArg ?? '',
              UPLOAD_URL: concatLink(mainConfig.FRONT_URL, serverConfig.UPLOAD_URL),
              MODEL_VERSION: mainConfig.MODEL_VERSION,
              VERSION: mainConfig.VERSION
            }

            ipcRenderer.send('set-combined-config', combinedConfig)

            resolve(combinedConfig)
          },
          (err) => {
            reject(err)
          }
        )
      })
    }

    return await configPromise
  },
  branding: async () => {
    const cfg = await expose.config()
    const branding: BrandingMap = await (
      await fetch(cfg.BRANDING_URL ?? concatLink(cfg.FRONT_URL, 'branding.json'))
    ).json()
    const host = await ipcRenderer.invoke('get-host')
    return branding[host] ?? {}
  },
  on: (event: string, op: (...args: any[]) => void) => {
    ipcRenderer.on(event, (channel: any, args: any[]) => {
      console.log('on handle', args)
      op(channel, args)
    })
  },

  handleDeepLink: (callback) => {
    ipcRenderer.on('handle-deep-link', (event, value) => {
      try {
        if (typeof value === 'string' && value !== '') {
          callback(value)
        }
      } catch (e) {
        // Just do nothing. Nothing is ok if there is something with URL
      }
    })
    ipcRenderer.send('on-deep-link-handler')
  },

  handleNotificationNavigation: (callback) => {
    ipcRenderer.on('handle-notification-navigation', (event) => {
      callback()
    })
  },

  handleUpdateDownloadProgress: (callback) => {
    ipcRenderer.on('handle-update-download-progress', (event, value) => {
      callback(value)
    })
  },

  async setFrontCookie (host: string, name: string, value: string): Promise<void> {
    ipcRenderer.send('set-front-cookie', host, name, value)
  },

  getScreenAccess: () => ipcRenderer.invoke('get-screen-access'),
  getScreenSources: () => ipcRenderer.invoke('get-screen-sources')
}
contextBridge.exposeInMainWorld('electron', expose)