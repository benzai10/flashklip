defmodule Flashklip.Repo.Migrations.AddScheduledAtToVideo do
  use Ecto.Migration

  def change do
    alter table(:videos) do
      add :scheduled_at, :datetime
    end
  end
end
