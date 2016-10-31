defmodule Flashklip.Repo.Migrations.AddTagsToMetavideo do
  use Ecto.Migration

  def change do
    alter table(:metavideos) do
      add :tags, {:array, :string}, default: []
    end
  end
end
