defmodule Flashklip.PageController do
  use Flashklip.Web, :controller
  require IEx

  alias Flashklip.{
    User,
    Metavideo,
    Video,
    Klip
  }

  def action(conn, _) do
    apply(__MODULE__, action_name(conn),
      [conn, conn.params, conn.assigns.current_user])
  end

  def index(conn, params, current_user) do
    metavideo_query = from m in Metavideo,
      order_by: [desc: :updated_at],
      limit: 50

    metavideos =
      Repo.all(metavideo_query)
      |> Repo.preload(:videos)

    videos_query = from v in Video,
      limit: 50

    videos = Repo.all(videos_query)

    klips =
      case current_user do
        true -> user_klips_index(current_user)
        _ -> klips_index
      end

    if current_user do
      changeset = Flashklip.User.username_changeset(current_user, params)
    end
    # changeset = User.username_changeset(current_user, params)

    render(conn, "index.html", metavideos: metavideos, videos: videos, klips: klips, changeset: changeset)
  end

  def explore(conn, params, current_user) do
    search_tag = params["tag"]
    search_string = params["search"]["search"]
    if is_nil(search_tag) && is_nil(search_string) do
      metavideo_query = from m in Metavideo,
        order_by: [desc: :updated_at],
        limit: 50

      metavideos =
        Repo.all(metavideo_query)
        |> Repo.preload(:videos)

      videos = Repo.all(Video)

      klips =
        case current_user do
          true -> user_klips_index(current_user)
          _ -> klips_index
        end
      # if current_user do
      #   not_copied_klips_query = from k in Klip,
      #     where: k.copy_from == 0 and k.user_id != ^current_user.id,
      #     order_by: [desc: :updated_at]

      #   own_copied_klips_query = from k in Klip,
      #     where: k.user_id == ^current_user.id and k.copy_from > 0,
      #     order_by: [desc: :updated_at]

      #   klips_query = from k in not_copied_klips_query,
      #     left_join: o in subquery(own_copied_klips_query),
      #     on: k.id == o.copy_from,
      #     where: is_nil(o.copy_from),
      #     order_by: [desc: :updated_at],
      #     limit: 50

      #   klips =
      #     Repo.all(klips_query)
      #     |> Repo.preload([:user, {:video, :metavideo}])
      # else
      #     klips_query = from k in Klip,
      #       where: k.copy_from == 0,
      #       order_by: [desc: :updated_at],
      #       limit: 50

      #     klips =
      #       Repo.all(klips_query)
      #       |> Repo.preload([:user, {:video, :metavideo}])
      # end

      popular_tags_query = "select unnest(tags), count(tags) from metavideos group by unnest(tags) order by count desc limit 30"

      popular_tags = Ecto.Adapters.SQL.query!(Repo, popular_tags_query, []).rows

      render(conn, "explore.html",
        popular_tags: popular_tags,
        metavideos: metavideos,
        videos: videos,
        klips: klips,
        video_tab_title: "Resources",
        tags_callout_title: "Popular Tags"
      )
    else
      if !is_nil(params["tag"]) do
        videos = Repo.all(Video)

        query = from m in Metavideo,
          where: ^search_tag in m.tags,
          limit: 50

        metavideos =
          Repo.all(query)
          |> Repo.preload(:videos)

        metavideos_ids =
          metavideos
          |> Enum.map(&(Integer.to_string(&1.id) <> ", " ))
          |> List.to_string
          |> String.replace_trailing(", ", "")

        popular_tags_query = "select unnest(tags), count(tags) from metavideos where id in" <> "(" <> metavideos_ids <> ")" <> " group by unnest(tags) order by count desc limit 30;"

        # popular_tags = Ecto.Adapters.SQL.query!(Repo, popular_tags_query, ["(" <> metavideos_ids <> ")"]).rows
        popular_tags = Ecto.Adapters.SQL.query!(Repo, popular_tags_query, []).rows

        render(conn, "explore.html",
          popular_tags: popular_tags,
          metavideos: metavideos,
          videos: videos,
          klips: nil,
          tags_callout_title: "Filtered Tags",
          video_tab_title: "Filter on '" <> params["tag"] <> "'"

        )
      else
        # if !is_nil(params["search"]) do
        query = from k in Klip,
          where: ilike(k.content, ^("%" <> search_string <> "%")),
          limit: 50

        klips =
          Repo.all(query)
          |> Repo.preload([:user, {:video, :metavideo}])

        video_query =
          case current_user do
            true -> from v in Video, where: v.user_id == ^current_user.id
            _ -> from v in Video

          end

        videos = Repo.all(video_query)

        render(conn, "search_results.html", videos: videos, klips: klips)
      end
    end
  end

  def letsencrypt(conn, %{"id" => id}, _current_user) do
    text conn, "#{id}" <> "." <> Application.get_env(:flashklip, :letsencrypt_key)
  end

  defp klips_index do
    klips_query = from k in Klip,
      where: k.copy_from == 0,
      order_by: [desc: :updated_at],
      limit: 50

    Repo.all(klips_query)
    |> Repo.preload([:user, {:video, :metavideo}])
  end

  defp user_klips_index(user) do
    not_copied_klips_query = from k in Klip,
      where: k.copy_from == 0 and k.user_id != ^user.id

    own_copied_klips_query = from k in Klip,
      where: k.user_id == ^user.id and k.copy_from > 0

    klips_query = from k in not_copied_klips_query,
      left_join: o in subquery(own_copied_klips_query),
      on: k.id == o.copy_from,
      where: is_nil(o.copy_from),
      limit: 50

    Repo.all(klips_query)
    |> Repo.preload([:user, {:video, :metavideo}])
  end
end
