# This file is responsible for configuring your application
# and its dependencies with the aid of the Mix.Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.
use Mix.Config

# General application configuration
config :flashklip,
  ecto_repos: [Flashklip.Repo]

# Configures the endpoint
config :flashklip, Flashklip.Endpoint,
  url: [host: "localhost"],
  secret_key_base: "ofb3sAjFYjIhRNGHjgH8wiTZdFZwEOTsVzzkTfD9dtuALRnmy1BFfz8qRwpUxLal",
  render_errors: [view: Flashklip.ErrorView, accepts: ~w(html json)],
  pubsub: [name: Flashklip.PubSub,
           adapter: Phoenix.PubSub.PG2]

# Configures Scrivener.HTML
config :scrivener_html,
  routes_helper: Flashklip.Router.Helpers

# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{Mix.env}.exs"
