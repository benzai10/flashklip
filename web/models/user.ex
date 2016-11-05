defmodule Flashklip.User do
	use Flashklip.Web, :model
  alias Flashklip.Repo

	schema "users" do
		field :email, :string
		field :username, :string
		field :password, :string, virtual: true
		field :password_hash, :string
    field :access_token, :string
    field :role, :string
    has_many :videos, Flashklip.Video, on_delete: :delete_all
    has_many :klips, Flashklip.Klip, on_delete: :delete_all

		timestamps
	end

	def changeset(model, params \\ :empty) do
		model
		# |> cast(params, ~w(email username), [])
    |> cast(params, [:email, :access_token])
    |> update_change(:email, &String.downcase/1)
    |> validate_required([:email])
    |> unique_constraint(:email)
    |> unique_constraint(:access_token)
		# |> validate_length(:username, min: 1, max: 20)
    # |> unique_constraint(:username)
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


  ### classic auth
	# def registration_changeset(model, params) do
	# 	model
	# 	|> changeset(params)
	# 	|> cast(params, ~w(password), [])
	# 	|> validate_length(:password, min: 6, max: 100)
	# 	|> put_pass_hash()
	# end

	# defp put_pass_hash(changeset) do
	# 	case changeset do
	# 		%Ecto.Changeset{valid?: true, changes: %{password: pass}} ->
	# 			put_change(changeset, :password_hash, Comeonin.Bcrypt.hashpwsalt(pass))
	# 		_ ->
	# 			changeset
	# 	end
	# end
end
