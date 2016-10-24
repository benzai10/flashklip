defmodule Flashklip.Metavideo do
  use Flashklip.Web, :model

  schema "metavideos" do
    field :url, :string
    field :title, :string
    field :created_by, :integer
    has_many :videos, Flashklip.Video

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

  def existing_user_video(videos, user_id \\ 0) do
    Enum.filter(videos, fn(v) -> v.user_id == user_id end)
    |> Enum.at(0)
  end

end
