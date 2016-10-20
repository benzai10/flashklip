import Player from "./player"

let Video = {

  currentLiveKlip: {},
  currentAllKlips: [],
  liveKlipTimer: {},

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
    let deleteButton      = document.getElementById("klip-delete")
    let editButton        = document.getElementById("klip-edit")
    let cancelEditButton  = document.getElementById("klip-cancel-edit")
    let updateButton      = document.getElementById("klip-update")


    // maybe later change to aggChannel?
    let vidChannel        = socket.channel("videos:" + videoId)

    postButton.addEventListener("click", e => {
      let payload = {content: klipInput.value, at: Player.getCurrentTime()}
      vidChannel.push("new_klip", payload)
        .receive("error", e => console.log(e))
      klipInput.value = ""
    })

    deleteButton.addEventListener("click", e => {
      clearTimeout(this.liveKlipTimer)
      let conf = confirm("Are you sure?")
      if (conf == true) {
        let payload = {
          id: this.currentLiveKlip.id
        }
        vidChannel.push("delete_klip", payload)
          .receive("error", e => console.log(e) )
        // restart liveKlipTimer
        this.scheduleKlips(myKlipContainer, this.currentAllKlips)
      } else
      {
        return
      }
    })

    updateButton.addEventListener("click", e => {
      let payload = {
        id: this.currentLiveKlip.id,
        at: this.currentLiveKlip.at,
        content: document.getElementById("klip-input-edit").value
      }
      vidChannel.push("update_klip", payload)
        .receive("error", e => console.log(e) )
      document.getElementById("my-edit-container").className += " hide"
      document.getElementById("klip-cancel-edit").className += " hide"
      document.getElementById("my-klip-container").classList.remove("hide")
      document.getElementById("klip-edit").classList.remove("hide")
      this.currentAllKlips.forEach( klip => {
        if (klip.id == payload.id) {
          klip.at = payload.at,
          klip.content = payload.content
        }
      })
      // restart liveKlipTimer
      this.scheduleKlips(myKlipContainer, this.currentAllKlips)
    })

    editButton.addEventListener("click", e => {
      clearTimeout(this.liveKlipTimer)
      document.getElementById("my-klip-container").className += " hide"
      document.getElementById("klip-edit").className += " hide"
      document.getElementById("my-edit-container").classList.remove("hide")
      document.getElementById("klip-cancel-edit").classList.remove("hide")
    })

    cancelEditButton.addEventListener("click", e => {
      document.getElementById("my-edit-container").className += " hide"
      document.getElementById("klip-cancel-edit").className += " hide"
      document.getElementById("my-klip-container").classList.remove("hide")
      document.getElementById("klip-edit").classList.remove("hide")

      // restart liveKlipTimer
      this.scheduleKlips(myKlipContainer, this.currentAllKlips)
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

      // *** quick hack

      // sort klips (asc: at) and delete current klipContainer
      this.currentAllKlips.push(resp)
      this.currentAllKlips.sort( (a,b) => {return (a.at > b.at) ? 1 : ((b.at > a.at) ? -1 : 0);});

      allKlipsContainer.innerHTML = ""
      // display all klips in the navigator
      let i = 0
      for (i = 0; i < this.currentAllKlips.length; i++) {
        this.renderNaviKlip(allKlipsContainer, this.currentAllKlips[i])
      }

      // *** end quick hack
    })

    vidChannel.on("update_klip", (resp) => {
      this.renderLiveKlip(myKlipContainer, resp)

      this.currentAllKlips = this.currentAllKlips.filter( klip => {
        return klip.id != resp.id
      })
      this.currentAllKlips.push(resp)
      this.currentAllKlips.sort( (a,b) => {return (a.at > b.at) ? 1 : ((b.at > a.at) ? -1 : 0);});

      allKlipsContainer.innerHTML = ""
      // display all klips in the navigator
      let i = 0
      for (i = 0; i < this.currentAllKlips.length; i++) {
        this.renderNaviKlip(allKlipsContainer, this.currentAllKlips[i])
      }
    })

    vidChannel.on("delete_klip", (resp) => {
      // remove deleted klip from array
      this.currentAllKlips = this.currentAllKlips.filter( klip => {
        return klip.id != resp.id
      })

      // remove deleted klip from navi container
      let deletedKlip = document.getElementById("klip-id-" + resp.id)
      deletedKlip.parentElement.removeChild(deletedKlip)

      // remove deleted klip from live container
      myKlipContainer.innerHTML = ""
      document.getElementById("klip-delete").className += " hide"
      document.getElementById("klip-edit").className += " hide"
      document.getElementById("klip-cancel-edit").className += " hide"
      document.getElementById("my-edit-container").className += " hide"
    })

    vidChannel.join()
      .receive("ok", resp => {

        // this is from the phoenix book to prevent rerendering of
        // already displayed klips after loosing connection
        // TODO: check if still needed

        /* let ids = resp.klips.map(klip => klip.id)*/
        /* if (ids.length > 0) { vidChannel.params.last_seen_id = Math.max(...ids) }*/

        this.currentAllKlips = resp.klips
        this.scheduleKlips(myKlipContainer, this.currentAllKlips)

        // display all klips in the navigator
        let i = 0
        for (i = 0; i < this.currentAllKlips.length; i++) {
          this.renderNaviKlip(allKlipsContainer, this.currentAllKlips[i])
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

    myKlipContainer.innerHTML = `
    <div class="callout">
      <a href="#" data-seek="${this.esc(at)}">
        [${this.formatTime(at)}]
        <b>${this.esc(user.username)}</b>: ${this.esc(content)}
      </a>
    </div>
    `
    document.getElementById("klip-delete").classList.remove("hide")
    document.getElementById("klip-edit").classList.remove("hide")
    document.getElementById("klip-input-edit").value = this.esc(content)
  },

  renderNaviKlip(allKlipsContainer, {id, user, content, at}) {
    let template = document.createElement("div")
    template.setAttribute("id", "klip-id-" + id)

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
    // get last klip before current time and display it
    this.liveKlipTimer = setTimeout(() => {
      let ctime = Player.getCurrentTime()
      let liveKlip = klips.filter( klip => {
        if (klip.at < ctime) {
          return true
        }}).slice(-1)[0]
      if (liveKlip) {
        this.currentLiveKlip = liveKlip
        this.renderLiveKlip(myKlipContainer, liveKlip)
      } else {
        document.getElementById("my-klip-container").innerHTML = ""
        document.getElementById("klip-delete").className += " hide"
      }
      this.scheduleKlips(myKlipContainer, this.currentAllKlips)
    }, 1000)
  },

  formatTime(at) {
    let date = new Date(null)
    date.setSeconds(at / 1000)
    return date.toISOString().substr(14, 5)
  }

}
export default Video
