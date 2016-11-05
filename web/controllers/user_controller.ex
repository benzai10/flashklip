defmodule Flashklip.UserController do
  use Flashklip.Web, :controller

  # plug :authenticate_user when action in [:index, :show]

	alias Flashklip.User

  # plug :authorize_admin when action in [:index]

  def index(conn, _params) do
    users = Repo.all(User)
    render conn, "index.html", users: users
  end

  def show(conn, %{"id" => id}) do
    user = Repo.get(User, id)
    render conn, "show.html", user: user
  end

	def new(conn, _params) do
		changeset = User.changeset(%User{})
		render conn, "new.html", changeset: changeset
	end

	def create(conn, %{"user" => user_params}) do
		# changeset = User.registration_changeset(%User{}, user_params)
		# case Repo.insert(changeset) do
		#   {:ok, user} ->
		# 		conn
    #     |> Flashklip.Auth.login(user)
		# 		|> put_flash(:info, "#{user.username} created!")
		# 		|> redirect(to: page_path(conn, :index))
		# 	{:error, changeset} ->
		# 		render(conn, "new.html", changeset: changeset)
		# end
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
