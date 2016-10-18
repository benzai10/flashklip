defmodule Flashklip.Repo.Migrations.CreateKlip do
  use Ecto.Migration

  def change do
    create table(:klips) do
      add :content, :text
      add :at, :integer
      add :user_id, references(:users, on_delete: :nothing)
      add :video_id, references(:videos, on_delete: :nothing)

      timestamps()
    end
    create index(:klips, [:user_id])
    create index(:klips, [:video_id])

  end
end
