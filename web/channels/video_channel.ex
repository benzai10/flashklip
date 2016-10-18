defmodule Flashklip.VideoChannel do
  use Flashklip.Web, :channel

  def join("videos:" <> video_id, _params, socket) do
    {:ok, socket}
  end

  def handle_in("new_klip", params, socket) do
    broadcast! socket, "new_klip", %{
      user: %{username: "anon"},
      body: params["body"],
      at: params["at"]
    }

    {:reply, :ok, socket}
  end

end
