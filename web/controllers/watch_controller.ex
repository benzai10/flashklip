defmodule Flashklip.WatchController do
  use Flashklip.Web, :controller

  alias Flashklip.Metavideo
  alias Flashklip.Video

  def show(conn, %{"id" => id, "v" => v}) do
    if String.to_integer(v) > 0 do
      video =
        Repo.get!(Video, id)
        |> Repo.preload(:metavideo)
      render conn, "show.html", video: video.metavideo, user_video: video, show: ""
    else
      metavideo =
        Repo.get!(Metavideo, id)
        |> Repo.preload(:videos)
      metavideo_klips = metavideo.videos |> Repo.preload(:klips)
      klips =
        Enum.flat_map(metavideo_klips, fn(v) ->
          v.klips
          |> Repo.preload(:user) end)
          |> Enum.sort()
      show =
        case is_map(conn.assigns.current_user) do
          true ->
            ""
          _ ->
            "hide"
        end
      render conn, "show.html", video: metavideo, user_video: metavideo, klips: klips, show: show
    end
  end
end
