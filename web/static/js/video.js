import Player from "./player"

let Video = {

  vidKlips: [],
  allKlips: [],
  myKlips: [],
  allTimeKlips: [],
  myTimeKlips: [],
  currentTimeviewKlips: [],
  currentUserId: 0,
  videoUserId: 0,
  activeView: "",
  pendingEdit: false,

  currentLiveKlip: {},
  jumpedKlip: false,
  liveKlip: null,
  nextKlip: {},
  prevKlip: {},
  currentAllKlips: [],
  liveKlipTimer: {},
  userVideoId: 0,
  at: 0,
  startTimer: false,

  init(socket, element) { if (!element) { return }
    let playerId = element.getAttribute("data-player-id")
    let videoId = element.getAttribute("data-id")
    this.userVideoId = element.getAttribute("data-user-video-id")
    this.videoUserId = element.getAttribute("data-video-user-id")
    this.currentUserId = element.getAttribute("data-user-id")
    this.at = element.getAttribute("data-at")
    socket.connect()
    Player.init(element.id, playerId, () => {
      if (this.currentUserId > 0 && this.videoUserId == this.currentUserId) {
        this.onReady(videoId, socket)
      } else {
        if (this.at > 0) {
          Player.seekTo(this.at)
        }

        Array.from(document.getElementsByClassName("klip-callout")).forEach(function(element) {
          element.addEventListener('click', e => {
            let seekAt =
              e.target.parentNode.firstElementChild.getAttribute("data-seek") ||
              e.target.parentNode.parentNode.firstElementChild.getAttribute("data-seek")

            Player.seekTo(seekAt)
          })
        })
      }
    })
  },

  onReady(videoId, socket) {
    let liveKlipContainer = document.getElementById("live-klip-container")
    let allKlipsContainer = document.getElementById("all-klips-container")
    let addKlipTab        = document.getElementById("add-klip-tab")
    let addButton         = document.getElementById("klip-submit")
    let saveButtonInTView = document.getElementById("klip-save-in-timeview")
    let deleteButton      = document.getElementById("klip-delete")
    let hideButton        = document.getElementById("klip-hide")
    let scheduleButton    = document.getElementById("submit-schedule-video")
    let editButton        = document.getElementById("klip-edit")
    let cancelEditButton  = document.getElementById("klip-cancel-edit")
    let editKlipTab       = document.getElementById("edit-klip-tab")
    let scheduledDate     = document.getElementById("scheduled-date")

    let klipInput         = document.getElementById("klip-input")
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

    vidChannel.join()
      .receive("ok", resp => {
        let ids = resp.klips.map(klip => klip.id)
        if (ids.length > 0) { vidChannel.params.last_seen_id = Math.max(...ids) }
        // if vidKlips is not empty, add only newly added klips
        if (this.vidKlips.length == 0) {
          this.vidKlips = resp.klips
          // initialise all klip arrays
          this.allKlips = this.removeCopyOriginals(this.vidKlips)
          /* this.allKlips = this.vidKlips*/
          this.myKlips = this.vidKlips.filter( klip => {
            if (klip.copy_from > 0 || (klip.copy_from == 0 && klip.user.id == this.currentUserId)) {
              return true
            }
          })
          this.allTimeKlips = this.allKlips.filter( klip => {
            if (klip.in_timeview == true || (klip.copy_from == 0 && klip.user.id != this.currentUserId)) {
              return true
            }
          })
          // sort all arrays
          this.allKlips.sort( (a,b) => {
            return (a.at > b.at) ? 1 : ((b.at > a.at) ? -1 : 0);});
          this.myKlips.sort( (a,b) => {
            return (a.at > b.at) ? 1 : ((b.at > a.at) ? -1 : 0);});
          this.allTimeKlips.sort( (a,b) => {
            return (a.at > b.at) ? 1 : ((b.at > a.at) ? -1 : 0);});
          // display all klips in the navigator tab
          allKlipsContainer.innerHTML = ""
          let i = 0
          for (i = 0; i < this.allKlips.length; i++) {
            this.renderNaviKlip(allKlipsContainer, this.allKlips[i])
          }
          this.addNaviEventListeners(vidChannel)
          /* allKlipsContainer.scrollTop = 0*/
          if (this.at > 0) {
            this.jumpedKlip = true
            Player.seekTo(this.at)
          }
          this.currentTimeviewKlips = this.allTimeKlips
          this.scheduleKlips(liveKlipContainer, this.currentTimeviewKlips)
        } else {
          this.vidKlips.push.apply(this.allKlips, resp.klips)
        }
      })
      .receive("error", reason => console.log("join failed", reason))


    document.getElementById("timeview-tab").addEventListener("click", e => {
      this.activeView = "timeview"
    })

    document.getElementById("overview-tab").addEventListener("click", e => {
      if (this.pendingEdit == true) {
        document.getElementById("my-edit-container").classList.remove("hide")
        document.getElementById("klip-cancel-edit").classList.remove("hide")
        document.getElementById("my-edit-container").className += " hide"
        document.getElementById("klip-cancel-edit").className += " hide"
        document.getElementById("live-klip-container").classList.remove("hide")
        document.getElementById("klip-edit").classList.remove("hide")
        nextKlip.classList.remove("invisible")
        prevKlip.classList.remove("invisible")
        this.pendingEdit = false
        this.scheduleKlips(liveKlipContainer, this.currentTimeviewKlips)
      }

      this.activeView = "overview"
    })

    switchOverview.addEventListener("click", e => {
      clearTimeout(this.liveKlipTimer)
      if (overviewTitle.innerHTML == "ALL KLIPS") {
        this.myTimeKlips = this.myKlips.filter ( klip => {
          if (klip.in_timeview == true) {
            return true
          }
        })
        allKlipsContainer.innerHTML = ""
        let i = 0
        for (i = 0; i < this.myKlips.length; i++) {
          this.renderNaviKlip(allKlipsContainer, this.myKlips[i])
        }
        this.addNaviEventListeners(vidChannel)
        overviewTitle.innerHTML = "MY KLIPS"
        switchOverview.innerHTML = "Load all Klips"
        $('#overview-tab').trigger("click")
        this.currentTimeviewKlips = this.myTimeKlips
      } else {
        this.allTimeKlips = this.allKlips.filter ( klip => {
          if (klip.in_timeview == true || (klip.copy_from == 0 && klip.user.id != this.currentUserId)) {
            return true
          }
        })
        overviewTitle.innerHTML = "ALL KLIPS"
        switchOverview.innerHTML = "Load my Klips"
        allKlipsContainer.innerHTML = ""
        let i = 0
        for (i = 0; i < this.allKlips.length; i++) {
          this.renderNaviKlip(allKlipsContainer, this.allKlips[i])
        }
        this.addNaviEventListeners(vidChannel)
        $('#overview-tab').trigger("click")
        this.currentTimeviewKlips = this.allTimeKlips
      }
      this.scheduleKlips(liveKlipContainer, this.currentTimeviewKlips)
    })

    addKlipTab.addEventListener("click", e => {
      if (this.pendingEdit == true) {
        document.getElementById("my-edit-container").classList.remove("hide")
        document.getElementById("klip-cancel-edit").classList.remove("hide")
        document.getElementById("my-edit-container").className += " hide"
        document.getElementById("klip-cancel-edit").className += " hide"
        document.getElementById("live-klip-container").classList.remove("hide")
        document.getElementById("klip-edit").classList.remove("hide")
        nextKlip.classList.remove("invisible")
        prevKlip.classList.remove("invisible")
        this.pendingEdit = false
        this.scheduleKlips(liveKlipContainer, this.currentTimeviewKlips)
      }

      saveAt = Player.getCurrentTime()
      if (saveAt < 1000) {
        newTsBack.className += " disabled"
      } else {
        newTsBack.classList.remove("disabled")
      }

      newTsDisplay.innerHTML = `[${this.formatTime(saveAt)}]`
    })

    addButton.addEventListener("click", e => {
      let payload = {
        content: klipInput.value,
        at: saveAt,
        user_video_id: this.userVideoId,
        in_timeview: true,
        copy_from: 0,
        copy_from_timeview: false
      }
      vidChannel.push("new_klip", payload)
        .receive("error", e => console.log(e))
      klipInput.value = ""
    })

    saveButtonInTView.addEventListener("click", e => {
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

    vidChannel.on("new_klip", (resp) => {
      if (resp.copy_from == 0 || resp.user.id == this.currentUserId) {
        // ^original content goes to everyone, copies only to sender
        clearTimeout(this.liveKlipTimer)

        if (resp.redirect == true) {
          window.location.replace("/watch/" + resp.video_id + "?v=" + resp.video_id + "&at=" + resp.at)
          return
        }

        vidChannel.params.last_seen_id = resp.id

        // update all & sort klip arrays
        this.vidKlips.push(resp)
        this.allKlips = this.removeCopyOriginals(this.vidKlips)
        this.myKlips.push(resp)
        this.allTimeKlips.push(resp)
        this.allTimeKlips = this.removeCopyOriginals(this.allTimeKlips)
        this.myTimeKlips.push(resp)
        this.myTimeKlips = this.removeCopyOriginals(this.allTimeKlips)
        this.allKlips.sort( (a,b) => {
          return (a.at > b.at) ? 1 : ((b.at > a.at) ? -1 : 0);});
        this.myKlips.sort( (a,b) => {
          return (a.at > b.at) ? 1 : ((b.at > a.at) ? -1 : 0);});
        this.allTimeKlips.sort( (a,b) => {
          return (a.at > b.at) ? 1 : ((b.at > a.at) ? -1 : 0);});
        this.myTimeKlips.sort( (a,b) => {
          return (a.at > b.at) ? 1 : ((b.at > a.at) ? -1 : 0);});

        // rendering new views
        this.renderLiveKlip(liveKlipContainer, resp)
        allKlipsContainer.innerHTML = ""
        let i = 0
        if (overviewTitle.innerHTML == "ALL KLIPS") {
          for (i = 0; i < this.allKlips.length; i++) {
            this.renderNaviKlip(allKlipsContainer, this.allKlips[i], resp.current_scroll_pos)
          }
          this.currentTimeviewKlips = this.allTimeKlips
        } else {
          for (i = 0; i < this.myKlips.length; i++) {
            this.renderNaviKlip(allKlipsContainer, this.myKlips[i], resp.current_scroll_pos)
          }
          this.currentTimeviewKlips = this.myTimeKlips
        }
        this.addNaviEventListeners(vidChannel)

        if (this.activeView == "timeview") {
          $('#timeview-tab').trigger("click")
        } else {
          $('#overview-tab').trigger("click")
        }

        console.log(this.currentTimeviewKlips)

        this.scheduleKlips(liveKlipContainer, this.currentTimeviewKlips)
      } else {
        // use this section for later, e.g. to update klip likes or so.
        /* console.log("someone copied some shit!")*/
      }

    })

    deleteButton.addEventListener("click", e => {
      let conf = confirm("Are you sure?")
      if (conf == true) {
        console.log("from deleteButton: " + this.currentLiveKlip.user_id)
        let payload = {
          id: this.currentLiveKlip.id,
          user_id: this.currentLiveKlip.user.id,
          copy_from: this.currentLiveKlip.copy_from
        }
        vidChannel.push("delete_klip", payload)
          .receive("error", e => {
            console.log(e)
            this.scheduleKlips(liveKlipContainer, this.currentTimeviewKlips)
          })

      } else
      {
        return
      }
    })

    vidChannel.on("delete_klip", (resp) => {
      if (resp.user_id == this.currentUserId) {
        // delete from all arrays
        this.vidKlips = this.vidKlips.filter(k => {return k.id != resp.id})
        this.allKlips = this.allKlips.filter(k => {return k.id != resp.id})
        this.myKlips = this.myKlips.filter(k => {return k.id != resp.id})
        this.allTimeKlips = this.allTimeKlips.filter(k => {return k.id != resp.id})
        this.myTimeKlips = this.myTimeKlips.filter(k => {return k.id != resp.id})
        // add original klip to allKlips again
        let originalKlip = this.vidKlips.find(k => {return k.id == resp.copy_from})
        if (originalKlip) {
          this.allKlips.push(originalKlip)
          this.allTimeKlips.push(originalKlip)
          this.allKlips.sort( (a,b) => {
            return (a.at > b.at) ? 1 : ((b.at > a.at) ? -1 : 0);});
          this.allTimeKlips.sort( (a,b) => {
            return (a.at > b.at) ? 1 : ((b.at > a.at) ? -1 : 0);});
          this.myKlips.sort( (a,b) => {
            return (a.at > b.at) ? 1 : ((b.at > a.at) ? -1 : 0);});
          this.myTimeKlips.sort( (a,b) => {
            return (a.at > b.at) ? 1 : ((b.at > a.at) ? -1 : 0);});
        }

        if (overviewTitle.innerHTML == "ALL KLIPS") {
          this.currentTimeviewKlips = this.allTimeKlips
        } else {
          this.currentTimeviewKlips = this.myTimeKlips
        }

        if (originalKlip)  {
          allKlipsContainer.innerHTML = ""
          let i = 0
          if (overviewTitle.innerHTML == "ALL KLIPS") {
            for (i = 0; i < this.allKlips.length; i++) {
              this.renderNaviKlip(allKlipsContainer, this.allKlips[i], resp.current_scroll_pos)
            }
          } else {
            for (i = 0; i < this.myKlips.length; i++) {
              this.renderNaviKlip(allKlipsContainer, this.myKlips[i], resp.current_scroll_pos)
            }
          }

          this.addNaviEventListeners(vidChannel)
          liveKlipContainer.innerHTML = ""
          if (overviewTitle.innerHTML == "ALL KLIPS") {
            this.renderLiveKlip(liveKlipContainer, originalKlip)
          }
        } else {
          let deletedKlip = document.getElementById("klip-id-" + resp.id)
          deletedKlip.parentElement.removeChild(deletedKlip)

          // remove deleted klip from live container
          liveKlipContainer.innerHTML = ""
          document.getElementById("klip-hide").className += " hide"
          document.getElementById("klip-delete").className += " hide"
          document.getElementById("klip-edit").className += " hide"
          document.getElementById("klip-cancel-edit").className += " hide"
          document.getElementById("my-edit-container").className += " hide"
        }

        // restart liveKlipTimer
        /* this.scheduleKlips(liveKlipContainer, this.currentTimeviewKlips)*/
      }
    })

    hideButton.addEventListener("click", e => {
      let payload = {
        id: this.currentLiveKlip.id,
        in_timeview: false
      }
      vidChannel.push("update_klip", payload)
        .receive("error", e => console.log(e) )

    })

    scheduleButton.addEventListener("click", e => {
      let scheduledIn = $("#scheduled-value").val()
      let payload = {
        id: this.userVideoId,
        scheduled_at: scheduledIn
      }
      vidChannel.push("schedule_video", payload)
      .receive("error", e => console.log(e))
    })

    vidChannel.on("schedule_video", (resp) => {
      if (resp.id == this.userVideoId) {
        if (resp.scheduled_at) {
          scheduledDate.innerHTML = "Re-watching video is scheduled for: " + resp.scheduled_at.substring(0, 10)
        } else {
          scheduledDate.innerHTML = "Re-watching video is not scheduled."
        }
      }
    })

    editButton.addEventListener("click", e => {
      clearTimeout(this.liveKlipTimer)
      this.pendingEdit = true
      document.getElementById("live-klip-container").className += " hide"
      document.getElementById("klip-edit").className += " hide"
      document.getElementById("klip-hide").className += " hide"
      document.getElementById("klip-delete").className += " hide"
      nextKlip.classList.remove("invisible")
      prevKlip.classList.remove("invisible")
      nextKlip.className += " invisible"
      prevKlip.className += " invisible"
      document.getElementById("my-edit-container").classList.remove("hide")
      document.getElementById("klip-cancel-edit").classList.remove("hide")
    })

    updateButton.addEventListener("click", e => {
      let payload = {
        id: this.currentLiveKlip.id,
        at: this.currentLiveKlip.at,
        content: document.getElementById("klip-input-edit").value,
        in_timeview: true
      }
      vidChannel.push("update_klip", payload)
        .receive("error", e => console.log(e) )
      document.getElementById("my-edit-container").className += " hide"
      document.getElementById("klip-cancel-edit").className += " hide"
      document.getElementById("live-klip-container").classList.remove("hide")
      document.getElementById("klip-edit").classList.remove("hide")
      document.getElementById("klip-hide").classList.remove("hide")
    })

    cancelEditButton.addEventListener("click", e => {
      document.getElementById("my-edit-container").className += " hide"
      document.getElementById("klip-cancel-edit").className += " hide"
      document.getElementById("live-klip-container").classList.remove("hide")
      document.getElementById("klip-edit").classList.remove("hide")
      nextKlip.classList.remove("invisible")
      prevKlip.classList.remove("invisible")

      // restart liveKlipTimer
      this.pendingEdit = false
      this.scheduleKlips(liveKlipContainer, this.currentTimeviewKlips)
    })

    vidChannel.on("update_klip", (resp) => {
      if (resp.user.id == this.currentUserId) {
        clearTimeout(this.liveKlipTimer)

        console.log("timeview value: " + resp.in_timeview)

        if (resp.in_timeview == true) {
          this.liveKlip = resp
          this.renderLiveKlip(liveKlipContainer, resp)
        } else {
          // remove hidden klip from live container
          liveKlipContainer.innerHTML = ""
          document.getElementById("klip-hide").className += " hide"
          document.getElementById("klip-delete").className += " hide"
          document.getElementById("klip-edit").className += " hide"
          document.getElementById("klip-cancel-edit").className += " hide"
          document.getElementById("my-edit-container").className += " hide"
        }
        this.allKlips = this.allKlips.filter(k => {return k.id != resp.id})
        this.allKlips.push(resp)
        this.allKlips.sort( (a,b) => {return (a.at > b.at) ? 1 : ((b.at > a.at) ? -1 : 0);});
        this.myKlips = this.myKlips.filter(k => {return k.id != resp.id})
        if (resp.in_timeview == true) {this.myKlips.push(resp)}
        this.myKlips.sort( (a,b) => {return (a.at > b.at) ? 1 : ((b.at > a.at) ? -1 : 0);});
        this.allTimeKlips = this.allTimeKlips.filter(k => {return k.id != resp.id})
        if (resp.in_timeview == true) {this.allTimeKlips.push(resp)}
        this.myTimeKlips = this.myTimeKlips.filter(k => {return k.id != resp.id})
        if (resp.in_timeview == true) {this.myTimeKlips.push(resp)}
        this.allKlips = this.removeCopyOriginals(this.allKlips)
        this.myKlips = this.removeCopyOriginals(this.myKlips)
        this.allTimeKlips = this.removeCopyOriginals(this.allTimeKlips)
        this.myTimeKlips = this.removeCopyOriginals(this.myTimeKlips)
        this.allKlips.sort( (a,b) => {return (a.at > b.at) ? 1 : ((b.at > a.at) ? -1 : 0);});
        this.allTimeKlips.sort( (a,b) => {return (a.at > b.at) ? 1 : ((b.at > a.at) ? -1 : 0);});
        this.myTimeKlips.sort( (a,b) => {return (a.at > b.at) ? 1 : ((b.at > a.at) ? -1 : 0);});
        allKlipsContainer.innerHTML = ""

        if (overviewTitle.innerHTML == "ALL KLIPS") {
          this.currentTimeviewKlips = this.allTimeKlips
          let i = 0
          for (i = 0; i < this.allKlips.length; i++) {
            this.renderNaviKlip(allKlipsContainer, this.allKlips[i], resp.current_scroll_pos)
          }
        } else {
          this.currentTimeviewKlips = this.myTimeKlips
          let i = 0
          for (i = 0; i < this.myKlips.length; i++) {
            this.renderNaviKlip(allKlipsContainer, this.myKlips[i], resp.current_scroll_pos)
          }
        }
        this.addNaviEventListeners(vidChannel)
        this.scheduleKlips(liveKlipContainer, this.currentTimeviewKlips)
        if (resp.in_timeview == true) {
          Player.seekTo(resp.at)
        }
      }
    })


    editTsBack.addEventListener("click", e => {
      e.preventDefault()
      this.currentLiveKlip.at -= 1000
      if (this.currentLiveKlip.at < 1000) {
        editTsBack.className += " disabled"
      }
      this.startTimer = true
      Player.seekTo(this.currentLiveKlip.at)
      editTsDisplay.innerHTML = `[${this.formatTime(this.currentLiveKlip.at)}]`
    })

    editTsForward.addEventListener("click", e => {
      e.preventDefault()
      this.currentLiveKlip.at -= -1000
      if (this.currentLiveKlip.at > 999) {
        editTsBack.classList.remove("disabled")
      }
      this.startTimer = true
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
      this.startTimer = true
      Player.seekTo(saveAt)
      newTsDisplay.innerHTML = `[${this.formatTime(saveAt)}]`
    })

    newTsForward.addEventListener("click", e => {
      e.preventDefault()
      saveAt -= -1000
      if (saveAt > 999) {
        newTsBack.classList.remove("disabled")
      }
      this.startTimer = true
      Player.seekTo(saveAt)
      newTsDisplay.innerHTML = `[${this.formatTime(saveAt)}]`
    })

    newTsDisplay.addEventListener("click", e => {
      e.preventDefault()
      this.startTimer = true
      Player.seekTo(saveAt)
    })

    nextKlip.addEventListener("click", e => {
      this.liveKlip = this.nextKlip
      this.startTimer = true
      Player.seekTo(this.nextKlip.at)
    })

    prevKlip.addEventListener("click", e => {
      this.liveKlip = this.prevKlip
      /* liveKlipContainer.innerHTML = ``*/
      this.startTimer = true
      document.getElementById("klip-content-display").className += " white-font"
      document.getElementById("klip-ts-display").className += " white-font"
      Player.seekTo(this.prevKlip.at)
    })

    liveKlipContainer.addEventListener("click", e => {
      e.preventDefault()
      let seconds = e.target.getAttribute("data-seek") ||
                    e.target.parentNode.getAttribute("data-seek") ||
                    e.target.parentNode.parentNode.getAttribute("data-seek")
      if (!seconds) { return }
      this.startTimer = true
      Player.seekTo(seconds)
      document.getElementById("klip-content-display").className += " white-font"
      document.getElementById("klip-ts-display").className += " white-font"
    })

    allKlipsContainer.addEventListener("click", e => {
      e.preventDefault()
      let element = e.target.parentNode.getAttribute("id")
      if (!element) {
        element = e.target.parentNode.parentNode.getAttribute("id")
      }
      if (!element) {
        element = e.target.parentNode.parentNode.parentNode.getAttribute("id")
      }
      let klipId = element.match(/\d+/)[0]
      this.liveKlip = this.allKlips.find( klip => { return klip.id == klipId } )
      this.startTimer = true
      Player.seekTo(this.liveKlip.at)
    })

    editKlipTab.addEventListener("click", e => {
      if (this.pendingEdit == true) {
        document.getElementById("my-edit-container").classList.remove("hide")
        document.getElementById("klip-cancel-edit").classList.remove("hide")
        document.getElementById("my-edit-container").className += " hide"
        document.getElementById("klip-cancel-edit").className += " hide"
        document.getElementById("live-klip-container").classList.remove("hide")
        document.getElementById("klip-edit").classList.remove("hide")
        nextKlip.classList.remove("invisible")
        prevKlip.classList.remove("invisible")
        this.pendingEdit = false
        this.scheduleKlips(liveKlipContainer, this.currentTimeviewKlips)
      }
    })

  },

  removeCopyOriginals(arr) {
    let copiedKlips = new Array
    for(var k in this.vidKlips)
      {if (this.vidKlips[k].copy_from > 0) {
        copiedKlips.push(this.vidKlips[k].copy_from)
      }}

    return arr.filter(klip => {
      if(!copiedKlips.includes(klip.id)) {
        return true
      }
    })
  },

  esc(str) {
    let div = document.createElement("div")
    div.appendChild(document.createTextNode(str))
    return div.innerHTML
  },

  renderLiveKlip(liveKlipContainer, {user, content, at, in_timeview}) {

    let template = document.createElement("div")

    liveKlipContainer.innerHTML = `
    <a href="#" data-seek="${this.esc(at)}">
      <div class="callout klip-callout">
        <p id="klip-content-display">${this.esc(content)}</p>
        <hr>
        <span class="timestamp" id="klip-ts-display">
            [${this.formatTime(at)}]
        </span>
        <span class="username">
          by ${this.esc(user.username)}
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
      document.getElementById("klip-save-in-timeview").classList.remove("hide")
      document.getElementById("klip-save-in-timeview").className += (" hide")
      document.getElementById("klip-input-edit").value = this.esc(content)
    } else {
      document.getElementById("klip-hide").classList.remove("hide")
      document.getElementById("klip-delete").classList.remove("hide")
      document.getElementById("klip-edit").classList.remove("hide")
      document.getElementById("klip-delete").className += (" hide")
      document.getElementById("klip-hide").className += (" hide")
      document.getElementById("klip-edit").className += (" hide")
      document.getElementById("klip-save-in-timeview").classList.remove("hide")
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

  renderNaviKlip(allKlipsContainer, {id, user, content, at, copy_from, in_timeview}, currentScrollPos) {
    let template = document.createElement("div")

    template.setAttribute("id", "klip-id-" + id)

    let btnIcon = ""
    let btnAction = ""
    let btnCaption = ""
    let btnTimeviewClass = ""
    let btnTimeviewCaption = ""
    let btnTimeviewAction = ""
    let divTimeviewClass = ""

    if (user.id == this.currentUserId) {
      btnIcon = "fi-minus"
      btnCaption = "Delete"
      btnAction = "delete"
      btnTimeviewClass = ""
      if (in_timeview == true) {
        divTimeviewClass = ""
        btnTimeviewCaption = "Hide"
        btnTimeviewAction = "hide"
      } else {
        divTimeviewClass = "hidden-klip"
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
  <div class="callout klip-callout navi-callout ${this.esc(divTimeviewClass)}">
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
      <button type="button" class="tiny hollow button navi-button" data-video-id="${this.esc(this.userVideoId)}" data-user-id="${this.esc(user.id)}" data-klip-content="${this.esc(content)}" data-klip-id="${this.esc(id)}" data-copy-from="${this.esc(copy_from)}" data-klip-action="${this.esc(btnAction)}">
        ${this.esc(btnCaption)}
      </button>
      <button type="button" class="tiny hollow button navi-button ${this.esc(btnTimeviewClass)}" data-video-id="${this.esc(this.userVideoId)}" data-user-id="${this.esc(user.id)}" data-klip-content="${this.esc(content)}" data-klip-id="${this.esc(id)}" data-klip-action="${this.esc(btnTimeviewAction)}">
        ${this.esc(btnTimeviewCaption)}
      </button>
    </span>
  </div>
    `

    allKlipsContainer.appendChild(template)
    allKlipsContainer.scrollTop = currentScrollPos
  },

  scheduleKlips(liveKlipContainer, klips) {
    this.liveKlipTimer = setTimeout(() => {

      let ctime = Player.getCurrentTime()

      let nowKlip = {}
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
        if (klip.at <= ctime) {
          return true
        }
      }).slice(-2)
      if (lastTwoKlips.length > 1) {
        this.prevKlip = lastTwoKlips[0]
        nowKlip = lastTwoKlips[1]
      } else {
        this.prevKlip = null
        nowKlip = lastTwoKlips[0]
      }
      if (this.prevKlip) {
        document.getElementById("klip-prev").classList.remove("disabled")
      } else {
        document.getElementById("klip-prev").classList.remove("disabled")
        document.getElementById("klip-prev").className += " disabled"
      }

      if (nowKlip) {
        this.currentLiveKlip = nowKlip
        this.renderLiveKlip(liveKlipContainer, nowKlip)
      } else {
        document.getElementById("live-klip-container").innerHTML = ""
        document.getElementById("klip-hide").classList.remove("hide")
        document.getElementById("klip-edit").classList.remove("hide")
        document.getElementById("klip-delete").classList.remove("hide")
        document.getElementById("klip-save-in-timeview").classList.remove("hide")
        document.getElementById("klip-edit").className += " hide"
        document.getElementById("klip-hide").className += " hide"
        document.getElementById("klip-delete").className += " hide"
        document.getElementById("klip-save-in-timeview").className += " hide"
      }

      this.scheduleKlips(liveKlipContainer, this.currentTimeviewKlips)
    }, 500)
  },

  addNaviEventListeners(vidChannel) {

    Array.from(document.getElementsByClassName("navi-button")).forEach(function(element) {
      element.addEventListener("click", e => {
        e.preventDefault()

        let currentScrollPos = e.target.closest("div").parentNode.parentNode.scrollTop

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

        let copyFrom =
          e.target.getAttribute("data-copy-from") ||
          e.target.parentNode.getAttribute("data-copy-from")

        let videoId =
          e.target.getAttribute("data-video-id") ||
          e.target.parentNode.getAttribute("data-video-id")

        let klipAction =
          e.target.getAttribute("data-klip-action") ||
          e.target.parentNode.getAttribute("data-klip-action")

        /* switch (klipAction) {*/
        /* case "copy":*/
        if (klipAction == "copy") {
          let payload = {
            content: content,
            at: seekAt,
            copy_from: id,
            user_video_id: videoId,
            current_scroll_pos: currentScrollPos}

            vidChannel.push("new_klip", payload)
              .receive("error", e => console.log(e))

        } else if (klipAction == "show") {

            let payload = {
              id: id,
              in_timeview: true,
              current_scroll_pos: currentScrollPos
            }
            vidChannel.push("update_klip", payload)
              .receive("error", e => console.log(e) )

        } else if (klipAction == "hide") {

            let payload = {
              id: id,
              in_timeview: false,
              current_scroll_pos: currentScrollPos
            }
            vidChannel.push("update_klip", payload)
              .receive("error", e => console.log(e) )

        } else {

            let conf = confirm("Are you sure?")
            if (conf == true) {
              let payload = {
                id: id,
                user_id: userId,
                copy_from: copyFrom,
                current_scroll_pos: currentScrollPos
              }
              vidChannel.push("delete_klip", payload)
                .receive("error", e => console.log(e) )
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
    if (at < 3600000) {
      return date.toISOString().substr(14, 5)
    } else {
      return date.toISOString().substr(11, 8)
    }
  }

}
export default Video
