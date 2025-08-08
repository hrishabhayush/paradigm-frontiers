"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { SignInButton } from "./sign-in-button";
import { Tip } from "./tip";

export function Demo() {
  const account = useAccount();

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  if (!isMounted) return null;

  if (!account.address) return <SignInButton>Sign in to try</SignInButton>;

  return <Tip />;
}
