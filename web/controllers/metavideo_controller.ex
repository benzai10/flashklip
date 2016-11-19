defmodule Flashklip.MetavideoController do
  use Flashklip.Web, :controller

  alias Flashklip.Metavideo

  plug :authorize_admin when action in [:index, :new, :create, :show, :update, :delete]

  def index(conn, _params) do
    metavideos = Repo.all(Metavideo) |> Repo.preload(:videos)
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

  def update(conn, %{"id" => id, "metavideo" => metavideo_params, "taggles" => tags_params}) do
    metavideo = Repo.get!(Metavideo, id)
    changeset =
      Metavideo.changeset(metavideo,
        Map.merge(metavideo_params, %{"tags" => tags_params}))

    case Repo.update(changeset) do
      {:ok, metavideo} ->
        conn
        |> put_flash(:info, "Metavideo updated successfully.")
        |> redirect(to: metavideo_path(conn, :show, metavideo))
      {:error, changeset} ->
        render(conn, "edit.html", metavideo: metavideo, changeset: changeset)
    end
  end

  def update(conn, %{"id" => id, "metavideo" => _metavideo_params}) do
    metavideo = Repo.get!(Metavideo, id)
    changeset = Metavideo.changeset(metavideo)

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

  defp authorize_admin(conn, _opts) do
    if conn.assigns.current_user.role == "admin" do
      conn
    else
      conn
      |> put_flash(:error, "Access restricted to admins")
      |> redirect(to: page_path(conn, :index))
      |> halt()
    end
  end

end

