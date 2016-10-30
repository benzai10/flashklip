import Player from "./player"

let Video = {

  currentLiveKlip: {},
  jumpedKlip: false,
  nextKlip: {},
  prevKlip: {},
  currentAllKlips: [],
  allKlips: [],
  liveKlipTimer: {},
  userVideoId: 0,
  overviewAll: true,
  currentUserId: 0,

  init(socket, element) { if (!element) { return }
    let playerId = element.getAttribute("data-player-id")
    let videoId = element.getAttribute("data-id")
    this.userVideoId = element.getAttribute("data-user-video-id")
    this.currentUserId = element.getAttribute("data-user-id")
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
    let switchOverview    = document.getElementById("overview-switch")
    let overviewTitle     = document.getElementById("overview-title")
    let saveAt            = 0


    // maybe later change to aggChannel?
    let vidChannel        = socket.channel("videos:" + videoId)

    switchOverview.addEventListener("click", e => {
      if (overviewTitle.innerHTML == "ALL KLIPS") {
        // filter only own klips
        let userKlips = this.allKlips.filter( klip => {
          if (klip.user.id == this.currentUserId) {
            return true}
        })
        this.currentAllKlips = userKlips
        this.currentAllKlips.sort( (a,b) => {return (a.at > b.at) ? 1 : ((b.at > a.at) ? -1 : 0);});
        // refresh overview
        allKlipsContainer.innerHTML = ""
        // display all klips in the navigator
        let i = 0
        for (i = 0; i < this.currentAllKlips.length; i++) {
          this.renderNaviKlip(allKlipsContainer, this.currentAllKlips[i])
        }
        this.addNaviEventListeners(vidChannel)
        overviewTitle.innerHTML = "MY KLIPS"
      } else {
        overviewTitle.innerHTML = "ALL KLIPS"
        this.currentAllKlips = this.allKlips

        // filter out original klips where a copy exists
        let copiedKlips = new Array

        for(var k in this.currentAllKlips)
          {if (this.currentAllKlips[k].copy_from > 0) {
            copiedKlips.push(this.currentAllKlips[k].copy_from)
          }}

        this.currentAllKlips = this.currentAllKlips.filter(klip => {
          if(!copiedKlips.includes(klip.id)) {
            return true
          }
        })
        this.currentAllKlips.sort( (a,b) => {return (a.at > b.at) ? 1 : ((b.at > a.at) ? -1 : 0);});

        // refresh overview
        allKlipsContainer.innerHTML = ""
        // display all klips in the navigator
        let i = 0
        for (i = 0; i < this.currentAllKlips.length; i++) {
          this.renderNaviKlip(allKlipsContainer, this.currentAllKlips[i])
        }
        this.addNaviEventListeners(vidChannel)
      }
    })

    addKlipTab.addEventListener("click", e => {
      saveAt = Player.getCurrentTime()
      if (saveAt < 1000) {
        newTsBack.className += " disabled"
      } else {
        newTsBack.classList.remove("disabled")
      }

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
      nextKlip.classList.remove("invisible")
      prevKlip.classList.remove("invisible")
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
      if (this.currentLiveKlip.at < 1000) {
        editTsBack.className += " disabled"
      }
      Player.seekTo(this.currentLiveKlip.at)
      editTsDisplay.innerHTML = `[${this.formatTime(this.currentLiveKlip.at)}]`
    })

    editTsForward.addEventListener("click", e => {
      e.preventDefault()
      this.currentLiveKlip.at -= -1000
      if (this.currentLiveKlip.at > 999) {
        editTsBack.classList.remove("disabled")
      }
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
      if (saveAt < 1000) {
        newTsBack.className += " disabled"
      }
      Player.seekTo(saveAt)
      newTsDisplay.innerHTML = `[${this.formatTime(saveAt)}]`
    })

    newTsForward.addEventListener("click", e => {
      e.preventDefault()
      saveAt -= -1000
      if (saveAt > 999) {
        newTsBack.classList.remove("disabled")
      }
      Player.seekTo(saveAt)
      newTsDisplay.innerHTML = `[${this.formatTime(saveAt)}]`
    })

    newTsDisplay.addEventListener("click", e => {
      e.preventDefault()
      Player.seekTo(saveAt)
    })

    nextKlip.addEventListener("click", e => {
      /* this.jumpedKlip = true*/
      Player.seekTo(this.nextKlip.at)
    })

    prevKlip.addEventListener("click", e => {
      this.jumpedKlip = true
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
      if (resp.redirect == true) {
        window.location.replace("/watch/" + resp.video_id + "?v=" + resp.video_id)
        return
      }

      vidChannel.params.last_seen_id = resp.id
      this.renderLiveKlip(myKlipContainer, resp)

      // switch to timeview tab (but not after copy)
      // for the time being, switch to overview
      $('#overview-tab').trigger("click");

      // *** quick hack

      // sort klips (asc: at) and delete current klipContainer
      this.allKlips.push(resp)
      this.currentAllKlips = this.allKlips

      // filter out original klips where a copy exists
      let copiedKlips = new Array

      for(var k in this.currentAllKlips)
        {if (this.currentAllKlips[k].copy_from > 0) {
          copiedKlips.push(this.currentAllKlips[k].copy_from)
        }}

      this.currentAllKlips = this.currentAllKlips.filter(klip => {
        if(!copiedKlips.includes(klip.id)) {
          return true
        }
      })

      this.currentAllKlips.sort( (a,b) => {return (a.at > b.at) ? 1 : ((b.at > a.at) ? -1 : 0);});

      allKlipsContainer.innerHTML = ""
      // display all klips in the navigator
      let i = 0
      for (i = 0; i < this.currentAllKlips.length; i++) {
        this.renderNaviKlip(allKlipsContainer, this.currentAllKlips[i])
      }
      this.addNaviEventListeners(vidChannel)

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
      this.addNaviEventListeners(vidChannel)
    })

    vidChannel.on("delete_klip", (resp) => {
      // remove deleted klip from array
      this.allKlips = this.allKlips.filter( klip => {
        return klip.id != resp.id
      })

      this.currentAllKlips = this.allKlips

      // filter out original klips where a copy exists
      let copiedKlips = new Array

      for(var k in this.currentAllKlips)
        {if (this.currentAllKlips[k].copy_from > 0) {
          copiedKlips.push(this.currentAllKlips[k].copy_from)
        }}

      this.currentAllKlips = this.currentAllKlips.filter(klip => {
        if(!copiedKlips.includes(klip.id)) {
          return true
        }
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

        let ids = resp.klips.map(klip => klip.id)
        if (ids.length > 0) { vidChannel.params.last_seen_id = Math.max(...ids) }

        this.allKlips = resp.klips
        // filter out original klips where a copy exists
        let copiedKlips = new Array

        for(var k in this.allKlips)
          {if (this.allKlips[k].copy_from > 0) {
            copiedKlips.push(this.allKlips[k].copy_from)
          }}

        this.currentAllKlips = this.allKlips.filter(klip => {
          if(!copiedKlips.includes(klip.id)) {
            return true
          }
        })

        /* this.currentAllKlips = this.allKlips*/
        this.scheduleKlips(myKlipContainer, this.currentAllKlips)


        // display all klips in the navigator
        let i = 0
        for (i = 0; i < this.currentAllKlips.length; i++) {
          this.renderNaviKlip(allKlipsContainer, this.currentAllKlips[i])
        }

        this.addNaviEventListeners(vidChannel)

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
    // following code was to prevent flashing of previous klip
    // didn't work... revisit later to solve
    /* if (this.jumpedKlip) {
     *   this.jumpedKlip = false
     *   return
     * }
     */
    let template = document.createElement("div")

    myKlipContainer.innerHTML = `
    <a href="#" data-seek="${this.esc(at)}">
      <div class="callout klip-callout">
        <p>${this.esc(content)}</p>
        <hr>
        <span class="timestamp">
            [${this.formatTime(at)}]
        </span>
      </div>
    </a>
    `

    if (user.id == this.currentUserId) {
      document.getElementById("klip-delete").classList.remove("hide")
      document.getElementById("klip-edit").classList.remove("hide")
      document.getElementById("klip-input-edit").value = this.esc(content)
    } else {
      document.getElementById("klip-delete").classList.remove("hide")
      document.getElementById("klip-edit").classList.remove("hide")
      document.getElementById("klip-delete").className += (" hide")
      document.getElementById("klip-edit").className += (" hide")
    }

    document.getElementById("klip-prev").classList.remove("invisible")
    document.getElementById("klip-next").classList.remove("invisible")

    if (at < 1000) {
      document.getElementById("klip-edit-ts-back").className += " disabled"
    }

    let timestampDisplay = document.getElementById("klip-edit-ts-display")
    timestampDisplay.innerHTML = `
    [${this.formatTime(at)}]
    `
  },

  renderNaviKlip(allKlipsContainer, {id, user, content, at, in_timeview}) {
    let template = document.createElement("div")

    template.setAttribute("id", "klip-id-" + id)

    let btnIcon = ""
    let btnAction = ""
    let btnCaption = ""

    if (user.id == this.currentUserId) {
      btnIcon = "fi-minus"
      btnCaption = "Delete"
      btnAction = "delete"
    } else {
      btnIcon = "fi-plus"
      btnCaption = "Copy"
      btnAction = "copy"
    }

    template.innerHTML = `
  <div class="callout klip-callout navi-callout">
    <a href="#" data-seek="${this.esc(at)}">
      <p>${this.esc(content)}</p>
      <hr>
    </a>
    <span class="timestamp">
        [${this.formatTime(at)}]
    </span>
    <span class="username">
      by ${this.esc(user.username)}
    </span>
    <span class="float-right">
    <button type="button" class="tiny hollow button navi-button" data-video-id="${this.esc(this.userVideoId)}" data-user-id="${this.esc(user.id)}" data-klip-content="${this.esc(content)}" data-klip-id="${this.esc(id)}" data-klip-action="${this.esc(btnAction)}">
      ${this.esc(btnCaption)}
    </button>
    </span>
  </div>
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
        document.getElementById("klip-edit").classList.remove("hide")
        document.getElementById("klip-delete").classList.remove("hide")
        document.getElementById("klip-edit").className += " hide"
        document.getElementById("klip-delete").className += " hide"
      }
      this.scheduleKlips(myKlipContainer, this.currentAllKlips)
    }, 500)
  },

  addNaviEventListeners(vidChannel) {

    Array.from(document.getElementsByClassName("navi-button")).forEach(function(element) {
      element.addEventListener('click', e => {
        e.preventDefault()
        let seekAt =
          e.target.parentNode.firstElementChild.getAttribute("data-seek") ||
          e.target.parentNode.parentNode.firstElementChild.getAttribute("data-seek") ||
          e.target.parentNode.parentNode.parentNode.firstElementChild.getAttribute("data-seek")

        let content =
          e.target.getAttribute("data-klip-content") ||
          e.target.parentNode.getAttribute("data-klip-content")

        let id =
          e.target.getAttribute("data-klip-id") ||
          e.target.parentNode.getAttribute("data-klip-id")

        let userId =
          e.target.getAttribute("data-user-id") ||
          e.target.parentNode.getAttribute("data-user-id")

        let videoId =
          e.target.getAttribute("data-video-id") ||
          e.target.parentNode.getAttribute("data-video-id")

        let klipAction =
          e.target.getAttribute("data-klip-action") ||
          e.target.parentNode.getAttribute("data-klip-action")

        if (klipAction == "copy") {
          let payload = {content: content, at: seekAt, copy_from: id, user_video_id: videoId}

          vidChannel.push("new_klip", payload)
            .receive("error", e => console.log(e))
        } else {

          let conf = confirm("Are you sure?")
          if (conf == true) {
            let payload = {
              id: id
            }
            vidChannel.push("delete_klip", payload)
              .receive("error", e => console.log(e) )
            // restart liveKlipTimer
          } else
          {
            return
          }
        }

      })
    })
  },

  formatTime(at) {
    let date = new Date(null)
    date.setSeconds(at / 1000)
    return date.toISOString().substr(14, 5)
  }

}
export default Video
