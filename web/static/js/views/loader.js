import MainView    from './main'
import PageIndexView from './page/index'
import VideoNewView from './video/new'
import VideoEditView from './video/edit'
import SessionNewView from './session/new'

// Collection of specific view modules
const views = {
  PageIndexView,
  VideoNewView,
  VideoEditView,
  SessionNewView,
}

export default function loadView(viewName) {
  return views[viewName] || MainView
}
