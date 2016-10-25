defmodule Flashklip.WatchController do
  use Flashklip.Web, :controller

  alias Flashklip.Metavideo
  alias Flashklip.Video

  def show(conn, %{"id" => id}) do

    case is_map(conn.assigns.current_user) do
      true ->
        video =
          Repo.get!(Video, id)
          |> Repo.preload(:metavideo)
        render conn, "show.html", video: video.metavideo, user_video: video
      _ ->
        metavideo =
          Repo.get!(Metavideo, id)
          |> Repo.preload(:videos)

        metavideo_klips = metavideo.videos |> Repo.preload(:klips)

        klips =
          Enum.flat_map(metavideo_klips, fn(v) ->
            v.klips
            |> Repo.preload(:user) end)
            |> Enum.sort()

        render conn, "show.html", video: metavideo, user_video: metavideo, klips: klips
    end

  end
end
