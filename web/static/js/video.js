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
    let myKlipContainer   = document.getElementById("my-klip-container")
    let allKlipsContainer = document.getElementById("all-klips-container")
    let klipInput         = document.getElementById("klip-input")
    let postButton        = document.getElementById("klip-submit")

    // maybe later change to aggChannel?
    let vidChannel        = socket.channel("videos:" + videoId)

    postButton.addEventListener("click", e => {
      let payload = {content: klipInput.value, at: Player.getCurrentTime()}
      vidChannel.push("new_klip", payload)
        .receive("error", e => console.log(e))
      klipInput.value = ""
    })

    myKlipContainer.addEventListener("click", e => {
      e.preventDefault()
      let seconds = e.target.getAttribute("data-seek") ||
                    e.target.parentNode.getAttribute("data-seek")
      if (!seconds) { return }
      Player.seekTo(seconds)
    })

    allKlipsContainer.addEventListener("click", e => {
      e.preventDefault()
      let seconds = e.target.getAttribute("data-seek") ||
                    e.target.parentNode.getAttribute("data-seek")
      if (!seconds) { return }
      Player.seekTo(seconds)
    })

    vidChannel.on("new_klip", (resp) => {
      vidChannel.params.last_seen_id = resp.id
      this.renderLiveKlip(myKlipContainer, resp)
    })

    vidChannel.join()
      .receive("ok", resp => {
        let ids = resp.klips.map(klip => klip.id)
        if (ids.length > 0) { vidChannel.params.last_seen_id = Math.max(...ids) }
        this.scheduleKlips(myKlipContainer, resp.klips)

        // display all klips in the navigator
        let i = 0
        for (i = 0; i < ids.length; i++) {
          this.renderNaviKlip(allKlipsContainer, resp.klips[i])
        }
      })
      .receive("error", reason => console.log("join failed", reason))
  },

  esc(str) {
    let div = document.createElement("div")
    div.appendChild(document.createTextNode(str))
    return div.innerHTML
  },

  renderLiveKlip(myKlipContainer, {user, content, at}) {
    let template = document.createElement("div")

    /* template.innerHTML = `*/
    myKlipContainer.innerHTML = `
    <div class="callout">
      <a href="#" data-seek="${this.esc(at)}">
        [${this.formatTime(at)}]
        <b>${this.esc(user.username)}</b>: ${this.esc(content)}
      </a>
    </div>
    `
    /* myKlipContainer.appendChild(template)*/
    /* myKlipContainer.scrollTop = myKlipContainer.scrollHeight*/
  },

  renderNaviKlip(allKlipsContainer, {user, content, at}) {
    let template = document.createElement("div")

    template.innerHTML = `
    <div class="callout">
      <a href="#" data-seek="${this.esc(at)}">
        [${this.formatTime(at)}]
        <b>${this.esc(user.username)}</b>: ${this.esc(content)}
      </a>
    </div>
    `
    allKlipsContainer.appendChild(template)
    allKlipsContainer.scrollTop = allKlipsContainer.scrollHeight
  },

  scheduleKlips(myKlipContainer, klips) {
    setTimeout(() => {
      let ctime = Player.getCurrentTime()
      let remaining = this.renderAtTime(klips, ctime, myKlipContainer)
      this.scheduleKlips(myKlipContainer, remaining)
    }, 1000)
  },

  renderAtTime(klips, seconds, myKlipContainer) {
    return klips.filter( klip => {
      if (klip.at > seconds) {
        return true
      } else {
        this.renderLiveKlip(myKlipContainer, klip)
        return false
      }
    })
  },

  formatTime(at) {
    let date = new Date(null)
    date.setSeconds(at / 1000)
    return date.toISOString().substr(14, 5)
  }

}
export default Video
