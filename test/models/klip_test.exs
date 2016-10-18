defmodule Flashklip.KlipTest do
  use Flashklip.ModelCase

  alias Flashklip.Klip

  @valid_attrs %{at: 42, content: "some content"}
  @invalid_attrs %{}

  test "changeset with valid attributes" do
    changeset = Klip.changeset(%Klip{}, @valid_attrs)
    assert changeset.valid?
  end

  test "changeset with invalid attributes" do
    changeset = Klip.changeset(%Klip{}, @invalid_attrs)
    refute changeset.valid?
  end
end
