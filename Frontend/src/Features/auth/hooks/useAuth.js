import { useContext , useEffect} from "react";
import { AuthContext } from "../auth.context";
import { login, register, logout, getMe } from "../services/auth.api";
export const useAuth =() => {
    const context = useContext(AuthContext)
    const { user,setUser,loading,setLoading,error,setError}=context;

    const handleLogin = async ({email, password})=>{
        setLoading(true)
        setError("")
        try{
        const data = await login({email,password})
        setUser(data.user)
        return true
        }catch(err){
        setError(err.response?.data?.message || "Unable to sign in")
        return false
        }finally{
        setLoading(false)
        }
    }

    const handleRegister = async ({username, email, password})=>{
        setLoading(true)
        setError("")
        try{
        const data = await register({ username, email, password})
        setUser(data.user)
        return true
        }catch(err){
        setError(err.response?.data?.message || "Unable to create your account")
        return false
        }finally{
        setLoading(false)
        }
    }
    const handleLogout = async ()=>{
        setLoading(true)
        try{
        await logout()
        setUser(null)
        }catch(err){
        setError(err.response?.data?.message || "Unable to sign out")
        }finally{
        setLoading(false)
        }
    }

      useEffect(()=>{
    const getAndSetUser = async()=>{
        try{
        const data = await getMe()
        setUser(data.user)
        }catch {
            setUser(null)
        }finally{
            setLoading(false)
        }
    }
    getAndSetUser()
  },[setUser,setLoading])
    return{user,loading,error,handleRegister,handleLogin,handleLogout}
}