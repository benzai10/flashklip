import MainView from '../main';

export default class View extends MainView {
  mount() {
    super.mount();

    // Specific logic here
    console.log('PageNewView mounted')

    let tagList = document.getElementById("tags-input").getAttribute("data-tags")
    if (tagList.length > 0) {
      new Taggle('tags-input', {
        placeholder: 'Type some tags, hit <Enter> to add a tag',
        tags: tagList.split(",")
      })
    } else {
      new Taggle('tags-input', {
        placeholder: 'Type some tags, hit <Enter> to add a tag'
      })
    }
  }

  unmount() {
    super.unmount();

    // Specific logic here
    console.log('PageNewView unmounted');
  }
}
