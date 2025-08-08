"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { SignInButton } from "./sign-in-button";
export function Connect() {
    const account = useAccount();
    const { disconnect } = useDisconnect();
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => setIsMounted(true), []);
    if (!isMounted)
        return null;
    if (!account.address)
        return _jsx(SignInButton, {});
    return (_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("div", { className: "text-gray-500 font-medium", children: ["Signed in as ", account.address.slice(0, 6), "...", account.address.slice(-4)] }), _jsx("button", { onClick: () => disconnect(), className: "bg-red-100 hover:bg-red-200 text-red-500 font-medium py-2 px-8 rounded-xl transition-colors duration-200", children: "Sign out" })] }));
}
