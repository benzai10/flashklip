defmodule Flashklip.WatchController do
  use Flashklip.Web, :controller

  alias Flashklip.Metavideo
  alias Flashklip.Video

  def show(conn, %{"id" => id, "v" => v, "at" => at}) do
    user_id =
      case is_map(conn.assigns.current_user) do
        true -> conn.assigns.current_user.id
        _ -> 0
      end

    if String.to_integer(v) > 0 do
      video =
        Repo.get!(Video, id)
        |> Repo.preload(:metavideo)
      metavideo =
        Repo.get!(Metavideo, video.metavideo_id)
        |> Repo.preload(:videos)
      metavideo_klips =
        metavideo.videos
        |> Repo.preload(klips: from(k in Flashklip.Klip,
          where: k.copy_from == 0))

      klips =
        Enum.flat_map(metavideo_klips, fn(v) ->
          v.klips
          |> Repo.preload(:user) end)
          |> Enum.sort()
        if user_id == 0 || video.user_id != user_id do
          klips = Enum.filter(klips, fn(k) ->
            k.user.id == video.user_id && k.in_timeview == true end)
        end

      show =
        case is_map(conn.assigns.current_user) && conn.assigns.current_user.id == video.user_id do
          true ->
            ""
          _ ->
            "hide"
        end
      active_navi =
        case String.to_integer(at) > 0 do
          true ->
            ""
          _ ->
            "is-active"
        end
      active_live =
        case String.to_integer(at) > 0 do
          true ->
            "is-active"
          _ ->
            ""
        end
      scheduled_at =
        case is_nil(video.scheduled_at) do
          true ->
            nil
          _ ->
            DateTime.to_string(video.scheduled_at)
            |> String.slice(0..9)
        end
      render conn, "show.html", user_id: user_id, video: video.metavideo, user_video: video, user_video_id: video.id, klips: klips, show: show, at: at, video_user_id: video.user_id, active_navi: active_navi, active_live: active_live, scheduled_at: scheduled_at
    else
      metavideo =
        Repo.get!(Metavideo, id)
        |> Repo.preload(:videos)
      metavideo_klips =
        metavideo.videos
        |> Repo.preload(klips: from(k in Flashklip.Klip,
                               where: k.copy_from == 0))
      klips =
        Enum.flat_map(metavideo_klips, fn(v) ->
          v.klips
          |> Repo.preload(:user) end)
          |> Enum.sort()
      show =
        case is_map(conn.assigns.current_user)  do
          true ->
            ""
          _ ->
            "hide"
        end
      active_navi =
        case String.to_integer(at) > 0 do
          true ->
            ""
          _ ->
            "is-active"
        end
      active_live =
        case String.to_integer(at) > 0 do
          true ->
            "is-active"
          _ ->
            ""
        end
      render conn, "show.html", user_id: user_id, video: metavideo, user_video: nil, user_video_id: 0, klips: klips, show: show, at: at, video_user_id: 0, active_navi: active_navi, active_live: active_live, scheduled_at: nil
    end
  end
end
