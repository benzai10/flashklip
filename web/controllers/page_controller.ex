defmodule Flashklip.PageController do
  use Flashklip.Web, :controller

  alias Flashklip.Metavideo

  def index(conn, _params) do
    metavideos =
      Repo.all(Metavideo)
      |> Repo.preload(:videos)

    render(conn, "index.html", metavideos: metavideos)
  end
end
