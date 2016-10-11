defmodule Flashklip.MetavideoController do
  use Flashklip.Web, :controller

  alias Flashklip.Metavideo

  # plug :scrub_params, "video" when action in [:create, :update]

  def index(conn, _params) do
    metavideos = Repo.all(Metavideo)
    render(conn, "index.html", metavideos: metavideos)
  end

  def new(conn, _params) do
    changeset = Metavideo.changeset(%Metavideo{})
    render(conn, "new.html", changeset: changeset)
  end

  def create(conn, %{"metavideo" => metavideo_params}) do
    changeset = Metavideo.changeset(%Metavideo{}, metavideo_params)

    case Repo.insert(changeset) do
      {:ok, _metavideo} ->
        conn
        |> put_flash(:info, "Metavideo created successfully.")
        |> redirect(to: metavideo_path(conn, :index))
      {:error, changeset} ->
        render(conn, "new.html", changeset: changeset)
    end
  end

  def show(conn, %{"id" => id}) do
    metavideo = Repo.get!(Metavideo, id)
    render(conn, "show.html", metavideo: metavideo)
  end

  def edit(conn, %{"id" => id}) do
    metavideo = Repo.get!(Metavideo, id)
    changeset = Metavideo.changeset(metavideo)
    render(conn, "edit.html", metavideo: metavideo, changeset: changeset)
  end

  def update(conn, %{"id" => id, "metavideo" => metavideo_params}) do
    metavideo = Repo.get!(Metavideo, id)
    changeset = Metavideo.changeset(metavideo, metavideo_params)

    case Repo.update(changeset) do
      {:ok, metavideo} ->
        conn
        |> put_flash(:info, "Metavideo updated successfully.")
        |> redirect(to: metavideo_path(conn, :show, metavideo))
      {:error, changeset} ->
        render(conn, "edit.html", metavideo: metavideo, changeset: changeset)
    end
  end

  def delete(conn, %{"id" => id}) do
    metavideo = Repo.get!(Metavideo, id)

    # Here we use delete! (with a bang) because we expect
    # it to always work (and if it does not, it will raise).
    Repo.delete!(metavideo)

    conn
    |> put_flash(:info, "Metavideo deleted successfully.")
    |> redirect(to: metavideo_path(conn, :index))
  end
end
