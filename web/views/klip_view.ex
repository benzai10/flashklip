defmodule Flashklip.KlipView do
  use Flashklip.Web, :view

  def render("klip.json", %{klip: klip}) do
    %{
      id: klip.id,
      content: klip.content,
      at: klip.at,
      user: render_one(klip.user, Flashklip.UserView, "user.json")
    }
  end
end
