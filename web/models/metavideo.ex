defmodule Flashklip.Metavideo do
  use Flashklip.Web, :model

  schema "metavideos" do
    field :url, :string
    field :title, :string
    field :created_by, :integer
    has_many :metavideos, Flashklip.Metavideo

    timestamps()
  end

  @required_fields ~w(url)
  @optional_fields ~w(title, created_by)

  @doc """
  Builds a changeset based on the `struct` and `params`.
  """
  def changeset(struct, params \\ %{}) do
    struct
    |> cast(params, [:url, :title, :created_by])
    |> validate_required([:url, :title, :created_by])
  end
end
