defmodule Flashklip.Metavideo do
  use Flashklip.Web, :model

  alias Flashklip.{
    Repo,
    Video,
    Klip
  }

  schema "metavideos" do
    field :url, :string
    field :title, :string
    field :youtube_video_id, :string
    field :created_by, :integer
    field :tags, {:array, :string}
    has_many :videos, Video, on_delete: :delete_all

    timestamps()
  end

  @required_fields ~w(url youtube_video_id)
  @optional_fields ~w(title tags created_by)

  @doc """
  Builds a changeset based on the `struct` and `params`.
  """
  def changeset(struct, params \\ %{}) do
    struct
    |> get_title()
    |> cast(params, [:url, :title, :youtube_video_id, :tags, :created_by])
    |> validate_required([:url])
    |> validate_required([:title])
    |> unique_constraint(:youtube_video_id)
  end

  def existing_user_video(videos, user) do
    if user do
      Enum.filter(videos, fn(v) -> v.user_id == user.id end)
      |> Enum.at(0)
    else
      nil
    end
  end

  def klips_count(metavideo) do
    query =
      from v in Video,
      join: k in Klip,
      on: v.id == k.video_id,
      where: v.metavideo_id == ^metavideo.id and k.copy_from == 0

    Repo.all(query) |> Enum.count()
  end

  defp get_title(struct) do
    %{struct | title: get_youtube_title(struct.url)}
  end

  defp get_youtube_title(str) do
    # strip the id from the url
    youtube_video_id =
      ~r{^.*(?:youtu\.be/|\w+/|v=)(?<id>[^#&?]*)}
      |> Regex.named_captures(str)
      |> get_in(["id"])
    # send the API call
    {:ok, {{_, resp, _}, _, body}} =
      :httpc.request(String.to_char_list("https://www.googleapis.com/youtube/v3/videos?id=" <> youtube_video_id <> "&key=" <> "AIzaSyDTeV8UtwCWOXATwMrlOvZf0id4On_O4Qc" <> "&part=snippet&fields=items(snippet(title))"))
    # if resp code = 200, dissect title
    if resp == 200 do
      body
      |> List.to_string
      |> String.split_at(-16)
      |> Tuple.to_list
      |> List.first
      |> String.split_at(48)
      |> Tuple.to_list
      |> List.last
    else
      ""
    end
  end
end
