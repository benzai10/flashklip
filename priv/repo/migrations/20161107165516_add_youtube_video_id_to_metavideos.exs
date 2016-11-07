defmodule Flashklip.Repo.Migrations.AddYoutubeVideoIdToMetavideos do
  use Ecto.Migration

  def change do
    alter table(:metavideos) do
      add :youtube_video_id, :string
    end

    create unique_index(:metavideos, [:youtube_video_id])
  end
end
