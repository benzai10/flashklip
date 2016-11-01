defmodule Flashklip.Video do
  use Flashklip.Web, :model

  alias Flashklip.{
    User,
    Metavideo,
    Video,
    Category,
    Klip
  }

  @primary_key {:id, Flashklip.Permalink, autogenerate: true}

  schema "videos" do
    field :url, :string, virtual: true
    field :tags, {:array, :string}, virtual: true
    field :title, :string
    field :slug, :string
    belongs_to :user, User
    belongs_to :metavideo, Metavideo
    belongs_to :category, Category
    has_many :klips, Klip, on_delete: :delete_all

    timestamps()
  end

  @required_fields ~w()
  @optional_fields ~w(title tags user_id metavideo_id category_id)

  @doc """
  Builds a changeset based on the `struct` and `params`.
  """

  def changeset(struct, params \\ %{}) do
    struct
    |> cast(params, @required_fields, @optional_fields)
    |> slugify_title()
  end

  defp slugify_title(changeset) do
    if title = get_change(changeset, :title) do
      put_change(changeset, :slug, slugify(title))
    else
      changeset
    end
  end

  defp slugify(str) do
    str
    |> String.downcase()
    |> String.replace(~r/[^\w-]+/u, "-")
  end
end

defimpl Phoenix.Param, for: Video do
  def to_param(%{slug: slug, id: id}) do
    "#{id}-#{slug}"
  end
end
