defmodule Flashklip.PageView do
  use Flashklip.Web, :view
  import Scrivener.HTML

  def klip_video_id(user, klip, videos) do
    case user do
      true -> Flashklip.Helpers.video_id_for_klip(videos, klip, user.id)
      _ -> nil
    end
  end
end
