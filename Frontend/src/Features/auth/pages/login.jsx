import React,{useState} from 'react'
import {useNavigate,Link} from "react-router"
import"../auth.form.scss"
import { useAuth } from '../hooks/useAuth'

const Login = () => {

  const {loading, error, handleLogin}=useAuth()
  const navigate = useNavigate()

  const [email, setemail] = useState("")
  const [password, setpassword] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    const success = await handleLogin({email,password})
    if (success) navigate('/home')
  }
  if(loading){
    return(
      <main className="auth-page">
        <div className="loading-state"><span className="loading-spinner" />Preparing your workspace...</div>
      </main>
    )
  }

  return (
    <main className="auth-page">
      <div className="form-container">
        <div className="auth-kicker">AI INTERVIEW COACH</div>
        <h1>Welcome back<span className="highlight">.</span></h1>
        <p className="form-subtitle">Sign in to continue building interview confidence.</p>
        <form onSubmit={handleSubmit}>

          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input required
            onChange={(e)=>{setemail(e.target.value)}}
            type="email" id="email" name="email" placeholder='Enter email address'/>
          </div>
          <div className="input-group">
            <label htmlFor="password">password</label>
            <input required
            onChange={(e)=>{setpassword(e.target.value)}}
             type="password" id="password" name="password" placeholder='Enter password'/>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className='button primary-button' disabled={loading}>Sign in</button>
        </form>

        <p> Don't have an account? <Link to={"/register"}>Register</Link></p>
      </div>
    </main>
  )
}

export default Login