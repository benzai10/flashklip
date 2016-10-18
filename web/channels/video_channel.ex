defmodule Flashklip.VideoChannel do
  use Flashklip.Web, :channel
  alias Flashklip.KlipView

  def join("videos:" <> video_id, _params, socket) do
    video_id = String.to_integer(video_id)
    video = Repo.get!(Flashklip.Video, video_id)

    klips = Repo.all(
      from k in assoc(video, :klips),
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
end
