defmodule Flashklip.User do
	use Flashklip.Web, :model
  alias Flashklip.Repo

	schema "users" do
		field :email, :string
		field :username, :string
    field :access_token, :string
    field :role, :string
    has_many :videos, Flashklip.Video, on_delete: :delete_all
    has_many :klips, Flashklip.Klip, on_delete: :delete_all

		timestamps
	end

	def changeset(model, params \\ :empty) do
		model
		# |> cast(params, ~w(email access_token), [])
    |> cast(params, [:email, :access_token])
    |> update_change(:email, &String.downcase/1)
    |> validate_required([:email])
    |> unique_constraint(:email)
    |> unique_constraint(:access_token)
	end

  def username_changeset(struct, params) do
    struct
    |> cast(params, [:username])
    |> validate_required([:username])
		|> validate_length(:username, min: 4, max: 20)
    |> validate_format(:username, ~r/^(?=.{4,20}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/)
    |> unique_constraint(:username)
  end

  ### passwordless auth
  def registration_changeset(struct, params \\ %{}) do
    struct
    |> changeset(params)
    |> generate_access_token
  end

  defp generate_access_token(struct) do
    token = SecureRandom.hex(30)

    case Repo.get_by(__MODULE__, access_token: token) do
      nil ->
        put_change(struct, :access_token, token)
      _ ->
        generate_access_token(struct)
    end
  end
end
