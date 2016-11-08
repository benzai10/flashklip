import Player from "./player"

let Video = {

  currentLiveKlip: {},
  jumpedKlip: false,
  nextKlip: {},
  prevKlip: {},
  currentAllKlips: [],
  currentTimeviewKlips: [],
  allKlips: [],
  liveKlipTimer: {},
  userVideoId: 0,
  overviewAll: true,
  currentUserId: 0,
  at: 0,

  init(socket, element) { if (!element) { return }
    let playerId = element.getAttribute("data-player-id")
    let videoId = element.getAttribute("data-id")
    this.userVideoId = element.getAttribute("data-user-video-id")
    this.currentUserId = element.getAttribute("data-user-id")
    this.at = element.getAttribute("data-at")
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
    let hideButton        = document.getElementById("klip-hide")
    let deleteButton      = document.getElementById("klip-delete")
    let editButton        = document.getElementById("klip-edit")
    let copyButton        = document.getElementById("klip-copy")
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
        /* this.currentAllKlips = this.allKlips*/

        // filter out original klips where a copy exists
        let copiedKlips = new Array

        for(var k in this.allKlips)
          {if (this.allKlips[k].copy_from > 0) {
            copiedKlips.push(this.allKlips[k].copy_from)
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
      let payload = {content: klipInput.value, at: saveAt, user_video_id: this.userVideoId, in_timeview: true}
      vidChannel.push("new_klip", payload)
        .receive("error", e => console.log(e))
      klipInput.value = ""
    })

    copyButton.addEventListener("click", e => {
      let payload = {
        content: this.currentLiveKlip.content,
        at: this.currentLiveKlip.at,
        copy_from: this.currentLiveKlip.id,
        user_video_id: this.userVideoId,
        in_timeview: true,
        copy_from_timeview: true
      }
      vidChannel.push("new_klip", payload)
        .receive("error", e => console.log(e))
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
        this.scheduleKlips(myKlipContainer, this.currentTimeviewKlips)
      } else
      {
        return
      }
    })

    hideButton.addEventListener("click", e => {
      let payload = {
        id: this.currentLiveKlip.id,
        in_timeview: false
      }
      vidChannel.push("update_klip", payload)
        .receive("error", e => console.log(e) )

      // restart liveKlipTimer
      this.scheduleKlips(myKlipContainer, this.currentTimeviewKlips)
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
          klip.content = payload.content,
          klip.in_timeview = payload.in_timeview
        }
      })

      this.currentTimeviewKlips = this.currentAllKlips.filter( klip => {
        if (klip.in_timeview == true) {
          return true
        }
      })

      // restart liveKlipTimer
      this.scheduleKlips(myKlipContainer, this.currentTimeviewKlips)
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
      this.scheduleKlips(myKlipContainer, this.currentTimeviewKlips)
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
      Player.seekTo(this.nextKlip.at)
    })

    prevKlip.addEventListener("click", e => {
      /* myKlipContainer.innerHTML = ``*/
      document.getElementById("klip-content-display").className += " white-font"
      document.getElementById("klip-ts-display").className += " white-font"
      Player.seekTo(this.prevKlip.at)
    })

    myKlipContainer.addEventListener("click", e => {
      e.preventDefault()
      let seconds = e.target.getAttribute("data-seek") ||
                    e.target.parentNode.getAttribute("data-seek") ||
                    e.target.parentNode.parentNode.getAttribute("data-seek")
      if (!seconds) { return }
      Player.seekTo(seconds)
      document.getElementById("klip-content-display").className += " white-font"
      document.getElementById("klip-ts-display").className += " white-font"
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
        window.location.replace("/watch/" + resp.video_id + "?v=" + resp.video_id + "&at=" + resp.at)
        return
      }

      vidChannel.params.last_seen_id = resp.id
      this.renderLiveKlip(myKlipContainer, resp)

      // switch to timeview tab (but not after copy)
      // for the time being, switch to overview
      if (resp.copy_from_timeview != true) {
        $('#overview-tab').trigger("click");
      }


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
      if (resp.in_timeview == true) {
        this.renderLiveKlip(myKlipContainer, resp)
      } else {
        // remove hidden klip from live container
        myKlipContainer.innerHTML = ""
        document.getElementById("klip-hide").className += " hide"
        document.getElementById("klip-delete").className += " hide"
        document.getElementById("klip-edit").className += " hide"
        document.getElementById("klip-cancel-edit").className += " hide"
        document.getElementById("my-edit-container").className += " hide"
      }

      this.allKlips = this.allKlips.filter( klip => {
        return klip.id != resp.id
      })
      this.allKlips.push(resp)

      this.currentAllKlips = this.currentAllKlips.filter( klip => {
        return klip.id != resp.id
      })
      this.currentAllKlips.push(resp)
      this.currentAllKlips.sort( (a,b) => {return (a.at > b.at) ? 1 : ((b.at > a.at) ? -1 : 0);});

      this.currentTimeviewKlips = this.currentTimeviewKlips.filter( klip => {
        return klip.id != resp.id
      })
      if (resp.in_timeview == true) {
        this.currentTimeviewKlips.push(resp)
      }
      this.currentTimeviewKlips.sort( (a,b) => {return (a.at > b.at) ? 1 : ((b.at > a.at) ? -1 : 0);});

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

      // filter only own klips when my klips view is active
      if (overviewTitle.innerHTML == "MY KLIPS") {
        let userKlips = this.allKlips.filter( klip => {
          if (klip.user.id == this.currentUserId) {
            return true}
        })
        this.currentAllKlips = userKlips
        this.currentAllKlips.sort( (a,b) => {return (a.at > b.at) ? 1 : ((b.at > a.at) ? -1 : 0);});
      }

      // remove deleted klip from navi container
      let deletedKlip = document.getElementById("klip-id-" + resp.id)
      deletedKlip.parentElement.removeChild(deletedKlip)

      // remove deleted klip from live container
      myKlipContainer.innerHTML = ""
      document.getElementById("klip-hide").className += " hide"
      document.getElementById("klip-delete").className += " hide"
      document.getElementById("klip-edit").className += " hide"
      document.getElementById("klip-cancel-edit").className += " hide"
      document.getElementById("my-edit-container").className += " hide"
    })

    vidChannel.join()
      .receive("ok", resp => {

        let ids = resp.klips.map(klip => klip.id)
        if (ids.length > 0) { vidChannel.params.last_seen_id = Math.max(...ids) }

        // if allKlips is not empty, add newly added klips
        if (this.allKlips.length == 0) {
          this.allKlips = resp.klips
        } else {
          this.allKlips.push.apply(this.allKlips, resp.klips)
        }

        this.currentAllKlips = this.allKlips

        // filter out original klips where a copy exists
        // not needed anymore?
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

        // filter only own klips if "MY KLIPS" is active
        if (overviewTitle.innerHTML == "MY KLIPS") {
          let userKlips = this.allKlips.filter( klip => {
            if (klip.user.id == this.currentUserId) {
              return true
            }
          })
          this.currentAllKlips = userKlips
        }

        this.currentAllKlips.sort( (a,b) => {return (a.at > b.at) ? 1 : ((b.at > a.at) ? -1 : 0);});

        // display all klips in the navigator tabs
        allKlipsContainer.innerHTML = ""
        let i = 0
        for (i = 0; i < this.currentAllKlips.length; i++) {
          this.renderNaviKlip(allKlipsContainer, this.currentAllKlips[i])
        }

        this.addNaviEventListeners(vidChannel)

        allKlipsContainer.scrollTop = 0

        if (this.at > 0) {
          this.jumpedKlip = true
          Player.seekTo(this.at)
        }

        this.currentTimeviewKlips = this.currentAllKlips.filter ( klip => {
          if (klip.in_timeview == true) {
            return true
          }
        })

        this.scheduleKlips(myKlipContainer, this.currentTimeviewKlips)

      })
      .receive("error", reason => console.log("join failed", reason))

  },

  esc(str) {
    let div = document.createElement("div")
    div.appendChild(document.createTextNode(str))
    return div.innerHTML
  },

  renderLiveKlip(myKlipContainer, {user, content, at, in_timeview}) {

    let template = document.createElement("div")

    myKlipContainer.innerHTML = `
    <a href="#" data-seek="${this.esc(at)}">
      <div class="callout klip-callout">
        <p id="klip-content-display">${this.esc(content)}</p>
        <hr>
        <span class="timestamp" id="klip-ts-display">
            [${this.formatTime(at)}]
        </span>
      </div>
    </a>
    `

    if (this.jumpedKlip == true) {
      if (this.at > at) {
        document.getElementById("klip-content-display").className += " white-font"
        document.getElementById("klip-ts-display").className += " white-font"
      } else {
        this.jumpedKlip = false
      }
    } else {
      document.getElementById("klip-content-display").classList.remove("white-font")
      document.getElementById("klip-ts-display").classList.remove("white-font")
    }

    if (user.id == this.currentUserId) {
      document.getElementById("klip-hide").classList.remove("hide")
      document.getElementById("klip-delete").classList.remove("hide")
      document.getElementById("klip-edit").classList.remove("hide")
      document.getElementById("klip-copy").classList.remove("hide")
      document.getElementById("klip-copy").className += (" hide")
      document.getElementById("klip-input-edit").value = this.esc(content)
    } else {
      document.getElementById("klip-hide").classList.remove("hide")
      document.getElementById("klip-delete").classList.remove("hide")
      document.getElementById("klip-edit").classList.remove("hide")
      document.getElementById("klip-delete").className += (" hide")
      document.getElementById("klip-hide").className += (" hide")
      document.getElementById("klip-edit").className += (" hide")
      document.getElementById("klip-copy").classList.remove("hide")
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
    let btnTimeviewClass = ""
    let btnTimeviewCaption = ""
    let btnTimeviewAction = ""

    if (user.id == this.currentUserId) {
      btnIcon = "fi-minus"
      btnCaption = "Delete"
      btnAction = "delete"
      btnTimeviewClass = ""
      if (in_timeview == true) {
        btnTimeviewCaption = "Hide"
        btnTimeviewAction = "hide"
      } else {
        btnTimeviewCaption = "Show"
        btnTimeviewAction = "show"
      }
    } else {
      btnIcon = "fi-plus"
      btnCaption = "Save"
      btnAction = "copy"
      btnTimeviewClass = " hide"
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
    <button type="button" class="tiny hollow button navi-button ${this.esc(btnTimeviewClass)}" data-video-id="${this.esc(this.userVideoId)}" data-user-id="${this.esc(user.id)}" data-klip-content="${this.esc(content)}" data-klip-id="${this.esc(id)}" data-klip-action="${this.esc(btnTimeviewAction)}">
      ${this.esc(btnTimeviewCaption)}
    </button>
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
        document.getElementById("klip-hide").classList.remove("hide")
        document.getElementById("klip-edit").classList.remove("hide")
        document.getElementById("klip-delete").classList.remove("hide")
        document.getElementById("klip-copy").classList.remove("hide")
        document.getElementById("klip-edit").className += " hide"
        document.getElementById("klip-hide").className += " hide"
        document.getElementById("klip-delete").className += " hide"
        document.getElementById("klip-copy").className += " hide"
      }
      this.scheduleKlips(myKlipContainer, this.currentTimeviewKlips)
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

        /* switch (klipAction) {*/
        /* case "copy":*/
        if (klipAction == "copy") {
            let payload = {content: content, at: seekAt, copy_from: id, user_video_id: videoId}

            vidChannel.push("new_klip", payload)
              .receive("error", e => console.log(e))

        } else if (klipAction == "show") {

            let payload = {
              id: id,
              in_timeview: true
            }
            vidChannel.push("update_klip", payload)
              .receive("error", e => console.log(e) )

        } else if (klipAction == "hide") {

            let payload = {
              id: id,
              in_timeview: false
            }
            vidChannel.push("update_klip", payload)
              .receive("error", e => console.log(e) )

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
