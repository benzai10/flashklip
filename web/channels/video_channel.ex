defmodule Flashklip.VideoChannel do
  use Flashklip.Web, :channel
  alias Flashklip.KlipView

  def join("videos:" <> video_id, params, socket) do
    last_seen_id = params["last_seen_id"] || 0
    video_id = String.to_integer(video_id)
    video = Repo.get!(Flashklip.Video, video_id)

    klips = Repo.all(
      from k in assoc(video, :klips),
        where: k.id > ^last_seen_id,
        order_by: [asc: k.at, asc: k.id],
        limit: 200,
        preload: [:user]
    )

    resp = %{klips: Phoenix.View.render_many(klips, KlipView, "klip.json")}
    {:ok, resp, assign(socket, :video_id, video_id)}
  end

  def handle_in(event, params, socket) do
    user = Repo.get(Flashklip.User, socket.assigns.user_id)
    handle_in(event, params, user, socket)
  end

  def handle_in("new_klip", params, user, socket) do
    changeset =
      user
      |> build_assoc(:klips, video_id: socket.assigns.video_id)
      |> Flashklip.Klip.changeset(params)

    case Repo.insert(changeset) do
      {:ok, klip} ->
        broadcast! socket, "new_klip", %{
          id: klip.id,
          user: Flashklip.UserView.render("user.json", %{user: user}),
          content: klip.content,
          at: klip.at
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
