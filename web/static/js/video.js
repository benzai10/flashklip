import Player from "./player"

let Video = {

  currentLiveKlip: {},
  nextKlip: {},
  prevKlip: {},
  currentAllKlips: [],
  liveKlipTimer: {},
  userVideoId: 0,

  init(socket, element) { if (!element) { return }
    let playerId = element.getAttribute("data-player-id")
    let videoId = element.getAttribute("data-id")
    this.userVideoId = element.getAttribute("data-user-video-id")
    socket.connect()
    Player.init(element.id, playerId, () => {
      this.onReady(videoId, socket)
    })
  },

  onReady(videoId, socket) {
    let myKlipContainer   = document.getElementById("my-klip-container")
    let allKlipsContainer = document.getElementById("all-klips-container")
    let addKlipTab        = document.getElementById("add-klip-tab")
    let klipInput         = document.getElementById("klip-input")
    let postButton        = document.getElementById("klip-submit")
    let deleteButton      = document.getElementById("klip-delete")
    let editButton        = document.getElementById("klip-edit")
    let cancelEditButton  = document.getElementById("klip-cancel-edit")
    let updateButton      = document.getElementById("klip-update")
    let editTsBack        = document.getElementById("klip-edit-ts-back")
    let editTsForward     = document.getElementById("klip-edit-ts-forward")
    let editTsDisplay     = document.getElementById("klip-edit-ts-display")
    let newTsBack         = document.getElementById("klip-new-ts-back")
    let newTsForward      = document.getElementById("klip-new-ts-forward")
    let newTsDisplay      = document.getElementById("klip-new-ts-display")
    let nextKlip          = document.getElementById("klip-next")
    let prevKlip          = document.getElementById("klip-prev")

    let saveAt            = 0


    // maybe later change to aggChannel?
    let vidChannel        = socket.channel("videos:" + videoId)

    addKlipTab.addEventListener("click", e => {
      saveAt = Player.getCurrentTime()
      newTsDisplay.innerHTML = `[${this.formatTime(saveAt)}]`
    })

    postButton.addEventListener("click", e => {
      let payload = {content: klipInput.value, at: saveAt, user_video_id: this.userVideoId}
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
      nextKlip.className += " invisible"
      prevKlip.className += " invisible"
      document.getElementById("my-edit-container").classList.remove("hide")
      document.getElementById("klip-cancel-edit").classList.remove("hide")
    })

    cancelEditButton.addEventListener("click", e => {
      document.getElementById("my-edit-container").className += " hide"
      document.getElementById("klip-cancel-edit").className += " hide"
      document.getElementById("my-klip-container").classList.remove("hide")
      document.getElementById("klip-edit").classList.remove("hide")
      nextKlip.classList.remove("invisible")
      prevKlip.classList.remove("invisible")

      // restart liveKlipTimer
      this.scheduleKlips(myKlipContainer, this.currentAllKlips)
    })

    editTsBack.addEventListener("click", e => {
      e.preventDefault()
      this.currentLiveKlip.at -= 1000
      Player.seekTo(this.currentLiveKlip.at)
      editTsDisplay.innerHTML = `[${this.formatTime(this.currentLiveKlip.at)}]`
    })

    editTsForward.addEventListener("click", e => {
      e.preventDefault()
      this.currentLiveKlip.at -= -1000
      Player.seekTo(this.currentLiveKlip.at)
      editTsDisplay.innerHTML = `[${this.formatTime(this.currentLiveKlip.at)}]`
    })

    editTsDisplay.addEventListener("click", e => {
      e.preventDefault()
      Player.seekTo(this.currentLiveKlip.at)
    })

    newTsBack.addEventListener("click", e => {
      e.preventDefault()
      saveAt -= 1000
      Player.seekTo(saveAt)
      newTsDisplay.innerHTML = `[${this.formatTime(saveAt)}]`
    })

    newTsForward.addEventListener("click", e => {
      e.preventDefault()
      saveAt -= -1000
      Player.seekTo(saveAt)
      newTsDisplay.innerHTML = `[${this.formatTime(saveAt)}]`
    })

    newTsDisplay.addEventListener("click", e => {
      e.preventDefault()
      Player.seekTo(saveAt)
    })

    nextKlip.addEventListener("click", e => {
      Player.seekTo(this.nextKlip.at)
    })

    prevKlip.addEventListener("click", e => {
      Player.seekTo(this.prevKlip.at)
    })

    myKlipContainer.addEventListener("click", e => {
      e.preventDefault()
      let seconds = e.target.getAttribute("data-seek") ||
                    e.target.parentNode.getAttribute("data-seek") ||
                    e.target.parentNode.parentNode.getAttribute("data-seek")
      if (!seconds) { return }
      Player.seekTo(seconds)
    })

    allKlipsContainer.addEventListener("click", e => {
      e.preventDefault()
      let seconds = e.target.getAttribute("data-seek") ||
                    e.target.parentNode.getAttribute("data-seek") ||
                    e.target.parentNode.parentNode.getAttribute("data-seek")
      console.log(seconds)
      if (!seconds) { return }
      Player.seekTo(seconds)
    })

    vidChannel.on("new_klip", (resp) => {
      vidChannel.params.last_seen_id = resp.id
      this.renderLiveKlip(myKlipContainer, resp)

      // switch to timeview tab
      /* $('#live').foundation('selectTab', live)*/
      $('#timeview-tab').trigger("click");

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
        allKlipsContainer.scrollTop = 0
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
    <a href="#" data-seek="${this.esc(at)}">
      <div class="callout klip-callout">
        <p>${this.esc(content)}</p>
        <hr>
        <span class="timestamp">
            [${this.formatTime(at)}]
        </span>
        <span class="username float-right">
          by ${this.esc(user.username)}
        </span>
      </div>
    </a>
    `
    document.getElementById("klip-delete").classList.remove("hide")
    document.getElementById("klip-edit").classList.remove("hide")
    document.getElementById("klip-input-edit").value = this.esc(content)

    let timestampDisplay = document.getElementById("klip-edit-ts-display")
    timestampDisplay.innerHTML = `
    [${this.formatTime(at)}]
    `
  },

  renderNaviKlip(allKlipsContainer, {id, user, content, at}) {
    let template = document.createElement("div")
    template.setAttribute("id", "klip-id-" + id)

    template.innerHTML = `
    <a href="#" data-seek="${this.esc(at)}">
      <div class="callout klip-callout">
        <p>${this.esc(content)}</p>
        <hr>
        <span class="timestamp">
            [${this.formatTime(at)}]
        </span>
        <span class="username float-right">
          by ${this.esc(user.username)}
        </span>
      </div>
    </a>
    `
    allKlipsContainer.appendChild(template)
    allKlipsContainer.scrollTop = allKlipsContainer.scrollHeight
  },

  scheduleKlips(myKlipContainer, klips) {
    // get last klip before current time and display it
    this.liveKlipTimer = setTimeout(() => {
      let ctime = Player.getCurrentTime()
      let liveKlip = {}
      this.nextKlip = klips.filter( klip => {
        if (klip.at > ctime) {
          return true
        }
      }).slice(0,1)[0]
      if (this.nextKlip) {
        document.getElementById("klip-next").classList.remove("disabled")
      } else {
        document.getElementById("klip-next").classList.remove("disabled")
        document.getElementById("klip-next").className += " disabled"
      }
      let lastTwoKlips = klips.filter( klip => {
        if (klip.at < ctime) {
          return true
        }
      }).slice(-2)
      if (lastTwoKlips.length > 1) {
        this.prevKlip = lastTwoKlips[0]
        liveKlip = lastTwoKlips[1]
      } else {
        this.prevKlip = null
        liveKlip = lastTwoKlips[0]
      }
      if (this.prevKlip) {
        document.getElementById("klip-prev").classList.remove("disabled")
      } else {
        document.getElementById("klip-prev").classList.remove("disabled")
        document.getElementById("klip-prev").className += " disabled"
      }
      if (liveKlip) {
        this.currentLiveKlip = liveKlip
        this.renderLiveKlip(myKlipContainer, liveKlip)
      } else {
        document.getElementById("my-klip-container").innerHTML = ""
        document.getElementById("klip-edit").className += " hide"
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
