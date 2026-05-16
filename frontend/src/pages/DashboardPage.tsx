import { LogoutButton } from "../components/LogoutButton"
import { UsersManager } from "../components/UsersManager"

export const DashboardPage = () => {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Dashboard (Securely Authenticated)</h1>
      <LogoutButton />
      <UsersManager />
    </div>
  )
}