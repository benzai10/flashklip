defmodule Flashklip.MetavideoTest do
  use Flashklip.ModelCase

  alias Flashklip.Metavideo

  @valid_attrs %{created_by: 42, title: "some content", url: "some content"}
  @invalid_attrs %{}

  test "changeset with valid attributes" do
    changeset = Metavideo.changeset(%Metavideo{}, @valid_attrs)
    assert changeset.valid?
  end

  test "changeset with invalid attributes" do
    changeset = Metavideo.changeset(%Metavideo{}, @invalid_attrs)
    refute changeset.valid?
  end
end
