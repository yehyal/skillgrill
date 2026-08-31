import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Session } from "@supabase/supabase-js"

const mocks = vi.hoisted(() => {
  const listeners = new Set<(event: string, session: Session | null) => void>()
  const auth = {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(
      (callback: (event: string, session: Session | null) => void) => {
        listeners.add(callback)
        return {
          data: {
            subscription: {
              unsubscribe: vi.fn(() => listeners.delete(callback)),
            },
          },
        }
      }
    ),
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
  }

  return { auth, client: { auth }, listeners }
})

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: vi.fn(() => mocks.client),
}))

import { AppHeader } from "@/components/app-header"
import { AuthProvider, useAuth } from "@/lib/auth/auth-provider"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

const browserClientMock = vi.mocked(getSupabaseBrowserClient)

function createSession(userMetadata: Record<string, unknown> = {}) {
  return {
    access_token: "access-token",
    refresh_token: "refresh-token",
    expires_in: 3600,
    expires_at: 1_900_000_000,
    token_type: "bearer",
    user: {
      id: "github-user-id",
      aud: "authenticated",
      role: "authenticated",
      email: "developer@example.com",
      email_confirmed_at: "2026-08-31T00:00:00.000Z",
      phone: "",
      confirmed_at: "2026-08-31T00:00:00.000Z",
      last_sign_in_at: "2026-08-31T00:00:00.000Z",
      app_metadata: { provider: "github", providers: ["github"] },
      user_metadata: userMetadata,
      identities: [],
      created_at: "2026-08-31T00:00:00.000Z",
      updated_at: "2026-08-31T00:00:00.000Z",
      is_anonymous: false,
    },
  } as unknown as Session
}

function AuthProbe() {
  const { error, signInWithGitHub, signOut, status, user } = useAuth()

  return (
    <div>
      <output data-testid="auth-status">{status}</output>
      <output data-testid="auth-user">{user?.id ?? "none"}</output>
      {error ? <div data-testid="auth-error">{error.message}</div> : null}
      <button type="button" onClick={() => void signInWithGitHub()}>
        Test sign in
      </button>
      <button type="button" onClick={() => void signOut()}>
        Test sign out
      </button>
    </div>
  )
}

function renderWithAuth(child: React.ReactNode) {
  return render(<AuthProvider>{child}</AuthProvider>)
}

describe("AuthProvider", () => {
  beforeEach(() => {
    browserClientMock.mockReturnValue(mocks.client as never)
    mocks.listeners.clear()
    mocks.auth.getSession.mockReset()
    mocks.auth.onAuthStateChange.mockClear()
    mocks.auth.signInWithOAuth.mockReset()
    mocks.auth.signOut.mockReset()
    mocks.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
    window.history.replaceState({}, "", "/")
  })

  it("renders the anonymous state for a guest", async () => {
    renderWithAuth(<AuthProbe />)

    await waitFor(() => expect(screen.getByTestId("auth-status")).toHaveTextContent("anonymous"))
    expect(screen.getByTestId("auth-user")).toHaveTextContent("none")
  })

  it("renders the GitHub sign-in control for a guest", async () => {
    renderWithAuth(<AppHeader />)

    expect(await screen.findByRole("button", { name: "Sign in with GitHub" })).toBeInTheDocument()
  })

  it("keeps the loading skeleton while the initial session is pending", () => {
    mocks.auth.getSession.mockReturnValue(new Promise(() => undefined))

    renderWithAuth(
      <>
        <AppHeader />
        <AuthProbe />
      </>
    )

    expect(screen.getByTestId("auth-status")).toHaveTextContent("loading")
    expect(screen.getByRole("status", { name: "Loading account" })).toBeInTheDocument()
  })

  it("fails closed when public Supabase values are missing", () => {
    browserClientMock.mockReturnValue(null)

    renderWithAuth(
      <>
        <AppHeader />
        <AuthProbe />
      </>
    )

    expect(screen.getByTestId("auth-status")).toHaveTextContent("unavailable")
    expect(screen.getByRole("button", { name: "GitHub sign-in unavailable" })).toBeDisabled()
    expect(screen.getByRole("alert")).toHaveTextContent(
      "GitHub sign-in is unavailable until Supabase is configured."
    )
  })

  it("renders a safe GitHub fallback when authenticated metadata is missing", async () => {
    mocks.auth.getSession.mockResolvedValue({
      data: { session: createSession() },
      error: null,
    })

    renderWithAuth(<AppHeader />)

    expect(
      await screen.findByRole("button", { name: "Open account menu for GitHub user" })
    ).toBeInTheDocument()
    expect(screen.getByText("GU")).toBeInTheDocument()
  })

  it("starts GitHub OAuth with a safe callback and no elevated scopes", async () => {
    const signInError = new Error("OAuth unavailable")
    mocks.auth.signInWithOAuth.mockResolvedValue({
      data: { provider: "github", url: null },
      error: signInError,
    })
    window.history.replaceState({}, "", "/reviews?tab=recent#top")

    renderWithAuth(<AuthProbe />)
    await waitFor(() => expect(screen.getByTestId("auth-status")).toHaveTextContent("anonymous"))
    fireEvent.click(screen.getByRole("button", { name: "Test sign in" }))

    await waitFor(() => expect(screen.getByTestId("auth-status")).toHaveTextContent("error"))
    expect(mocks.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=%2Freviews%3Ftab%3Drecent%23top`,
      },
    })
  })

  it("keeps the session and announces a local sign-out failure", async () => {
    mocks.auth.getSession.mockResolvedValue({
      data: { session: createSession({ user_name: "octocat", name: "The Octocat" }) },
      error: null,
    })
    mocks.auth.signOut.mockResolvedValue({ error: new Error("Storage unavailable") })

    renderWithAuth(
      <>
        <AppHeader />
        <AuthProbe />
      </>
    )
    await screen.findByRole("button", { name: "Open account menu for octocat" })
    fireEvent.click(screen.getByRole("button", { name: "Test sign out" }))

    expect(await screen.findByTestId("auth-error")).toHaveTextContent(
      "Storage unavailable"
    )
    expect(mocks.auth.signOut).toHaveBeenCalledWith({ scope: "local" })
    expect(
      screen.getByRole("button", { name: "Open account menu for octocat" })
    ).toBeInTheDocument()
  })

  it("returns to the guest state after a successful local sign-out", async () => {
    mocks.auth.getSession.mockResolvedValue({
      data: { session: createSession({ user_name: "octocat" }) },
      error: null,
    })
    mocks.auth.signOut.mockResolvedValue({ error: null })

    renderWithAuth(
      <>
        <AppHeader />
        <AuthProbe />
      </>
    )
    await screen.findByRole("button", { name: "Open account menu for octocat" })
    fireEvent.click(screen.getByRole("button", { name: "Test sign out" }))

    expect(await screen.findByRole("button", { name: "Sign in with GitHub" })).toBeInTheDocument()
  })
})
