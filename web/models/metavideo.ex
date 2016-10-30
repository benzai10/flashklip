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
    field :created_by, :integer
    has_many :videos, Video

    timestamps()
  end

  @required_fields ~w(url)
  @optional_fields ~w(title created_by)

  @doc """
  Builds a changeset based on the `struct` and `params`.
  """
  def changeset(struct, params \\ %{}) do
    struct
    |> cast(params, [:url, :title, :created_by])
    |> validate_required([:url])
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

end
