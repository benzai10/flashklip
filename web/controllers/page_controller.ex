defmodule Flashklip.PageController do
  use Flashklip.Web, :controller

  alias Flashklip.{
    User,
    Metavideo,
    Klip
  }

  def action(conn, _) do
    apply(__MODULE__, action_name(conn),
      [conn, conn.params, conn.assigns.current_user])
  end

  def index(conn, _params, current_user) do
    metavideo_query = from m in Metavideo,
      order_by: [desc: :updated_at],
      limit: 30

    metavideos =
      Repo.all(metavideo_query)
      |> Repo.preload(:videos)

    if current_user do
      not_copied_klips_query = from k in Klip,
        where: k.copy_from == 0 and k.user_id != ^current_user.id

      own_copied_klips_query = from k in Klip,
        where: k.user_id == ^current_user.id and k.copy_from > 0

      klips_query = from k in not_copied_klips_query,
        left_join: o in subquery(own_copied_klips_query),
        on: k.id == o.copy_from,
        where: is_nil(o.copy_from),
        limit: 30

      klips =
        Repo.all(klips_query)
        |> Repo.preload([:user, {:video, :metavideo}])
    else
      klips_query = from k in Klip,
        where: k.copy_from == 0,
        order_by: [desc: :updated_at],
        limit: 30

      klips =
        Repo.all(klips_query)
        |> Repo.preload([:user, {:video, :metavideo}])
    end

    if current_user do
      changeset = Flashklip.User.username_changeset(current_user, _params)
    end

    render(conn, "index.html", metavideos: metavideos, klips: klips, changeset: changeset)
  end

  def explore(conn, params, current_user) do
    search_tag = params["search"]
    if is_nil(search_tag) do
      metavideo_query = from m in Metavideo,
        order_by: [desc: :updated_at]

      metavideos =
        Repo.all(metavideo_query)
        |> Repo.preload(:videos)

      if current_user do
        not_copied_klips_query = from k in Klip,
          where: k.copy_from == 0 and k.user_id != ^current_user.id

        own_copied_klips_query = from k in Klip,
          where: k.user_id == ^current_user.id and k.copy_from > 0

        klips_query = from k in not_copied_klips_query,
          left_join: o in subquery(own_copied_klips_query),
          on: k.id == o.copy_from,
          where: is_nil(o.copy_from),
          limit: 30

        klips =
          Repo.all(klips_query)
          |> Repo.preload([:user, {:video, :metavideo}])
      else
          klips_query = from k in Klip,
            where: k.copy_from == 0,
            order_by: [desc: :updated_at],
            limit: 30

          klips =
            Repo.all(klips_query)
            |> Repo.preload([:user, {:video, :metavideo}])
      end

      popular_tags_query = "select unnest(tags), count(tags) from metavideos group by unnest(tags) order by count desc limit 30"

      popular_tags = Ecto.Adapters.SQL.query!(Repo, popular_tags_query, []).rows

      render(conn, "explore.html", popular_tags: popular_tags, metavideos: metavideos, klips: klips)
    else
      query = from m in Metavideo,
        where: ^search_tag in m.tags
      metavideos =
        Repo.all(query)
        |> Repo.preload(:videos)

      popular_tags_query = "select unnest(tags), count(tags) from metavideos group by unnest(tags) order by count desc limit 30;"

      popular_tags = Ecto.Adapters.SQL.query!(Repo, popular_tags_query, []).rows

      render(conn, "explore.html", popular_tags: popular_tags, metavideos: metavideos, klips: nil)
    end

  end
end
