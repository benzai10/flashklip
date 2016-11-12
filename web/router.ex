defmodule Flashklip.Router do
  use Flashklip.Web, :router

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_flash
    plug :protect_from_forgery
    plug :put_secure_browser_headers
    # plug Flashklip.Auth, repo: Flashklip.Repo
    plug Flashklip.Auth
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/", Flashklip do
    pipe_through :browser # Use the default browser stack

    get "/", PageController, :index
    get "/explore", PageController, :explore
		resources "/users", UserController, only: [:index, :show, :new, :create, :update]
    # resources "/sessions", SessionController, only: [:new, :create, :delete]
    resources "/sessions", SessionController, only: [:new, :create, :show]
    resources "/session", SessionController, only: [:delete], singleton: true
    get "/watch/:id", WatchController, :show
    get "/.well-known/acme-challenge/:id", PageController, :letsencrypt
  end

  # Other scopes may use custom stacks.
  # scope "/api", Flashklip do
  #   pipe_through :api
  # end

  scope "/my", Flashklip do
    # pipe_through [:browser, :authenticate_user]
    pipe_through [:browser]

    resources "/videos", VideoController
  end

  scope "/manage", Flashklip do
    # pipe_through [:browser, :authenticate_user]
    pipe_through [:browser]

    resources "/metavideos", MetavideoController
  end
end
