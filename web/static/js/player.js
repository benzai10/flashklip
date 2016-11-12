let Player = {
  player: null,
  playerState: 0,

  init(domId, playerId, onReady){
    window.onYouTubeIframeAPIReady = () => {
      this.onIframeReady(domId, playerId, onReady)
    }
    let youtubeScriptTag = document.createElement("script")
    youtubeScriptTag.src = "//www.youtube.com/iframe_api"
    document.head.appendChild(youtubeScriptTag)
  },

  onIframeReady(domId, playerId, onReady){
    this.player = new YT.Player(domId, {
      height: "368px",
      width: "100%",
      videoId: playerId,
      events: {
        "onReady":  (event => onReady(event) ),
        "onStateChange": (event => this.onPlayerStateChange(event) )
      }
    })
  },

  onPlayerStateChange(event){
    this.playerState = event.data
  },
  getCurrentTime(){ return Math.floor(this.player.getCurrentTime() * 1000) },
  seekTo(millsec){ return this.player.seekTo(millsec / 1000) },
}
export default Player
