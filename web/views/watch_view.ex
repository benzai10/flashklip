defmodule Flashklip.WatchView do
  use Flashklip.Web, :view

  def player_id(metavideo) do
    ~r{^.*(?:youtu\.be/|\w+/|v=)(?<id>[^#&?]*)}
    |> Regex.named_captures(metavideo.url)
    |> get_in(["id"])
  end
end
