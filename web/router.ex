defmodule Flashklip.Router do
  use Flashklip.Web, :router

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_flash
    plug :protect_from_forgery
    plug :put_secure_browser_headers
    plug Flashklip.Auth, repo: Flashklip.Repo
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/", Flashklip do
    pipe_through :browser # Use the default browser stack

    get "/", PageController, :index
		resources "/users", UserController, only: [:index, :show, :new, :create]
    resources "/sessions", SessionController, only: [:new, :create, :delete]
    get "/watch/:id", WatchController, :show
  end

  # Other scopes may use custom stacks.
  # scope "/api", Flashklip do
  #   pipe_through :api
  # end

  scope "/manage", Flashklip do
    pipe_through [:browser, :authenticate_user]

    resources "/metavideos", MetavideoController
    resources "/videos", VideoController
  end
end
