defmodule Flashklip.WatchView do
  use Flashklip.Web, :view

  def player_id(video) do
    ~r{^.*(?:youtu\.be/|\w+/|v=)(?<id>[^#&?]*)}
    |> Regex.named_captures(video.metavideo.url)
    |> get_in(["id"])
  end
end
