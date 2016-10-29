defmodule Flashklip.VideoChannel do
  use Flashklip.Web, :channel
  alias Flashklip.KlipView
  require IEx
  require Logger

  def join("videos:" <> video_id, params, socket) do
    last_seen_id = params["last_seen_id"] || 0
    video_id = String.to_integer(video_id)
    # video = Repo.get!(Flashklip.Video, video_id)
    metavideo =
      Repo.get!(Flashklip.Metavideo, video_id)
      |> Repo.preload(:videos)

      # the following query shows all klips
      # TODO: add query to preload of klips (filter copy_from from other users)
      klips_query = from k in Flashklip.Klip, where: k.id > ^last_seen_id
      metavideo_klips =
        metavideo.videos
        |> Repo.preload(klips: from(k in Flashklip.Klip,
                               where: k.id > ^last_seen_id))

      klips = Enum.flat_map(metavideo_klips, fn(v) ->
        v.klips
        |> Repo.preload(:user) end)
        |> Enum.sort()

      # the following query shows only the user's klips

      # query =
      #   from k in Flashklip.Klip,
      #   join: v in Flashklip.Video,
      #   on: k.video_id == v.id,
      #   where: v.metavideo_id == ^metavideo.id,
      #   preload: [:user]

      # klips = Repo.all(query)

    # klips = Repo.all(
    #   from k in assoc(video, :klips),
    #     where: k.id > ^last_seen_id,
    #     order_by: [asc: k.at, asc: k.id],
    #     limit: 200,
    #     preload: [:user]
    # )

    resp = %{klips: Phoenix.View.render_many(klips, KlipView, "klip.json")}
      {:ok, resp, assign(socket, :video_id, video_id)}
  end

  def handle_in(event, params, socket) do
    user = Repo.get(Flashklip.User, socket.assigns.user_id)
    handle_in(event, params, user, socket)
  end

  def handle_in("new_klip", params, user, socket) do
    # first part means there's no user's video to save klips yet
    if String.to_integer(params["user_video_id"]) == 0 do
      changeset =
        user
        |> build_assoc(:videos, metavideo_id: socket.assigns.video_id)
        |> Flashklip.Video.changeset(%{})

      case Repo.insert(changeset) do
        {:ok, video} ->
          changeset =
            user
            # |> build_assoc(:klips, video_id: socket.assigns.video_id)
            |> build_assoc(:klips, video: video)
            |> Flashklip.Klip.changeset(params)

          case Repo.insert(changeset) do
            {:ok, klip} ->
              broadcast! socket, "new_klip", %{
                id: klip.id,
                user: Flashklip.UserView.render("user.json", %{user: user}),
                content: klip.content,
                at: klip.at,
                video_id: klip.video_id,
                copy_from: klip.copy_from,
                redirect: true
              }
              {:reply, :ok, socket}

            {:error, changeset} ->
              {:reply, {:error, %{errors: changeset}}, socket}
          end

        {:error, changeset} ->
          {:reply, {:error, %{errors: changeset}}, socket}
      end
    else
      changeset =
        user
        # |> build_assoc(:klips, video_id: socket.assigns.video_id)
        |> build_assoc(:klips, video_id: String.to_integer(params["user_video_id"]))
        |> Flashklip.Klip.changeset(params)

      case Repo.insert(changeset) do
        {:ok, klip} ->
          broadcast! socket, "new_klip", %{
            id: klip.id,
            user: Flashklip.UserView.render("user.json", %{user: user}),
            content: klip.content,
            copy_from: klip.copy_from,
            at: klip.at
          }
          {:reply, :ok, socket}

        {:error, changeset} ->
          {:reply, {:error, %{errors: changeset}}, socket}
      end
    end
  end

  def handle_in("update_klip", params, _user, socket) do
    user = Flashklip.Repo.get(Flashklip.User, socket.assigns.user_id)
    klip = Flashklip.Repo.get!(Flashklip.Klip, params["id"])

    changeset =
      klip
      |> Flashklip.Klip.changeset(params)
    # add delete restriction here if user != current_user

    case Flashklip.Repo.update(changeset)  do
      {:ok, klip} ->
        broadcast! socket, "update_klip", %{
          id: klip.id,
          at: klip.at,
          # type: ann.type,
          user: Flashklip.UserView.render("user.json", %{user: user}),
          content: klip.content
        }
        {:reply, :ok, socket}
      {:error, changeset} ->
        {:reply, {:error, %{errors: changeset}}, socket}
    end
  end

  def handle_in("delete_klip", params, _user, socket) do
    # why do I have to get the record first before deleting??
    klip = Flashklip.Repo.get!(Flashklip.Klip, params["id"])
    # add delete restriction here if user != current_user

    Flashklip.Repo.delete!(klip)

    broadcast! socket, "delete_klip", %{id: params["id"]}
    {:reply, :ok, socket}
  end
end
