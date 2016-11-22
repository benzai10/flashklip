defmodule Flashklip.Video do
  use Flashklip.Web, :model
  use Timex
  require IEx

  @primary_key {:id, Flashklip.Permalink, autogenerate: true}

  schema "videos" do
    field :url, :string, virtual: true
    field :tags, {:array, :string}, virtual: true
    field :title, :string
    field :slug, :string
    field :scheduled_at, Timex.Ecto.DateTime
    belongs_to :user, User
    belongs_to :metavideo, Flashklip.Metavideo
    belongs_to :category, Flashklip.Category
    has_many :klips, Flashklip.Klip, on_delete: :delete_all

    timestamps()
  end

  @required_fields ~w()
  @optional_fields ~w(title tags user_id metavideo_id category_id scheduled_at)

  @doc """
  Builds a changeset based on the `struct` and `params`.
  """

  def changeset(struct, params \\ %{}) do
    struct
    |> cast(params, @required_fields, @optional_fields)
    |> cast_assoc(:metavideo)
    |> slugify_title()
  end

  def schedule_changeset(struct, params \\ %{}) do
    struct
    |> change
    |> set_scheduled_date(params["scheduled_at"])
  end

  defp set_scheduled_date(changeset, scheduled_at) do
    case scheduled_at do
      "none" -> put_change(changeset, :scheduled_at, nil)
      "tomorrow" ->
        put_change(changeset, :scheduled_at, Timex.shift(Timex.now, days: 1))
      "3d" ->
        put_change(changeset, :scheduled_at, Timex.shift(Timex.now, days: 3))
      "1w" ->
        put_change(changeset, :scheduled_at, Timex.shift(Timex.now, weeks: 1))
      "1m" ->
        put_change(changeset, :scheduled_at, Timex.shift(Timex.now, months: 1))
      "6m" ->
        put_change(changeset, :scheduled_at, Timex.shift(Timex.now, months: 6))
      _ -> put_change(changeset, :scheduled_at, nil)
    end
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
