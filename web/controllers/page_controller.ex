defmodule Flashklip.PageController do
  use Flashklip.Web, :controller

  alias Flashklip.{
    Metavideo,
    Klip
  }

  def index(conn, _params) do
    metavideo_query = from m in Metavideo,
      order_by: [desc: :updated_at]
      # limit: 10

    metavideos =
      Repo.all(metavideo_query)
      |> Repo.preload(:videos)

    klips_query = from k in Klip,
      order_by: [desc: :updated_at]
      # limit: 10

    klips =
      Repo.all(klips_query)
      |> Repo.preload([:user, :video])

    render(conn, "index.html", metavideos: metavideos, klips: klips)
  end

  def explore(conn, params) do
    search_tag = params["search"]
    if is_nil(search_tag) do
      metavideo_query = from m in Metavideo,
        order_by: [desc: :updated_at]

      metavideos =
        Repo.all(metavideo_query)
        |> Repo.preload(:videos)

      klips_query = from k in Klip,
        order_by: [desc: :updated_at]

      klips =
        Repo.all(klips_query)
        |> Repo.preload([:user, :video])

      render(conn, "explore.html", metavideos: metavideos, klips: klips)
    else
      query = from m in Metavideo,
        where: ^search_tag in m.tags
      metavideos =
        Repo.all(query)
        |> Repo.preload(:videos)

      render(conn, "explore.html", metavideos: metavideos, klips: nil)
    end
  end
end
