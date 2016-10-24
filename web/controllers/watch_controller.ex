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
        render conn, "show.html", video: metavideo
    end

  end
end
