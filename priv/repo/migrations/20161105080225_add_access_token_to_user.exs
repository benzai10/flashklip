defmodule Flashklip.Repo.Migrations.AddAccessTokenToUser do
  use Ecto.Migration

  def change do
    alter table(:users) do
      add :access_token, :string
    end

    create unique_index(:users, [:email])
    create unique_index(:users, [:access_token])
  end
end
