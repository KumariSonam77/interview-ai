import { createBrowserRouter } from "react-router";
import Login from "./Features/auth/pages/login";
import Register from "./Features/auth/pages/Register";
import Protected from "./Features/auth/components/protected";
import Home from "./Features/interview/pages/Home";
import Interview from "./Features/interview/pages/interview";

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

    },{
        path:"/interview/:interviewId",
        element:<Protected><Interview /></Protected>
    }
]);