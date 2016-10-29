defmodule Flashklip.Repo.Migrations.AddFlagsToKlip do
  use Ecto.Migration

  def change do
    alter table(:klips) do
      # add :copy_from, :integer, default: 0
      add :is_copy, :boolean, default: false
      add :in_timeview, :boolean, default: :true
    end
  end
end
