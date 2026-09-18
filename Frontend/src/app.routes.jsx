import { createBrowserRouter } from "react-router";
import Login from "./Features/auth/pages/login";
import Register from "./Features/auth/pages/Register";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <Login />
    },
    {
        path: "/login",
        element: <Login />
    },
    {
        path: "/register",
        element: <Register />
    }
]);