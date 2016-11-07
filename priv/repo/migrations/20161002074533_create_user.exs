defmodule Flashklip.Repo.Migrations.CreateUser do
  use Ecto.Migration

  def change do
		create table(:users) do
			add :email, :string
			add :username, :string, null: false

			timestamps
		end

		create unique_index(:users, [:username])
  end
end
