defmodule Flashklip.WatchController do
  use Flashklip.Web, :controller

  alias Flashklip.Video

  def show(conn, %{"id" => id}) do
    video =
      Repo.get!(Video, id)
      |> Repo.preload(:metavideo)

    render conn, "show.html", video: video
  end
end
