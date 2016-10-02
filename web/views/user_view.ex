defmodule Flashklip.UserView do
  use Flashklip.Web, :view
  alias Flashklip.User

  def render("user.json", %{user: user}) do
    %{id: user.id, username: user.username}
  end
end
