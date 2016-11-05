defmodule Flashklip.Mailer do
  alias Flashklip.{Endpoint, Router, User}
  use Mailgun.Client,
    # domain: Application.get_env(:flashklip, :mailgun_domain),
    # key: Application.get_env(:flashklip, :mailgun_key)
    domain: "https://api.mailgun.net/v3/sandbox4b323e6043014043a66a753c03dee035.mailgun.org",
    key: "key-7b853c6aed26bb87539ad3ae783d2b7a"

  def send_login_token(%User{email: email, access_token: token}) do
    send_email to: email,
      from: "hello@flashklip.com",
      subject: "Your token",
      text: "Access your account #{token_url(token)}"
  end

  defp token_url(token) do
    Router.Helpers.session_url(Endpoint, :show, token)
  end
end
