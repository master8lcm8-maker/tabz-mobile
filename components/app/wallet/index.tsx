import React from "react";
import OwnerWalletScreen from "../../OwnerWalletScreen";

export default function WalletHomeRoute() {
  // OwnerWalletScreen will use the unified session/token helpers internally.
  return <OwnerWalletScreen />;
}
