defmodule Flashklip.Repo.Migrations.CreateMetavideo do
  use Ecto.Migration

  def change do
    create table(:metavideos) do
      add :url, :string
      add :title, :string
      add :created_by, :integer

      timestamps()
    end

  end
end
