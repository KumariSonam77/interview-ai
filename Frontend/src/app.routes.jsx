import { createBrowserRouter } from "react-router";
import Login from "./Features/auth/pages/login";
import Register from "./Features/auth/pages/Register";
import Protected from "./Features/auth/components/protected";

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
    },{
        path: "/home",
        element:<Protected><h1>Home Page</h1></Protected>

    }
]);