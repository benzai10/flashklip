defmodule Flashklip.Klip do
  use Flashklip.Web, :model

  schema "klips" do
    field :content, :string
    field :at, :integer
    field :is_copy, :boolean
    field :in_timeview, :boolean
    belongs_to :user, Flashklip.User
    belongs_to :video, Flashklip.Video

    timestamps()
  end

  @doc """
  Builds a changeset based on the `struct` and `params`.
  """
  def changeset(struct, params \\ %{}) do
    struct
    |> cast(params, [:content, :at])
    |> validate_required([:content, :at])
  end
end
