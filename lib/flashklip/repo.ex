defmodule Flashklip.Repo do
  use Ecto.Repo, otp_app: :flashklip
  use Scrivener, page_size: 50
end
