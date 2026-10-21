/**
 * Entry point for the IBDC application.
 *
 * Redirects the root URL (/) to the MainScreen.
 */

import { Redirect } from "expo-router";
import { createElement } from "react";

export default function Index() {
    return createElement(Redirect, { href: "/MainScreen" });
}