import PricingCards from "../components/PricingCards";
import { useAuth0 } from "@auth0/auth0-react";

const Pricing = () => {
  const { isAuthenticated } = useAuth0();
  return <PricingCards isAuthenticated={isAuthenticated} />;
};

export default Pricing;