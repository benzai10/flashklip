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
end
