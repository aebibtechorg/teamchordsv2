import PricingCards from "../components/PricingCards";
import { useAuth0 } from "@auth0/auth0-react";
import {useEffect} from "react";

const Pricing = () => {
  const { isAuthenticated } = useAuth0();

  useEffect(() => {
    return () => {
      localStorage.removeItem("pendingPlanCheckout");
    };
  }, []);
  
  return <PricingCards isAuthenticated={isAuthenticated} />;
};

export default Pricing;