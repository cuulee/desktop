const { DocumentPage, getQueryStringParam } = window.stencila
const backend = require('../shared/fileSystemBackend')

const remote = require('electron').remote
const { Menu } = remote
const ipc = require('electron').ipcRenderer
const DocumentMenuBuilder = require('./DocumentMenuBuilder')
const currentWindow = remote.getCurrentWindow()
const windowId = currentWindow.id
const documentMenuBuilder = new DocumentMenuBuilder()
const AppState = require('./AppState')

let appState = new AppState()

function _updateMenu() {
  let menu = documentMenuBuilder.build(appState)
  Menu.setApplicationMenu(menu)
}

appState.on('change', () => {
  _updateMenu(appState)
  let title = appState.get('title')
  if (appState.get('hasPendingChanges')) {
    title += ' *'
  }
  window.document.title = title
})

currentWindow.on('focus', () => {
  _updateMenu(appState)

  ipc.send('windowFocused', {
    windowId: windowId,
    data: 'dashboard'
  })
})

ipc.on('command:executed', function(sender, data) {
  window.documentPage.executeCommand(data.commandName, data.commandParams)
})

ipc.on('save:requested', function() {
  window.documentPage.save()
})

_updateMenu(appState)

window.addEventListener('load', () => {
  let documentId = getQueryStringParam('documentId')
  window.documentPage = DocumentPage.mount({
    backend,
    appState,
    documentId
  }, window.document.body)

  window.documentPage.on('loaded', () => {
    window.document.title = window.documentPage.getTitle()
  })
})
