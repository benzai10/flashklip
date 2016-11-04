defmodule Flashklip.VideoController do
  use Flashklip.Web, :controller

  alias Flashklip.Video
  alias Flashklip.Metavideo

  # plug :scrub_params, "video" when action in [:create, :update]

  def action(conn, _) do
    apply(__MODULE__, action_name(conn),
      [conn, conn.params, conn.assigns.current_user])
  end

  def index(conn, params, user) do
    search_tag = params["search"]
    if is_nil(search_tag) do
      videos =
        Repo.all(user_videos(user))
        |> Enum.map(fn(v) -> Repo.preload(v, [:metavideo, :klips]) end)
    else
      videos =
        Repo.all(user_videos_filtered(user, search_tag))
        |> Enum.map(fn(v) -> Repo.preload(v, [:metavideo, :klips]) end)
    end
    klips = Enum.flat_map(videos, fn(v) -> v.klips end)
    metavideos = Enum.map(videos, fn(v) -> v.metavideo end)
    render(conn, "index.html", videos: videos, klips: klips, metavideos: metavideos)
  end

  def new(conn, _params, user) do
    changeset =
      user
      |> build_assoc(:videos)
      |> Video.changeset()

    render(conn, "new.html", changeset: changeset)
  end

  def create(conn, %{"video" => video_params, "taggles" => tags_params}, user) do
    metavideo = case Repo.get_by(Metavideo, url: video_params["url"]) do
                  nil ->
                    %Metavideo{url: video_params["url"],
                               tags: tags_params}
                  metavideo ->
                    metavideo
    end

    metavideo_changeset = Metavideo.changeset(metavideo)

    metavideo = Repo.insert_or_update!(metavideo_changeset)

    changeset =
      user
      |> build_assoc(:videos, metavideo_id: metavideo.id)
      |> Video.changeset(video_params)

    case Repo.insert(changeset) do
      {:ok, video} ->
        conn
        |> put_flash(:info, "Video created successfully.")
        |> redirect(to: watch_path(conn, :show, video, v: video.id))
      {:error, changeset} ->
        render(conn, "new.html", changeset: changeset)
    end
  end

  def show(conn, %{"id" => id}, user) do
    video = Repo.get!(user_videos(user), id)
    render(conn, "show.html", video: video)
  end

  def edit(conn, %{"id" => id}, user) do
    video =
      Repo.get!(user_videos(user), id)
      |> Repo.preload(:metavideo)
    changeset = Video.changeset(video)
    render(conn, "edit.html", video: video, changeset: changeset)
  end

  def update(conn, %{"id" => id, "video" => video_params}, user) do
    video = Repo.get!(user_videos(user), id)
    changeset = Video.changeset(video, video_params)

    case Repo.update(changeset) do
      {:ok, video} ->
        conn
        |> put_flash(:info, "Video updated successfully.")
        |> redirect(to: video_path(conn, :show, video))
      {:error, changeset} ->
        render(conn, "edit.html", video: video, changeset: changeset)
    end
  end

  def update(conn, %{"id" => id, "taggles" => tags_params}, user) do
    video = Repo.get!(user_videos(user), id) |> Repo.preload(:metavideo)
    metavideo = video.metavideo
    changeset = Metavideo.changeset(metavideo, %{"tags" => tags_params})

    case Repo.update(changeset) do
      {:ok, _metavideo} ->
        conn
        |> put_flash(:info, "Tags updated successfully.")
        |> redirect(to: watch_path(conn, :show, video, v: video.id))
      {:error, changeset} ->
        render(conn, "edit.html", video: video, changeset: changeset)
    end
  end

  # this update action is for deleting all tags
  def update(conn, %{"id" => id}, user) do
    video = Repo.get!(user_videos(user), id) |> Repo.preload(:metavideo)
    metavideo = video.metavideo
    changeset = Metavideo.changeset(metavideo, %{"tags" => []})

    case Repo.update(changeset) do
      {:ok, _metavideo} ->
        conn
        |> put_flash(:info, "Tags deleted successfully.")
        |> redirect(to: watch_path(conn, :show, video, v: video.id))
      {:error, changeset} ->
        render(conn, "edit.html", video: video, changeset: changeset)
    end
  end

  def delete(conn, %{"id" => id}, user) do
    video = Repo.get!(user_videos(user), id)

    # Here we use delete! (with a bang) because we expect
    # it to always work (and if it does not, it will raise).
    Repo.delete!(video)

    conn
    |> put_flash(:info, "Video deleted successfully.")
    |> redirect(to: video_path(conn, :index))
  end

  defp user_videos(user) do
    assoc(user, :videos)
  end

  defp user_videos_filtered(user, search_tag) do
    query = from v in Video,
      join: m in Metavideo, on: v.metavideo_id == m.id and ^search_tag in m.tags,
      where: v.user_id == ^user.id
  end
end
