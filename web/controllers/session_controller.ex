defmodule Flashklip.SessionController do
  use Flashklip.Web, :controller

  alias Flashklip.{User, Auth}

  ### passwordless auth
  def new(conn, _params) do
    changeset = User.changeset(%User{})
    render conn, "new.html", changeset: changeset
  end

  def create(conn, %{"user" => user_params}) do
    user_struct =
      case Repo.get_by(User, email: user_params["email"]) do
        nil -> %User{email: user_params["email"], username: user_params["username"]}
        user -> user
      end
      |> User.registration_changeset(user_params)

    case Repo.insert_or_update(user_struct) do
      {:ok, user} ->
        Task.async(fn -> Flashklip.Mailer.send_login_token(user) end)
        conn
        |> put_flash(:info, "Please check your email inbox and click the link to sign in")
        |> redirect(to: page_path(conn, :index))
      {:error, changeset} ->
        render(conn, "new.html", changeset: changeset)
    end
  end

  def show(conn, %{"id" => access_token}) do
    case Repo.get_by(User, access_token: access_token) do
      nil ->
        conn
        |> put_flash(:error, "Access token not found or expired.")
        |> redirect(to: page_path(conn, :index))
      user ->
        if is_nil(user.username) do
          conn
          |> Auth.login(user)
          |> redirect(to: video_path(conn, :index))
        else
          conn
          |> Auth.login(user)
          |> put_flash(:info, "Welcome #{user.username}")
          |> redirect(to: video_path(conn, :index))
        end
    end
  end

  def delete(conn, _params) do
    conn
    |> Auth.logout()
    |> put_flash(:info, "User logged out.")
    |> redirect(to: page_path(conn, :index))
  end

end
