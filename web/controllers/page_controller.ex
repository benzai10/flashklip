defmodule Flashklip.PageController do
  use Flashklip.Web, :controller

  def index(conn, _params) do
    render conn, "index.html"
  end
end
