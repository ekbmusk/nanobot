import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { z } from 'zod'
import { adminAPI } from '../api/admin'
import { setAuthToken } from '../utils/auth'

const schema = z.object({
  username: z.string().min(1, 'Логин енгізіңіз'),
  password: z.string().min(1, 'Құпиясөз енгізіңіз'),
})

export default function Login() {
  const [shake, setShake] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { username: '', password: '' },
  })

  const onSubmit = async (values) => {
    try {
      const data = await adminAPI.login(values)
      const token = data?.token || data?.access_token
      if (!token) throw new Error('Token табылмады')
      setAuthToken(token)
      toast.success('Сәтті кірдіңіз')
      const nextPath = location.state?.from?.pathname || '/'
      navigate(nextPath, { replace: true })
    } catch (error) {
      setShake(true)
      setTimeout(() => setShake(false), 400)
      toast.error(error.message || 'Кіру қатесі')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4">
      <form
        className={`card w-full max-w-md space-y-4 p-6 ${shake ? 'animate-[shake_0.35s_ease]' : ''}`}
        onSubmit={handleSubmit(onSubmit)}
      >
        <div>
          <h1 className="text-2xl font-bold">Admin кіру</h1>
          <p className="text-sm text-text-2">Physics Nano басқару панелі</p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-text-2">Логин</label>
          <input className="input" placeholder="admin" {...register('username')} />
          {errors.username && <p className="mt-1 text-xs text-danger">{errors.username.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-text-2">Құпиясөз</label>
          <input type="password" className="input" placeholder="••••••••" {...register('password')} />
          {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
        </div>

        <button className="btn-primary w-full" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Кіру...' : 'Кіру'}
        </button>
      </form>
    </div>
  )
}
