"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { SignInButton } from "./sign-in-button";
import { Tip } from "./tip";
export function Demo() {
    const account = useAccount();
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => setIsMounted(true), []);
    if (!isMounted)
        return null;
    if (!account.address)
        return _jsx(SignInButton, { children: "Sign in to try" });
    return _jsx(Tip, {});
}
