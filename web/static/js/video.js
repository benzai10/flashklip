import Player from "./player"

let Video = {

  init(socket, element) { if (!element) { return }
    let playerId = element.getAttribute("data-player-id")
    let videoId = element.getAttribute("data-id")
    socket.connect()
    Player.init(element.id, playerId, () => {
      this.onReady(videoId, socket)
    })
  },

  onReady(videoId, socket) {
    let myKlipContainer = document.getElementById("my-klip-container")
    let klipInput       = document.getElementById("klip-input")
    let postButton       = document.getElementById("klip-submit")

    // maybe later change to aggChannel?
    let vidChannel      = socket.channel("videos:" + videoId)

    postButton.addEventListener("click", e => {
      let payload = {body: klipInput.value, at: Player.getCurrentTime()}
      vidChannel.push("new_klip", payload)
        .receive("error", e => console.log(e))
      klipInput.value = ""
    })

    vidChannel.on("new_klip", (resp) => {
      this.renderKlip(myKlipContainer, resp)
    })

    vidChannel.join()
      .receive("ok", resp => console.log("joined the video channel", resp))
      .receive("error", reason => console.log("join failed", reason))

    vidChannel.on("ping", ({count}) => console.log("PING", count))
  },

  esc(str) {
    let div = document.createElement("div")
    div.appendChild(document.createTextNode(str))
    return div.innerHTML
  },

  renderKlip(myKlipContainer, {user, body, at}) {
    let template = document.createElement("div")

    template.innerHTML = `
    <a href="#" data-seek="${this.esc(at)}">
      <b>${this.esc(user.username)}</b>: ${this.esc(body)}
    </a>
    `
    myKlipContainer.appendChild(template)
    myKlipContainer.scrollTop = myKlipContainer.scrollHeight
  }

}
export default Video
