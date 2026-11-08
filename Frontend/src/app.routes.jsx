import { createBrowserRouter } from "react-router";
import Login from "./Features/auth/pages/login";
import Register from "./Features/auth/pages/Register";
import Protected from "./Features/auth/components/protected";
import Home from "./Features/interview/pages/Home";

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
        element:<Protected><Home /></Protected>

    }
]);