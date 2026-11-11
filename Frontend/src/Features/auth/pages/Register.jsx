import React,{useState} from 'react'
import {useNavigate,Link} from "react-router"
import {useAuth} from '../hooks/useAuth'
import "../auth.form.scss"

const Register = () => {
  const navigate = useNavigate()
  const [username, setusername] = useState("")
  const [email, setemail] = useState("")
  const [password, setpassword] = useState("")

  const {loading, error, handleRegister}=useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const success = await handleRegister({username, email, password})
    if (success) navigate('/home')
  }

  if(loading){
    return(
      <main className="auth-page">
        <div className="loading-state"><span className="loading-spinner" />Creating your workspace...</div>
      </main>
    )
  }
  return (
       <main className="auth-page">
      <div className="form-container">
        <div className="auth-kicker">START PREPARING</div>
        <h1>Create your account<span className="highlight">.</span></h1>
        <p className="form-subtitle">Turn your resume into a focused interview plan.</p>
        <form onSubmit={handleSubmit}>

          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input required minLength="2"
             onChange={(e)=>{setusername(e.target.value)}}
             type="text" id="username" name="username" placeholder='Enter username'/>
          </div>

          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input required
             onChange={(e)=>{setemail(e.target.value)}}
             type="email" id="email" name="email" placeholder='Enter email address'/>
          </div>
          <div className="input-group">
            <label htmlFor="password">password</label>
            <input required minLength="8"
            onChange={(e)=>{setpassword(e.target.value)}}
            type="password" id="password" name="password" placeholder='Enter password'/>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className='button primary-button' disabled={loading}>Create account</button>
        </form>

        <p> Already have an account? <Link to={"/login"}>Login</Link></p>
      </div>
    </main>
  )
}

export default Register