import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { getProfile } from '../utils/common'
import { useProfileStore } from '../store/useProfileStore'
import Spinner from '../components/Spinner'

const AuthCallback = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading } = useAuth0()
  const { setUserProfile } = useProfileStore()

  useEffect(() => {
    const fetchProfile = async () => {
      if (isLoading) return
      if (isAuthenticated && user?.sub) {
        const d = await getProfile(user.sub)
        if (d) {
          setUserProfile(d)
          const hasOrgs = (d.organizations && d.organizations.length > 0) || (d.Organizations && d.Organizations.length > 0);
          if (hasOrgs) {
            const pendingPlan = localStorage.getItem("pendingPlanCheckout");
            navigate(pendingPlan ? "/pricing?checkout=1" : "/library");
          } else {
            navigate('/onboard')
          }
        }
      } else {
        // if not authenticated, redirect to signin
        navigate('/signin')
      }
    }
    fetchProfile()
  }, [isAuthenticated, isLoading, user, setUserProfile, navigate])

  return (
    <div className="flex items-center justify-center h-screen">
      <Spinner />
    </div>
  )
}

export default AuthCallback
