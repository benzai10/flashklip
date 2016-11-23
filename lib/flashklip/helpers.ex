defmodule Flashklip.Helpers do

  def convert_to_min_sec(milliseconds) do
    minutes = milliseconds / 60000
    seconds =
      trunc((minutes - trunc(minutes)) * 60)
      |> Integer.to_string
      |> String.rjust(2, ?0)
    minutes =
      trunc(minutes)
      |> Integer.to_string
      |> String.rjust(2, ?0)

    minutes <> ":" <> seconds
  end

  def video_id_for_klip(videos, klip, user_id) do
    checklist =
      videos
      |> Enum.map(fn(x) -> Map.take(x, [:user_id, :id, :metavideo_id]) end)

    Enum.find(checklist, fn(x) -> x[:metavideo_id] == klip.video.metavideo_id && x[:user_id] == user_id end)[:id]
  end
end
