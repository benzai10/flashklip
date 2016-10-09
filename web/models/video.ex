defmodule Flashklip.Video do
  use Flashklip.Web, :model

  schema "videos" do
    field :title, :string
    belongs_to :user, Flashklip.User
    belongs_to :metavideo, Flashklip.Metavideo
    belongs_to :category, Flashklip.Category

    timestamps()
  end

  @required_fields ~w(title)
  @optional_fields ~w(user_id metavideo_id category_id)

  @doc """
  Builds a changeset based on the `struct` and `params`.
  """

  def changeset(struct, params \\ %{}) do
    struct
    |> cast(params, @required_fields, @optional_fields)
  end
end
