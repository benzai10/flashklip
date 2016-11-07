import MainView from '../main';

export default class View extends MainView {
  mount() {
    super.mount();

    // Specific logic here
    console.log('PageNewView mounted')

    let username = document.getElementById("nav-username")

    if (username && username.innerText == "") {
      $('#usernameModal').foundation('open')
    }
  }

  unmount() {
    super.unmount();

    // Specific logic here
    console.log('PageNewView unmounted');
  }
}
