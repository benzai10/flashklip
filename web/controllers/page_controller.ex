defmodule Flashklip.PageController do
  use Flashklip.Web, :controller

  alias Flashklip.{
    Metavideo,
    Klip
  }

  def index(conn, params) do
    search_tag = params["search"]
    if is_nil(search_tag) do
      metavideos =
        Repo.all(Metavideo)
        |> Repo.preload(:videos)

      klips =
        Repo.all(Klip)
        |> Repo.preload([:user, :video])

      render(conn, "index.html", metavideos: metavideos, klips: klips)
    else
        query = from m in Metavideo,
          where: ^search_tag in m.tags
      metavideos =
        Repo.all(query)
        |> Repo.preload(:videos)

      render(conn, "index.html", metavideos: metavideos)
    end
  end
end
