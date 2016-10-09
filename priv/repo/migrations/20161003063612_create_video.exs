defmodule Flashklip.Repo.Migrations.CreateVideo do
  use Ecto.Migration

  def change do
    create table(:videos) do
      add :title, :string
      add :user_id, references(:users, on_delete: :nothing)
      add :metavideo_id, references(:metavideos, on_delete: :nothing)
      add :category_id, references(:categories, on_delete: :nothing)

      timestamps()
    end
    create index(:videos, [:user_id])
    create index(:videos, [:metavideo_id])
    create index(:videos, [:category_id])

  end
end
