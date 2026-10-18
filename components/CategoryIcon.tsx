"use client";

import React from "react";
import {
  ShoppingCart,
  Utensils,
  Car,
  Home,
  Zap,
  Film,
  Wallet,
  Tag,
  CircleDollarSign,
  Landmark,
  Banknote,
  PiggyBank,
  CreditCard,
  Coins,
  type LucideProps,
} from "lucide-react";

interface CategoryIconProps extends LucideProps {
  name: string;
}

export function CategoryIcon({ name, ...props }: CategoryIconProps) {
  switch (name) {
    case "ShoppingCart":
      return <ShoppingCart {...props} />;
    case "Utensils":
      return <Utensils {...props} />;
    case "Car":
      return <Car {...props} />;
    case "Home":
      return <Home {...props} />;
    case "Zap":
      return <Zap {...props} />;
    case "Film":
      return <Film {...props} />;
    case "Wallet":
      return <Wallet {...props} />;
    case "CircleDollarSign":
      return <CircleDollarSign {...props} />;
    case "Landmark":
      return <Landmark {...props} />;
    case "Banknote":
      return <Banknote {...props} />;
    case "PiggyBank":
      return <PiggyBank {...props} />;
    case "CreditCard":
      return <CreditCard {...props} />;
    case "Coins":
      return <Coins {...props} />;
    default:
      return <Tag {...props} />;
  }
}
