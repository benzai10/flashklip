defmodule Flashklip.KlipController do
  use Flashklip.Web, :controller

  alias Flashklip.Klip
  alias Flashklip.Video

  def action(conn, _) do
    apply(__MODULE__, action_name(conn),
      [conn, conn.params, conn.assigns.current_user])
  end

  def index(conn, params, user) do
    query =
      case is_nil(params["search"]) do
        true ->
          from k in Klip,
            where: k.user_id == ^user.id,
            order_by: [desc: :updated_at]
        _ ->
          from k in Klip,
            where: k.user_id == ^user.id and ilike(k.content, ^("%" <> params["search"]["search"] <> "%")),
            order_by: [desc: :updated_at]
      end

    page =
      query
      |> preload([:user, {:video, :metavideo}])
      |> Repo.paginate(params)

    query =
      from v in Video,
      where: v.user_id == ^user.id

    videos = Repo.all(query)

    render(conn, "index.html",
      page: page,
      klips: page.entries,
      videos: videos,
      page_number: page.page_number,
      page_size: page.page_size,
      total_pages: page.total_pages,
      total_entries: page.total_entries)
  end

end
