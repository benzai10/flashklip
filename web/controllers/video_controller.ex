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

    metavideos_ids =
      metavideos
      |> Enum.map(&(Integer.to_string(&1.id) <> ", " ))
      |> List.to_string
      |> String.replace_trailing(", ", "")

    if String.length(metavideos_ids) > 0 do

      popular_tags_query = "select unnest(tags), count(tags) from metavideos where id in" <> "(" <> metavideos_ids <> ")" <> " group by unnest(tags) order by count desc limit 30;"
      popular_tags = Ecto.Adapters.SQL.query!(Repo, popular_tags_query, []).rows
    else
      popular_tags = %{}
    end

    # if popular_tags? do
    #   popular_tags = Ecto.Adapters.SQL.query!(Repo, popular_tags_query, []).rows
    # else
    #   popular_tags = %{}
    # end

    render(conn, "index.html", videos: videos, klips: klips, metavideos: metavideos, popular_tags: popular_tags)
  end

  def new(conn, _params, user) do
    changeset =
      user
      |> build_assoc(:videos)
      |> Video.changeset()

    render(conn, "new.html", changeset: changeset)
  end

  def create(conn, %{"video" => video_params}, user) do
    # strip the id from the url
    youtube_video_id =
      ~r{^.*(?:youtu\.be/|\w+/|v=)(?<id>[^#&?]*)}
    |> Regex.named_captures(video_params["url"])
    |> get_in(["id"])

    metavideo = case Repo.get_by(Metavideo, youtube_video_id: youtube_video_id) do
                  nil ->
                    %Metavideo{url: video_params["url"], youtube_video_id: youtube_video_id}
                  metavideo ->
                    metavideo
                end

    metavideo_changeset = Metavideo.changeset(metavideo, %{"tags" => conn.params["taggles"]})

    if metavideo_changeset.valid? do
      metavideo = Repo.insert_or_update!(metavideo_changeset)

      changeset =
        user
        |> build_assoc(:videos, metavideo_id: metavideo.id)
        |> Video.changeset(video_params)

      case Repo.insert(changeset) do
        {:ok, video} ->
          conn
          |> put_flash(:info, "Video [#{metavideo.title}] got added successfully.")
          |> redirect(to: watch_path(conn, :show, video, v: video.id, at: 0))
        {:error, changeset} ->
          render(conn, "new.html", changeset: changeset)
      end
    else
      changeset =
        user
        |> build_assoc(:videos)
        |> Video.changeset(%{"error" => "empty or invalid url"})

      conn
      |> put_flash(:error, "Empty or invalid Youtube link")
      |> redirect(to: video_path(conn, :new))
      # render(conn, "new.html", changeset: changeset)
    end
  end

  def create(conn, %{"video" => video_params, "taggles" => tags_params}, user) do
    metavideo = case Repo.get_by(Metavideo, url: video_params["url"]) do
                  nil ->
                    %Metavideo{url: video_params["url"],
                               tags: Enum.take(tags_params, 10)}
                  metavideo ->
                    metavideo
    end

    metavideo_changeset = Metavideo.changeset(metavideo)

    if metavideo_changeset.valid? do
      metavideo = Repo.insert_or_update!(metavideo_changeset)
      changeset =
        user
        |> build_assoc(:videos, metavideo_id: metavideo.id)
        |> Video.changeset(video_params)

      case Repo.insert(changeset) do
        {:ok, video} ->
          conn
          |> put_flash(:info, "Video [#{metavideo.title}] got added successfully.")
          |> redirect(to: watch_path(conn, :show, video, v: video.id, at: 0))
          |> redirect(to: watch_path(conn, :show, video, v: video.id, at: 0))
        {:error, changeset} ->
          render(conn, "new.html", changeset: changeset)
      end
    else
      changeset =
        user
        |> build_assoc(:videos)
        |> Video.changeset()

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
        |> put_flash(:info, 'Video got added successfully.')
        |> redirect(to: video_path(conn, :show, video))
      {:error, changeset} ->
        render(conn, "edit.html", video: video, changeset: changeset)
    end
  end

  def update(conn, %{"id" => id, "taggles" => tags_params}, user) do
    video = Repo.get!(user_videos(user), id) |> Repo.preload(:metavideo)
    metavideo = video.metavideo
    changeset = Metavideo.changeset(metavideo, %{"tags" => Enum.take(tags_params, 10)})

    case Repo.update(changeset) do
      {:ok, _metavideo} ->
        conn
        |> put_flash(:info, "Tags updated successfully.")
        |> redirect(to: watch_path(conn, :show, video, v: video.id, at: 0))
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
        |> redirect(to: watch_path(conn, :show, video, v: video.id, at: 0))
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
