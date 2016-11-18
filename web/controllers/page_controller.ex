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
      conn |> redirect(to: video_path(conn, :index))
    else
      changeset = nil
      render(conn, "index.html", metavideos: metavideos, videos: videos, klips: klips, changeset: changeset)
    end

  end

  def videos(conn, params, current_user) do
    user_id =
      case is_nil(current_user) do
        true ->
          0
        _ ->
          current_user.id
      end

    query =
      case is_nil(params["tag"]) do
        true ->
          from m in Metavideo,
            left_join: v in Video,
            on: m.id == v.metavideo_id and v.user_id == ^user_id,
            where: is_nil(v.user_id)
        _ ->
          from m in Metavideo,
            left_join: v in Video,
            on: m.id == v.metavideo_id and v.user_id == ^user_id,
            where: is_nil(v.user_id) and ^params["tag"] in m.tags
      end

    page =
      query
      |> Repo.paginate(params)

    popular_tags_query = "select unnest(tags), count(tags) from metavideos group by unnest(tags) order by count desc limit 30"

    popular_tags = Ecto.Adapters.SQL.query!(Repo, popular_tags_query, []).rows

    render(conn, "videos.html",
      popular_tags: popular_tags,
      page: page,
      videos: page.entries,
      page_number: page.page_number,
      page_size: page.page_size,
      total_pages: page.total_pages,
      total_entries: page.total_entries)
  end

  def klips(conn, params, current_user) do
    user_id =
      case is_nil(current_user) do
        true ->
          0
        _ ->
          current_user.id
      end

    query =
      case is_nil(params["search"]["search"]) do
        true ->
          from k in Klip,
          where: k.user_id != ^user_id and k.copy_from == 0
        _ ->
          from k in Klip,
            where: k.user_id != ^user_id and k.copy_from == 0 and ilike(k.content, ^("%" <> params["search"]["search"] <> "%"))
      end

    page =
      query
      |> preload([:user, {:video, :metavideo}])
      |> Repo.paginate(params)

    video_query = Flashklip.Video |> where([v], v.user_id == ^user_id)
    videos = Repo.all(video_query)

    render(conn, "klips.html",
      page: page,
      klips: page.entries,
      videos: videos,
      page_number: page.page_number,
      page_size: page.page_size,
      total_pages: page.total_pages,
      total_entries: page.total_entries)
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
